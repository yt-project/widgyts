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
        adv = AMRDomainViewer(ds=self.ds, viewer=self)
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


class AMRDomainViewer(DomainViewer):
    grid_views = traitlets.List(trait=traitlets.Instance(pythreejs.LineSegments))
    renderer = traitlets.Instance(pythreejs.Renderer)
    r2_falloff = traitlets.Instance(pythreejs.Texture)
    colormap_texture = traitlets.Instance(pythreejs.Texture)
    cmap_truncate = traitlets.CFloat(0.5)

    @traitlets.default("grid_views")
    def _grid_views_default(self):
        # This needs to generate the geometries and access the materials
        grid_views = []
        cmapdic = {0:'viridis', 1:'plasma', 2:'inferno', 3:'magma', 4:'cividis', 5:'viridis', 6:'plasma', 7:'inferno', 8:'magma'}
        for level in range(self.ds.max_level + 1):
            # We truncate at half of the colormap so that we just get a slight
            # linear progression
            cmap = mcm.get_cmap(cmapdic[level])
            color = mcolors.to_hex(cmap(self.cmap_truncate * level / self.ds.max_level))
            # Corners is shaped like 8, 3, NGrids
            this_level = self.ds.index.grid_levels[:, 0] == level
            corners = np.rollaxis(
                self.ds.index.grid_corners[:, :, this_level], 2
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

    @traitlets.default("r2_falloff")
    def _r2_falloff_default(self):
        x, y = np.mgrid[-0.5:0.5:32j, -0.5:0.5:32j]
        r = (x ** 2 + y ** 2) ** -0.5
        r = np.clip(r, 0.0, 5.0)
        r = (r - r.min()) / (r.max() - r.min())
        image_data = np.empty((32, 32, 4), dtype="f4")
        image_data[:, :, :3] = r[:, :, None]
        image_data[:, :, 3] = 1.0
        image_data = (image_data * 255).astype("u1")
        image_texture = pythreejs.BaseDataTexture(data=image_data)
        return image_texture

    @traitlets.default("colormap_texture")
    def _colormap_texture_default(self):
        viridis = mcm.get_cmap("viridis")
        values = (viridis(np.mgrid[0.0:1.0:256j]) * 255).astype("u1")
        values = np.stack([values[:, :],] * 256, axis=1,).copy(order="C")
        colormap_texture = pythreejs.BaseDataTexture(data=values)
        return colormap_texture

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
            position=right, fov=20, children=[pythreejs.AmbientLight()]
        )
        scene = pythreejs.Scene(
            children=[camera, pythreejs.AmbientLight(color="#dddddd")] + self.grid_views
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
        return ipywidgets.HBox(
            [
                self.renderer,
                ipywidgets.GridBox(
                    grid_contents,
                    layout=ipywidgets.Layout(
                        width=r"50%",
                        grid_template_columns=r"30% 10% auto",
                        align_items="stretch",
                    ),
                ),
            ]
        )


# https://stackoverflow.com/questions/26646362/numpy-array-is-not-json-serializable
class NumpyEncoder(json.JSONEncoder):
    """ Special json encoder for numpy types """

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
