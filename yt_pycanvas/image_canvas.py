import ipywidgets as ipywidgets
import traitlets
from ipydatawidgets import DataUnion, shape_constraints, \
        data_union_serialization
import numpy as np
from ipywidgets import widget_serialization

from .colormaps.colormaps import ColorMaps

rgba_image_shape = shape_constraints(None, None, 4)
vmesh_shape = shape_constraints(None)

@ipywidgets.register
class ImageCanvas(ipywidgets.DOMWidget):
    """An example widget."""
    _view_name = traitlets.Unicode('ImageCanvasView').tag(sync=True)
    _model_name = traitlets.Unicode('ImageCanvasModel').tag(sync=True)
    _view_module = traitlets.Unicode('yt-jscanvas').tag(sync=True)
    _model_module = traitlets.Unicode('yt-jscanvas').tag(sync=True)
    _view_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    image_array = DataUnion(dtype=np.uint8,
            shape_constraint=rgba_image_shape).tag(sync=True,
                    **data_union_serialization)
    width = traitlets.Int(256).tag(sync=True)
    height = traitlets.Int(256).tag(sync=True)

@ipywidgets.register
class FRBViewer(ipywidgets.DOMWidget):
    """Viewing a fixed resolution buffer"""
    _view_name = traitlets.Unicode('FRBView').tag(sync=True)
    _model_name = traitlets.Unicode('FRBModel').tag(sync=True)
    _view_module = traitlets.Unicode('yt-jscanvas').tag(sync=True)
    _model_module = traitlets.Unicode('yt-jscanvas').tag(sync=True)
    _view_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    width = traitlets.Int(512).tag(sync=True)
    height = traitlets.Int(512).tag(sync=True)
    px = DataUnion(dtype=np.float64,
            shape_constraint=vmesh_shape).tag(sync = True,
                    **data_union_serialization)
    py = DataUnion(dtype=np.float64,
            shape_constraint=vmesh_shape).tag(sync = True,
                    **data_union_serialization)
    pdx = DataUnion(dtype=np.float64,
            shape_constraint=vmesh_shape).tag(sync = True,
                    **data_union_serialization)
    pdy = DataUnion(dtype=np.float64,
            shape_constraint=vmesh_shape).tag(sync = True,
                    **data_union_serialization)
    val = DataUnion(dtype=np.float64,
            shape_constraint=vmesh_shape).tag(sync = True,
                    **data_union_serialization)
    colormaps = traitlets.Instance(ColorMaps).tag(sync = True,
            **widget_serialization)
    canvas_edges = traitlets.Tuple((0.45, 0.65, 0.45, 0.65)).tag(sync = True,
            config=True)

    @traitlets.default('colormaps')
    def _colormap_load(self):
        return ColorMaps()

    def setup_controls(self):
        down = ipywidgets.Button(icon="arrow-down",
                layout=ipywidgets.Layout(width='10%'))
        up = ipywidgets.Button(icon="arrow-up",
                layout=ipywidgets.Layout(width='10%'))
        right = ipywidgets.Button(icon="arrow-right",
                layout=ipywidgets.Layout(width='30%')
                )
        left = ipywidgets.Button(icon="arrow-left",
                layout=ipywidgets.Layout(width='30%')
                )
        zoom = ipywidgets.FloatSlider(min=1, max=10, step=0.1, description="Zoom")
        is_log = ipywidgets.Checkbox(value=False, description="Log colorscale")
        colormaps = ipywidgets.Dropdown(
                options=list(self.colormaps.cmaps.keys()),
                description="colormap",
                value = "viridis")
        min_val = ipywidgets.BoundedFloatText(description="lower colorbar bound:",
                value=self.val.min(), min=self.val.min(), max=self.val.max())
        max_val = ipywidgets.BoundedFloatText(description="upper colorbar bound:",
                value=self.val.max(), min=self.val.min(), max=self.val.max())
        minmax = ipywidgets.FloatRangeSlider(min=self.val.min(), max=self.val.max())


        down.on_click(self.on_xdownclick)
        up.on_click(self.on_xupclick)
        right.on_click(self.on_yrightclick)
        left.on_click(self.on_yleftclick)
        zoom.observe(self.on_zoom, names='value')
        ipywidgets.link((is_log, 'value'), (self.colormaps, 'is_log'))
        ipywidgets.link((colormaps, 'value'), (self.colormaps, 'map_name'))
        ipywidgets.link((min_val, 'value'), (self.colormaps, 'min_val'))
        ipywidgets.link((max_val, 'value'), (self.colormaps, 'max_val'))

        sides = ipywidgets.HBox([left,right],
                layout=ipywidgets.Layout(justify_content='space-between',
                    width='30%'))
        nav_buttons = ipywidgets.VBox([up, sides, down],
                layout=ipywidgets.Layout(
                    align_items='center',
                    width='100%'))


        all_navigation = ipywidgets.VBox([nav_buttons, zoom],
                layout=ipywidgets.Layout(align_items='center')
                )
        all_normalizers = ipywidgets.VBox([is_log,
                colormaps, min_val, max_val],
                layout=ipywidgets.Layout(align_items='center')
                )
        accordion = ipywidgets.Accordion(children=[all_navigation,
            all_normalizers])
        accordion.set_title(0, 'navigation')
        accordion.set_title(1, 'colormap controls')
        return accordion

    def on_xdownclick(self, b):
        ce = self.canvas_edges
        self.canvas_edges = (ce[0]+0.01, ce[1]+0.01)+ce[2:]

    def on_xupclick(self, b):
        ce = self.canvas_edges
        self.canvas_edges = (ce[0]-0.01, ce[1]-0.01)+ce[2:]

    def on_yrightclick(self, b):
        ce = self.canvas_edges
        self.canvas_edges = ce[:2]+(ce[2]+0.01, ce[3]+0.01)

    def on_yleftclick(self, b):
        ce = self.canvas_edges
        self.canvas_edges = ce[:2]+(ce[2]-0.01, ce[3]-0.01)

    def on_zoom(self, change):
        ce = self.canvas_edges
        lengths = [ce[1]-ce[0], ce[3]-ce[2]]
        center = [np.mean(ce[:2]), np.mean(ce[2:])]
        width = 1.0/change["new"]
        hwidth = width/2.
        new_edges = (center[0]-hwidth, center[0]+hwidth, center[1]-hwidth,
                center[1]+hwidth)
        self.canvas_edges = new_edges
        # print("canvas center is at: {}".format(center))
        # print("zoom value is: {}".format(change["new"]))
        # print("width of frame is: {}".format(width))
        # print("old edges: {} \n new edges:{}".format(ce, new_edges))


