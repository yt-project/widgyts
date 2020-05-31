import ipywidgets as ipywidgets
import numpy as np
import traitlets
from .._version import EXTENSION_VERSION

@ipywidgets.register
class ColormapContainer(ipywidgets.Widget):
    _model_name = traitlets.Unicode('ColormapContainerModel').tag(sync=True)
    _model_module = traitlets.Unicode('@data-exp-lab/yt-widgets').tag(sync=True)
    _model_module_version = traitlets.Unicode(EXTENSION_VERSION).tag(sync=True)
    colormap_values = traitlets.Dict({}).tag(sync=True, config=True)

    @traitlets.default("colormap_values")
    def _colormap_values_default(self):
        """ Adds available colormaps from matplotlib."""
        colormaps = {}
        import matplotlib.cm as mplcm
        cmap_list =  mplcm.cmap_d.keys()
        for colormap in cmap_list:
            cmap = mplcm.get_cmap(colormap)
            vals = (cmap(np.mgrid[0.0:1.0:256j])*255).astype("uint8")
            # right now let's just flatten the arrays. Later we can
            # serialize each cmap on its own.
            table = vals.flatten().tolist()
            colormaps[colormap] = table
        return colormaps