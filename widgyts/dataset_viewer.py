import numpy as np
import pythreejs
import traitlets
import ipywidgets
from yt.data_objects.api import Dataset


class DatasetViewerComponent(traitlets.HasTraits):
    ds = traitlets.Instance(Dataset)
    viewer = traitlets.ForwardDeclaredInstance("DatasetViewer")


class DatasetViewer(traitlets.HasTraits):
    ds = traitlets.Instance(Dataset)
    components = traitlets.List(trait=traitlets.Instance(DatasetViewerComponent))


class DomainViewer(DatasetViewerComponent):
    pass


_CORNER_INDICES = np.array(
    [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7],
    dtype="uint32",
)


class AMRDomainViewer(DomainViewer):
    grid_views = traitlets.List(trait=traitlets.Instance(pythreejs.LineSegments))
    renderer = traitlets.Instance(pythreejs.Renderer)

    @traitlets.default("grid_views")
    def _grid_views_default(self):
        # This needs to generate the geometries and access the materials
        grid_views = []
        for level in range(self.ds.max_level + 1):
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
            material = pythreejs.LineBasicMaterial(color="red", linewidth=1)
            segments = pythreejs.LineSegments(geometry=geometry, material=material)
            grid_views.append(segments)
        return grid_views

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
            width=500,
            height=500,
            background="black",
            background_opacity=1,
        )
        camera.lookAt(center)
        orbit_control.target = center
        return renderer

    def widget(self):
        # Alright let's set this all up.
        vbox_contents = []
        for view in self.grid_views:
            color_picker = ipywidgets.ColorPicker(value=view.material.color)
            ipywidgets.jslink((color_picker, "value"), (view.material, "color"))
            line_slider = ipywidgets.FloatSlider(
                value=view.material.linewidth, min=0.0, max=2.5
            )
            ipywidgets.jslink((line_slider, "value"), (view.material, "linewidth"))
            visible = ipywidgets.Checkbox(value=view.visible)
            ipywidgets.jslink((visible, "value"), (view, "visible"))
            vbox_contents.append(ipywidgets.HBox([visible, color_picker, line_slider]))
        return ipywidgets.HBox([self.renderer, ipywidgets.VBox(vbox_contents)])
