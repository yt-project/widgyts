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
    canvas_edges = traitlets.List([0.45, 0.65, 0.45, 0.65]).tag(sync = True,
            config=True)

    @traitlets.default('colormaps')
    def _colormap_load(self):
        return ColorMaps()


