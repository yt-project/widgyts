import ipywidgets as ipywidgets
import numpy as np
import traitlets

from . import EXTENSION_VERSION


@ipywidgets.register
class ColormapContainer(ipywidgets.Widget):
    _model_name = traitlets.Unicode("ColormapContainerModel").tag(sync=True)
    _model_module = traitlets.Unicode("@yt-project/yt-widgets").tag(sync=True)
    _model_module_version = traitlets.Unicode(EXTENSION_VERSION).tag(sync=True)
    colormap_values = traitlets.Dict({}).tag(sync=True, config=True)

    @traitlets.default("colormap_values")
    def _colormap_values_default(self):
        """Adds available colormaps from matplotlib."""
        colormaps = {}
        import matplotlib

        for cmap_name, cmap in matplotlib.colormaps.items():
            vals = (cmap(np.mgrid[0.0:1.0:256j]) * 255).astype("uint8")
            # right now let's just flatten the arrays. Later we can
            # serialize each cmap on its own.
            table = vals.flatten().tolist()
            colormaps[cmap_name] = table
        return colormaps
