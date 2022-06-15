import json

import ipywidgets
import matplotlib.cm as mcm
import matplotlib.colors as mcolors
import numpy as np
import pythreejs
import traitlets
from IPython.display import JSON, display

from yt.data_objects.api import Dataset
from yt.units import display_ytarray

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
        adv = DomainViewer(ds=self.ds, viewer=self)
        fdv = FieldDefinitionViewer(ds=self.ds, viewer=self)
        pv = ParametersViewer(ds=self.ds, viewer=self)
        return [adv, fdv, pv]

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
    domain_axes = traitlets.Instance(pythreejs.AxesHelper)
    name = "Domain Viewer"
    renderer = traitlets.Instance(pythreejs.Renderer)
    position_list = traitlets.List([])
    domain_view_components = traitlets.List(
        trait=traitlets.ForwardDeclaredInstance("DomainViewComponent")
    )

    @traitlets.default("domain_axes")
    def _domain_axes_default(self):
        offset_vector = (self.ds.domain_left_edge - self.ds.domain_center) * 0.1
        position = tuple(
            (self.ds.domain_left_edge + offset_vector).in_units("code_length").d
        )
        # We probably don't want to use the AxesHelper as it doesn't expose the
        # material, which can result in it not being easy to see.  But for now...
        ah = pythreejs.AxesHelper(
            position=position,
            scale=tuple(self.ds.domain_width.in_units("code_length").d),
        )
        return ah

    @traitlets.observe("domain_view_components")
    def _update_domain_view_components(self, change):
        # The renderer needs to be updated here, but we should not need to update
        # individual widgets.
        # We retain the first two, which will be the camera and an ambient light source.
        new_children = []
        for c in change["new"]:
            new_children.extend(c.view)
        self.renderer.scene.children = self.renderer.scene.children[:3] + tuple(
            new_children
        )

    @traitlets.default("renderer")
    def _renderer_default(self):
        center = tuple(self.ds.domain_center.in_units("code_length").d)
        right = tuple(
            (
                self.ds.domain_right_edge
                + (self.ds.domain_right_edge - self.ds.domain_center) * 2.0
            )
            .in_units("code_length")
            .d
        )
        camera = pythreejs.PerspectiveCamera(
            position=right,
            fov=20,
            children=[pythreejs.AmbientLight()],
            near=1e-2,
            far=2e3,
        )
        scene = pythreejs.Scene(
            children=[camera, pythreejs.AmbientLight(color="#dddddd"), self.domain_axes]
        )
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
                    pythreejs.AnimationMixer(self.renderer.camera),
                    camera_clip,
                    self.renderer.camera,
                )
            ]

        def on_button_add_clicked(b):
            state = self.renderer.camera.get_state()

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
            self.renderer.camera.set_state(change["new"])

        select.observe(on_selection_changed, ["value"])

        center = self.ds.domain_center.in_units("code_length").d

        def _create_clicked(axi, ax):
            def view_button_clicked(button):
                vec = [0, 0, 0]
                vec[axi] = 2.0
                self.renderer.camera.position = tuple(
                    center + (self.ds.domain_width.in_units("code_length").d * vec)
                )
                self.renderer.camera.lookAt(center)

            return view_button_clicked

        view_buttons = []
        for axi, ax in enumerate("XYZ"):
            view_buttons.append(ipywidgets.Button(description=ax))

            view_buttons[-1].on_click(_create_clicked(axi, ax))

        # This could probably be stuck into the _create_clicked function, but my
        # first attempt didn't work, so I'm writing it out here.
        def view_isometric(button):
            self.renderer.camera.position = tuple(
                center + (self.ds.domain_width.in_units("code_length").d * 2)
            )
            self.renderer.camera.lookAt(center)

        view_buttons.append(ipywidgets.Button(description="◆"))
        view_buttons[-1].on_click(view_isometric)

        tab = ipywidgets.Tab(children=[])

        def _update_tabs(change):
            tab.children = [_.widget() for _ in self.domain_view_components]
            for i, c in enumerate(self.domain_view_components):
                tab.set_title(i, f"{c.display_name}")

        _update_tabs(None)
        self.observe(_update_tabs, ["domain_view_components"])

        return ipywidgets.HBox(
            [
                self.renderer,
                ipywidgets.VBox(
                    [
                        ipywidgets.TwoByTwoLayout(
                            top_left=view_buttons[0],
                            top_right=view_buttons[2],
                            bottom_left=view_buttons[1],
                            bottom_right=view_buttons[3],
                        ),
                        ipywidgets.HBox([button_add, button_rem]),
                        ipywidgets.Label("Keyframes"),
                        select,
                        camera_action_box,
                        _camera_widget(self.renderer.camera, self.renderer),
                    ]
                ),
                tab,
            ]
        )


class DomainViewComponent(traitlets.HasTraits):
    parent = traitlets.Instance(DomainViewer)
    display_name = "Unknown"


class ParticleComponent(DomainViewComponent):
    r2_falloff = traitlets.Instance(pythreejs.Texture)
    display_name = "Particles"

    @traitlets.default("r2_falloff")
    def _r2_falloff_default(self):
        x, y = np.mgrid[-0.5:0.5:32j, -0.5:0.5:32j]
        r = (x**2 + y**2) ** -0.5
        r = np.clip(r, 0.0, 5.0)
        r = (r - r.min()) / (r.max() - r.min())
        image_data = np.empty((32, 32, 4), dtype="f4")
        image_data[:, :, :3] = r[:, :, None]
        image_data[:, :, 3] = 1.0
        image_data = (image_data * 255).astype("u1")
        image_texture = pythreejs.BaseDataTexture(data=image_data)
        return image_texture


class AMRGridComponent(DomainViewComponent):
    grid_views = traitlets.List(trait=traitlets.Instance(pythreejs.LineSegments))
    colormap_texture = traitlets.Instance(pythreejs.Texture)
    cmap_truncate = traitlets.CFloat(0.5)
    grid_colormap = traitlets.Unicode()
    display_name = "Grids"

    @property
    def view(self):
        return self.grid_views

    @traitlets.observe("grid_colormap")
    def _update_grid_colormap(self, change):

        cmap = mcm.get_cmap(change["new"])
        for level, segments in enumerate(self.grid_views):
            color = mcolors.to_hex(
                cmap(self.cmap_truncate * level / self.parent.ds.max_level)
            )
            segments.material.color = color

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
            corners = np.rollaxis(
                self.parent.ds.index.grid_corners[:, :, this_level], 2
            ).astype("float32")
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
        grid_contents = []
        for i, view in enumerate(self.grid_views):
            visible = ipywidgets.Checkbox(value=view.visible, description=f"Level {i}")
            ipywidgets.jslink((visible, "value"), (view, "visible"))
            color_picker = ipywidgets.ColorPicker(
                value=view.material.color, concise=True
            )
            ipywidgets.jslink((color_picker, "value"), (view.material, "color"))
            line_slider = ipywidgets.FloatSlider(
                value=view.material.linewidth, min=0.0, max=10.0
            )
            ipywidgets.jslink((line_slider, "value"), (view.material, "linewidth"))
            grid_contents.extend([visible, color_picker, line_slider])

        dropdown = ipywidgets.Dropdown(
            options=["inferno", "viridis", "plasma", "magma", "cividis"],
            value="viridis",
            description="Colormap:",
            disable=False,
        )

        traitlets.link((dropdown, "value"), (self, "grid_colormap"))
        return ipywidgets.VBox(
            [
                dropdown,
                ipywidgets.GridBox(
                    grid_contents,
                    layout=ipywidgets.Layout(
                        width=r"60%",
                        grid_template_columns=r"30% 10% auto",
                        align_items="stretch",
                    ),
                ),
            ],
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
