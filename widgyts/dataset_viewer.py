import numpy as np
import pythreejs
import traitlets
import ipywidgets
import matplotlib.cm as mcm
import matplotlib.colors as mcolors
from yt.data_objects.api import Dataset


class DatasetViewerComponent(traitlets.HasTraits):
    ds = traitlets.Instance(Dataset)
    viewer = traitlets.ForwardDeclaredInstance("DatasetViewer")


class DatasetViewer(traitlets.HasTraits):
    ds = traitlets.Instance(Dataset)
    components = traitlets.List(trait=traitlets.Instance(DatasetViewerComponent))


class DomainViewer(DatasetViewerComponent):
    domain_axes = traitlets.Instance(pythreejs.AxesHelper)

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
        cmap = mcm.get_cmap("inferno")
        for level in range(self.ds.max_level + 1):
            # We truncate at half of the colormap so that we just get a slight
            # linear progression
            color = mcolors.to_hex(cmap(0.5 * level / self.ds.max_level))
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
            antialias=True,
        )
        camera.lookAt(center)
        orbit_control.target = center
        return renderer

    def widget(self):
        # Alright let's set this all up.
        grid_contents = []
        for i, view in enumerate(self.grid_views):
            visible = ipywidgets.Checkbox(
                value=view.visible, description="Level {}".format(i)
            )
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
