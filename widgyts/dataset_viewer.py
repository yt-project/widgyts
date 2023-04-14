import json

import ipywidgets
import matplotlib.cm as mcm
import matplotlib.colors as mcolors
import numpy as np
import pythreejs
import traitlets
from IPython.display import JSON, display
from ipywidgets import widget_serialization

import yt.utilities.lib.mesh_triangulation as mt
from yt.data_objects.api import Dataset
from yt.units import display_ytarray

from . import EXTENSION_VERSION

_CORNER_INDICES = np.array(
    [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7],
    dtype="uint32",
)


class DatasetViewerComponent(traitlets.HasTraits):
    ds = traitlets.Instance(Dataset)
    viewer = traitlets.ForwardDeclaredInstance("DatasetViewer")


class DatasetViewer(traitlets.HasTraits):
    ds = traitlets.Instance(Dataset)
    components = traitlets.List(trait=traitlets.Instance(DatasetViewerComponent))

    @traitlets.default("components")
    def _components_default(self):
        dv = DomainViewer(ds=self.ds, viewer=self)
        fdv = FieldDefinitionViewer(ds=self.ds, viewer=self)
        pv = ParametersViewer(ds=self.ds, viewer=self)
        if hasattr(self.ds.index, "grid_corners"):
            # Can't use += or append
            dv.domain_view_components = dv.domain_view_components + [
                AMRGridComponent(parent=dv)
            ]
        elif hasattr(self.ds.index, "meshes"):
            # here, we've got a nice li'l mesh
            dv.domain_view_components = dv.domain_view_components + [
                UnstructuredMeshComponent(parent=dv)
            ]
        return [dv, fdv, pv]

    def widget(self):
        tab = ipywidgets.Tab(
            children=[_.widget() for _ in self.components],
            layout=ipywidgets.Layout(height="500px"),
        )
        for i, c in enumerate(self.components):
            tab.set_title(i, c.name)
        return tab


class FieldDefinitionViewer(DatasetViewerComponent):
    name = "Fields"

    def widget(self):
        out = ipywidgets.Output()
        with out:
            display(self.ds.fields)
        return out


class DomainViewer(DatasetViewerComponent):
    name = "Domain Viewer"
    renderer = traitlets.Instance(pythreejs.Renderer)
    domain_view_components = traitlets.List(
        trait=traitlets.ForwardDeclaredInstance("DomainViewComponent")
    )

    @traitlets.default("domain_view_components")
    def _domain_view_components_default(self):
        return [CameraPathView(parent=self), AxesView(parent=self)]

    @traitlets.observe("domain_view_components")
    def _update_domain_view_components(self, change):
        # The renderer needs to be updated here, but we should not need to update
        # individual widgets.
        # We retain the first two, which will be the camera and an ambient light source.
        new_children = []
        for c in change["new"]:
            new_children.extend(c.view)
        self.renderer.scene.children = self.renderer.scene.children[:2] + tuple(
            new_children
        )

    @traitlets.default("renderer")
    def _renderer_default(self):
        center = tuple(self.ds.domain_center.in_units("unitary").d)
        right = tuple(
            (
                self.ds.domain_right_edge
                + (self.ds.domain_right_edge - self.ds.domain_center) * 2.0
            )
            .in_units("unitary")
            .d
        )
        camera = pythreejs.PerspectiveCamera(
            position=right,
            fov=20,
            children=[pythreejs.AmbientLight()],
            near=1e-2,
            far=2e3,
        )
        children = [camera, pythreejs.AmbientLight(color="#dddddd")]
        for c in self.domain_view_components:
            children.extend(c.view)
        scene = pythreejs.Scene(children=children)
        orbit_control = pythreejs.OrbitControls(controlling=camera)
        renderer = pythreejs.Renderer(
            scene=scene,
            camera=camera,
            controls=[orbit_control],
            width=400,
            height=400,
            background="black",
            background_opacity=1,
            antialias=True,
        )
        camera.lookAt(center)
        orbit_control.target = center
        renderer.layout.border = "1px solid darkgrey"
        return renderer

    def widget(self):
        tab = ipywidgets.Tab(children=[], layout=ipywidgets.Layout(width="auto"))

        def _update_tabs(change):
            tab.children = [_.widget() for _ in self.domain_view_components]
            for i, c in enumerate(self.domain_view_components):
                tab.set_title(i, f"{c.display_name}")

        _update_tabs(None)
        self.observe(_update_tabs, ["domain_view_components"])

        return ipywidgets.AppLayout(
            center=self.renderer, right_sidebar=tab, pane_widths=[0, "420px", 1]
        )

    def add_particles(self, dobj, ptype="all", radii_field="particle_ones"):
        """
        This function accepts a data object, which is then queried for particle
        positions and (optionally) a 'radii' field.  This is then added as a
        component to the dataset viewer.
        """
        pos = dobj[ptype, "particle_position"]
        radii = dobj[ptype, radii_field]
        pv = ParticleComponent(positions=pos, radii=radii)
        self.domain_view_components = self.domain_view_components + [pv]


class DomainViewComponent(traitlets.HasTraits):
    parent = traitlets.Instance(DomainViewer)
    display_name = "Unknown"


class CameraPathView(DomainViewComponent):
    display_name = "Camera"
    position_list = traitlets.List([])

    @property
    def view(self):
        return []

    def widget(self):
        # Alright let's set this all up.
        button_add = ipywidgets.Button(description="Add Keyframe")
        button_rem = ipywidgets.Button(description="Delete Keyframe")

        camera_action_box = ipywidgets.Box([])

        def _mirror_positions():
            select.options = [
                (f"Position {i}", p) for i, p in enumerate(self.position_list)
            ]
            # Update our animation mixer tracks as well
            times = np.mgrid[0.0 : 10.0 : len(self.position_list) * 1j].astype("f4")
            if len(camera_action_box.children) > 0:
                camera_action_box.children[0].stop()
            camera_clip = pythreejs.AnimationClip(
                tracks=[
                    pythreejs.QuaternionKeyframeTrack(
                        ".quaternion",
                        values=[_["quaternion"] for _ in self.position_list],
                        times=times,
                    ),
                    pythreejs.VectorKeyframeTrack(
                        ".position",
                        values=[_["position"] for _ in self.position_list],
                        times=times,
                    ),
                    pythreejs.NumberKeyframeTrack(
                        ".scale",
                        values=[_["scale"] for _ in self.position_list],
                        times=times,
                    ),
                ]
            )
            camera_action_box.children = [
                pythreejs.AnimationAction(
                    pythreejs.AnimationMixer(self.parent.renderer.camera),
                    camera_clip,
                    self.parent.renderer.camera,
                )
            ]

        def on_button_add_clicked(b):
            state = self.parent.renderer.camera.get_state()

            self.position_list = self.position_list + [
                {attr: state[attr] for attr in ("position", "quaternion", "scale")}
            ]
            _mirror_positions()

        button_add.on_click(on_button_add_clicked)

        def on_button_rem_clicked(b):
            del self.position_list[select.index]
            _mirror_positions()

        button_rem.on_click(on_button_rem_clicked)

        select = ipywidgets.Select(options=[], disabled=False)

        def on_selection_changed(change):
            self.parent.renderer.camera.set_state(change["new"])

        select.observe(on_selection_changed, ["value"])

        center = self.parent.ds.domain_center.in_units("unitary").d

        def _create_clicked(axi, ax):
            def view_button_clicked(button):
                vec = [0, 0, 0]
                vec[axi] = 2.0
                self.parent.renderer.camera.position = tuple(
                    center + (self.parent.ds.domain_width.in_units("unitary").d * vec)
                )
                self.parent.renderer.camera.lookAt(center)

            return view_button_clicked

        view_buttons = []
        for axi, ax in enumerate("XYZ"):
            view_buttons.append(
                ipywidgets.Button(
                    description=ax,
                )
            )

            view_buttons[-1].on_click(_create_clicked(axi, ax))

        # This could probably be stuck into the _create_clicked function, but my
        # first attempt didn't work, so I'm writing it out here.
        def view_isometric(button):
            self.parent.renderer.camera.position = tuple(
                center + (self.parent.ds.domain_width.in_units("unitary").d * 2)
            )
            self.parent.renderer.camera.lookAt(center)

        view_buttons.append(
            ipywidgets.Button(
                description="◆",
            )
        )
        view_buttons[-1].on_click(view_isometric)

        boxrow_layout = ipywidgets.Layout(
            display="flex", flex_flow="row", align_items="stretch"
        )
        button_box_layout = ipywidgets.Layout(display="flex", flex_flow="column")
        button_box = ipywidgets.Box(
            children=[
                ipywidgets.Box(
                    [view_buttons[0], view_buttons[2]],
                    layout=boxrow_layout,
                ),
                ipywidgets.Box(
                    [view_buttons[1], view_buttons[3]],
                    layout=boxrow_layout,
                ),
                ipywidgets.Box(
                    [button_add, button_rem],
                    layout=boxrow_layout,
                ),
                ipywidgets.Box(
                    [ipywidgets.Label("Keyframes")],
                    layout=boxrow_layout,
                ),
                ipywidgets.Box(
                    [select],
                    layout=boxrow_layout,
                ),
                ipywidgets.Box(
                    [camera_action_box],
                    layout=boxrow_layout,
                ),
            ],
            layout=button_box_layout,
        )
        return ipywidgets.VBox(
            [
                button_box,
                _camera_widget(self.parent.renderer.camera, self.parent.renderer),
            ],
            layout=ipywidgets.Layout(width="auto"),
        )


class AxesView(DomainViewComponent):
    display_name = "Axes"
    domain_axes = traitlets.Instance(pythreejs.AxesHelper)

    @traitlets.default("domain_axes")
    def _domain_axes_default(self):
        offset_vector = (
            self.parent.ds.domain_left_edge - self.parent.ds.domain_center
        ).in_units("unitary") * 0.1
        position = tuple(
            (self.parent.ds.domain_left_edge + offset_vector).in_units("unitary").d
        )
        # We probably don't want to use the AxesHelper as it doesn't expose the
        # material, which can result in it not being easy to see.  But for now...
        ah = pythreejs.AxesHelper(
            position=position,
            scale=tuple(self.parent.ds.domain_width.in_units("unitary").d),
        )
        return ah

    @property
    def view(self):
        return [self.domain_axes]

    def widget(self):
        checkbox = ipywidgets.Checkbox(value=True, description="Visible")
        ipywidgets.jslink((checkbox, "value"), (self.domain_axes, "visible"))
        return ipywidgets.VBox(
            children=[checkbox], layout=ipywidgets.Layout(width="auto")
        )


class ParticleComponent(DomainViewComponent):
    r2_falloff = traitlets.Instance(pythreejs.Texture)
    display_name = "Particles"
    positions = traitlets.Instance(np.ndarray, allow_none=False)
    radii = traitlets.Instance(np.ndarray)
    particle_view = traitlets.Instance(pythreejs.Points)

    @traitlets.default("radii")
    def _radii_default(self):
        return np.ones(self.positions.shape[0], dtype="f4")

    @property
    def view(self):
        return [self.particle_view]

    @traitlets.default("particle_view")
    def _particle_view_default(self):
        # Eventually, we will want to supply these additional attributes:
        # value=pythreejs.BufferAttribute(array=self.radii, normalized=False),
        # size=pythreejs.BufferAttribute(array=self.radii, normalized=False),
        # in the attributes dict.
        pg = pythreejs.BufferGeometry(
            attributes=dict(
                position=pythreejs.BufferAttribute(
                    array=self.positions.astype("f4"), normalized=False
                ),
                index=pythreejs.BufferAttribute(
                    array=np.arange(self.positions.shape[0]).astype("u8"),
                    normalized=False,
                ),
            )
        )
        pp = pythreejs.Points(
            geometry=pg,
            material=pythreejs.PointsMaterial(
                color="#000000",
                map=self.r2_falloff,
                transparent=True,
                depthTest=False,
            ),
        )
        return pp

    def widget(self):
        widgets = []
        checkbox = ipywidgets.Checkbox(value=True, description="Visible")
        ipywidgets.jslink((checkbox, "value"), (self.particle_view, "visible"))
        widgets.append(checkbox)

        slider = ipywidgets.FloatLogSlider(
            min=-3, max=-0.2, value=0.1, description="Size"
        )
        ipywidgets.jslink((slider, "value"), (self.particle_view.material, "size"))
        widgets.append(slider)
        widgets.extend(_material_widget(self.particle_view.material))
        return ipywidgets.VBox(widgets, layout=ipywidgets.Layout(width="auto"))

    @traitlets.default("r2_falloff")
    def _r2_falloff_default(self):
        x, y = np.mgrid[-0.5:0.5:32j, -0.5:0.5:32j]
        r = (x**2 + y**2) ** -0.5
        r = np.clip(r, 0.0, 10.0)
        r = (r - r[0, 15]) / (r.max() - r[0, 15].min())
        r = np.clip(r, 0.0, 1.0)
        image_data = np.empty((32, 32, 4), dtype="f4")
        image_data[:, :, :] = r[:, :, None]
        image_data = (image_data * 255).astype("u1")
        image_texture = pythreejs.BaseDataTexture(
            data=image_data, magFilter="LinearFilter"
        )
        return image_texture


class AMRGridComponent(DomainViewComponent):
    grid_views = traitlets.List(trait=traitlets.Instance(pythreejs.LineSegments))
    colormap_texture = traitlets.Instance(pythreejs.Texture)
    cmap_truncate = traitlets.CFloat(0.5)
    grid_colormap = traitlets.Unicode()
    display_name = "Grids"
    group = traitlets.Instance(pythreejs.Group)

    @property
    def view(self):
        return [self.group]

    @traitlets.observe("grid_colormap")
    def _update_grid_colormap(self, change):
        cmap = mcm.get_cmap(change["new"])
        for level, segments in enumerate(self.grid_views):
            color = mcolors.to_hex(
                cmap(self.cmap_truncate * level / self.parent.ds.max_level)
            )
            segments.material.color = color

    @traitlets.default("group")
    def _group_default(self):
        return pythreejs.Group()

    @traitlets.default("grid_views")
    def _grid_views_default(self):
        # This needs to generate the geometries and access the materials
        grid_views = []
        cmap = mcm.get_cmap("inferno")
        for level in range(self.parent.ds.max_level + 1):
            # We truncate at half of the colormap so that we just get a slight
            # linear progression
            color = mcolors.to_hex(
                cmap(self.cmap_truncate * level / self.parent.ds.max_level)
            )
            # Corners is shaped like 8, 3, NGrids
            this_level = self.parent.ds.index.grid_levels[:, 0] == level
            level_corners = self.parent.ds.index.grid_corners[:, :, this_level]
            # We don't know if level_corners will be unyt-ful or not, but if it *is*
            # it will be in the units of the grid_left_edges
            uq = self.parent.ds.index.grid_left_edge.uq
            level_corners = (getattr(level_corners, "d", level_corners) * uq).in_units(
                "unitary"
            )
            corners = np.rollaxis(level_corners, 2).astype("float32")
            indices = (
                ((np.arange(corners.shape[0]) * 8)[:, None] + _CORNER_INDICES[None, :])
                .ravel()
                .astype("uint32")
            )
            corners.shape = (corners.size // 3, 3)
            geometry = pythreejs.BufferGeometry(
                attributes=dict(
                    position=pythreejs.BufferAttribute(array=corners, normalized=False),
                    index=pythreejs.BufferAttribute(array=indices, normalized=False),
                )
            )
            material = pythreejs.LineBasicMaterial(
                color=color, linewidth=1, linecap="round", linejoin="round"
            )
            segments = pythreejs.LineSegments(geometry=geometry, material=material)
            grid_views.append(segments)
            self.group.add(segments)
        return grid_views

    @traitlets.default("colormap_texture")
    def _colormap_texture_default(self):
        viridis = mcm.get_cmap("viridis")
        values = (viridis(np.mgrid[0.0:1.0:256j]) * 255).astype("u1")
        values = np.stack(
            [
                values[:, :],
            ]
            * 256,
            axis=1,
        ).copy(order="C")
        colormap_texture = pythreejs.BaseDataTexture(data=values)
        return colormap_texture

    def widget(self):
        group_visible = ipywidgets.Checkbox(
            value=self.group.visible, description="Visible"
        )
        ipywidgets.jslink((group_visible, "value"), (self.group, "visible"))
        grid_contents = []
        for i, view in enumerate(self.grid_views):
            visible = ipywidgets.Checkbox(
                value=view.visible,
                description=f"Level {i}",
                layout=ipywidgets.Layout(flex="1 1 auto", width="auto"),
            )
            ipywidgets.jslink((visible, "value"), (view, "visible"))
            color_picker = ipywidgets.ColorPicker(
                value=view.material.color,
                concise=True,
                layout=ipywidgets.Layout(flex="1 1 auto", width="auto"),
            )
            ipywidgets.jslink((color_picker, "value"), (view.material, "color"))
            line_slider = ipywidgets.FloatSlider(
                value=view.material.linewidth,
                min=0.0,
                max=10.0,
                layout=ipywidgets.Layout(flex="4 1 auto", width="auto"),
            )
            ipywidgets.jslink((line_slider, "value"), (view.material, "linewidth"))
            grid_contents.append(
                ipywidgets.Box(
                    children=[visible, color_picker, line_slider],
                    layout=ipywidgets.Layout(
                        display="flex",
                        flex_flow="row",
                        align_items="stretch",
                        width="100%",
                    ),
                )
            )

        dropdown = ipywidgets.Dropdown(
            options=["inferno", "viridis", "plasma", "magma", "cividis"],
            value="viridis",
            disable=False,
            description="Colormap:",
        )

        traitlets.link((dropdown, "value"), (self, "grid_colormap"))
        grid_box = ipywidgets.VBox(grid_contents)
        return ipywidgets.VBox(children=[group_visible, dropdown, grid_box])


class UnstructuredMeshComponent(DomainViewComponent):
    mesh_views = traitlets.List(trait=traitlets.Instance(pythreejs.Mesh))
    group = traitlets.Instance(pythreejs.Group)
    display_name = "Mesh View"

    @traitlets.default("group")
    def _group_default(self):
        return pythreejs.Group()

    @traitlets.default("mesh_views")
    def _mesh_views_default(self):
        mesh_views = []
        for mesh in self.parent.ds.index.meshes:
            material = pythreejs.MeshBasicMaterial(
                color="#ff0000",
                # vertexColors="VertexColors",
                side="DoubleSide",
                wireframe=True,
            )
            indices = mt.triangulate_indices(
                mesh.connectivity_indices - mesh._index_offset
            )
            # We need to convert these to the triangulated mesh.
            attributes = dict(
                position=pythreejs.BufferAttribute(
                    mesh.connectivity_coords, normalized=False
                ),
                index=pythreejs.BufferAttribute(
                    indices.ravel(order="C").astype("u4"), normalized=False
                ),
                color=pythreejs.BufferAttribute(
                    (mesh.connectivity_coords * 255).astype("u1")
                ),
            )
            geometry = pythreejs.BufferGeometry(attributes=attributes)
            geometry.exec_three_obj_method("computeFaceNormals")
            mesh_view = pythreejs.Mesh(
                geometry=geometry, material=material, position=[0, 0, 0]
            )
            mesh_views.append(mesh_view)
            self.group.add(mesh_view)
        return mesh_views

    @property
    def view(self):
        return [self.group]

    def widget(self):
        group_visible = ipywidgets.Checkbox(
            value=self.group.visible, description="Visible"
        )
        ipywidgets.jslink((group_visible, "value"), (self.group, "visible"))
        mesh_contents = []
        for i, view in enumerate(self.mesh_views):
            visible = ipywidgets.Checkbox(
                value=view.visible,
                description=f"Level {i}",
                layout=ipywidgets.Layout(flex="1 1 auto", width="auto"),
            )
            ipywidgets.jslink((visible, "value"), (view, "visible"))
            color_picker = ipywidgets.ColorPicker(
                value=view.material.color,
                concise=True,
                layout=ipywidgets.Layout(flex="1 1 auto", width="auto"),
            )
            ipywidgets.jslink((color_picker, "value"), (view.material, "color"))
            line_slider = ipywidgets.FloatSlider(
                value=view.material.wireframeLinewidth,
                min=0.0,
                max=10.0,
                layout=ipywidgets.Layout(flex="4 1 auto", width="auto"),
            )
            ipywidgets.jslink(
                (line_slider, "value"), (view.material, "wireframeLinewidth")
            )
            mesh_contents.append(
                ipywidgets.Box(
                    children=[visible, color_picker, line_slider],
                    layout=ipywidgets.Layout(
                        display="flex",
                        flex_flow="row",
                        align_items="stretch",
                        width="100%",
                    ),
                )
            )

        dropdown = ipywidgets.Dropdown(
            options=["inferno", "viridis", "plasma", "magma", "cividis"],
            value="viridis",
            disable=False,
            description="Colormap:",
        )

        # traitlets.link((dropdown, "value"), (self, "mesh_colormap"))
        mesh_box = ipywidgets.VBox(mesh_contents)
        return ipywidgets.VBox(children=[group_visible, dropdown, mesh_box])


class FullscreenButton(ipywidgets.Button):
    _model_name = traitlets.Unicode("FullscreenButtonModel").tag(sync=True)
    _model_module = traitlets.Unicode("@yt-project/yt-widgets").tag(sync=True)
    _model_module_version = traitlets.Unicode(EXTENSION_VERSION).tag(sync=True)
    _view_name = traitlets.Unicode("FullscreenButtonView").tag(sync=True)
    _view_module = traitlets.Unicode("@yt-project/yt-widgets").tag(sync=True)
    _view_module_version = traitlets.Unicode(EXTENSION_VERSION).tag(sync=True)

    renderer = traitlets.Instance(pythreejs.Renderer).tag(
        sync=True, **widget_serialization
    )


def _camera_widget(camera, renderer):
    x = ipywidgets.FloatText(value=camera.position[0], step=0.01)
    y = ipywidgets.FloatText(value=camera.position[1], step=0.01)
    z = ipywidgets.FloatText(value=camera.position[2], step=0.01)

    def update_positions(event):
        x.value, y.value, z.value = event["new"]

    def update_position_values(button):
        camera.position = x.value, y.value, z.value

    camera.observe(update_positions, ["position"])
    go_button = ipywidgets.Button(description="Go")
    go_button.on_click(update_position_values)

    hb = ipywidgets.VBox([ipywidgets.Label("Camera Position"), x, y, z, go_button])
    return hb


def _material_widget(material):
    # Some PointsMaterial bits
    widgets = []
    if material.has_trait("color"):
        color = ipywidgets.ColorPicker(value="#000000", description="Color")
        ipywidgets.jslink((color, "value"), (material, "color"))
        widgets.append(color)

    alpha_value = ipywidgets.FloatSlider(
        value=material.alphaTest, min=0.0, max=1.0, description="Alpha Test Value"
    )
    ipywidgets.jslink((alpha_value, "value"), (material, "alphaTest"))
    widgets.append(alpha_value)
    transparent = ipywidgets.Checkbox(
        value=material.transparent, description="Transparent"
    )
    # These have to be dlink because of dropdown objects allowing python
    # computation
    ipywidgets.dlink((transparent, "value"), (material, "transparent"))
    widgets.append(transparent)

    depth_test = ipywidgets.Checkbox(value=material.depthTest, description="Depth Test")
    ipywidgets.dlink((depth_test, "value"), (material, "depthTest"))
    widgets.append(depth_test)
    blending = ipywidgets.Dropdown(
        options=pythreejs.BlendingMode, description="Blending", value=material.blending
    )
    ipywidgets.dlink(
        (blending, "value"),
        (material, "blending"),
    )
    widgets.append(blending)

    for comp in [""]:  # no "Alpha" for now I guess
        widgets.append(
            ipywidgets.Dropdown(
                options=pythreejs.Equations, description=f"blendEquation{comp}"
            )
        )
        ipywidgets.dlink((widgets[-1], "value"), (material, f"blendEquation{comp}"))

    for fac in ["Src", "Dst"]:  # no SrcAlpha or DstAlpha for now
        widgets.append(
            ipywidgets.Dropdown(
                options=pythreejs.BlendFactors,
                description=f"blend{fac}",
                value=getattr(material, f"blend{fac}"),
            )
        )
        ipywidgets.dlink(
            (widgets[-1], "value"),
            (material, f"blend{fac}"),
        )
    return widgets


# https://stackoverflow.com/questions/26646362/numpy-array-is-not-json-serializable
class NumpyEncoder(json.JSONEncoder):
    """Special json encoder for numpy types"""

    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


class ParametersViewer(DatasetViewerComponent):
    name = "Parameters"

    def widget(self):
        # This is ugly right now; need to get the labels all the same size
        stats = ipywidgets.VBox(
            [
                ipywidgets.HBox(
                    [
                        ipywidgets.Label(
                            "Domain Left Edge", layout=ipywidgets.Layout(width="20%")
                        ),
                        display_ytarray(self.ds.domain_left_edge),
                    ]
                ),
                ipywidgets.HBox(
                    [
                        ipywidgets.Label(
                            "Domain Right Edge", layout=ipywidgets.Layout(width="20%")
                        ),
                        display_ytarray(self.ds.domain_right_edge),
                    ]
                ),
                ipywidgets.HBox(
                    [
                        ipywidgets.Label(
                            "Domain Width", layout=ipywidgets.Layout(width="20%")
                        ),
                        display_ytarray(self.ds.domain_width),
                    ]
                ),
            ]
        )
        # We round-trip through a JSON encoder to recursively convert stuff to lists
        dumped = json.dumps(self.ds.parameters, cls=NumpyEncoder, sort_keys=True)
        loaded = json.loads(dumped)
        out = ipywidgets.Output()
        with out:
            display(JSON(loaded, root="Parameters", expanded=False))
        return ipywidgets.VBox([stats, out])
