import ipywidgets as ipywidgets
import traitlets
from ipydatawidgets import DataUnion, shape_constraints, \
        data_union_serialization
import numpy as np

rgba_image_shape = shape_constraints(None, None, 4)
colormap_shape = shape_constraints(256, 4)

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

    color_map_array = DataUnion(dtype=np.uint8,
            shape_constraint=rgba_image_shape).tag(sync=True,
                    **data_union_serialization)

    width = traitlets.Int(256).tag(sync=True)
    height = traitlets.Int(256).tag(sync=True)

    def normalize_values(self, image_pixel):
        return self.color_map_array[np.argmin(np.apply_along_axis(
                self.compute_distance, 1, self.color_map_array, image_pixel))]

    def compute_distance(self, colormap_pixel, image_pixel):
        return np.linalg.norm(image_pixel[:3] - colormap_pixel[:3])

    normalized_array = np.apply_along_axis(normalize_values, 2, image_array)
