import ipywidgets as widgets
from traitlets import Unicode, Instance
from ipydatawidgets import NDArrayWidget, NDArray, array_serialization
import numpy as np

@widgets.register
class HelloWorld(widgets.DOMWidget):
    """An example widget."""
    _view_name = Unicode('HelloView').tag(sync=True)
    _model_name = Unicode('HelloModel').tag(sync=True)
    _view_module = Unicode('yt-jscanvas').tag(sync=True)
    _model_module = Unicode('yt-jscanvas').tag(sync=True)
    _view_module_version = Unicode('^0.1.0').tag(sync=True)
    _model_module_version = Unicode('^0.1.0').tag(sync=True)
    image_array = NDArray(np.zeros(0)).tag(
            sync=True, **array_serialization)
