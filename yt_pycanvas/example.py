import ipywidgets as ipywidgets
import traitlets
from ipydatawidgets import DataUnion, shape_constraints
import numpy as np

rgba_image_shape = shape_constraints(None, None, 4)

@ipywidgets.register
class HelloWorld(ipywidgets.DOMWidget):
    """An example widget."""
    _view_name = traitlets.Unicode('HelloView').tag(sync=True)
    _model_name = traitlets.Unicode('HelloModel').tag(sync=True)
    _view_module = traitlets.Unicode('yt-jscanvas').tag(sync=True)
    _model_module = traitlets.Unicode('yt-jscanvas').tag(sync=True)
    _view_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    image_array = DataUnion(dtype=np.uint8,
            shape_constraint=rgba_image_shape).tag(sync=True)
