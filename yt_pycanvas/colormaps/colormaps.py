import ipywidgets as ipywidgets
import numpy as np

@ipywidgets.register
class ColorMaps(ipywidgets.Widget):

    """Colormapping widget used for rendering views """

    def __init__(self):
        print("getting colormaps from matplotlib...")

        self.cmaps = {}

        try:
            import matplotlib.cm as mplcm
        except ImportError:
            print("can't import matplotlib.cm")
        else:
            cmap_list =  mplcm.cmap_d.keys()
            for colormap in cmap_list:
                cmap = mplcm.get_cmap(colormap)
                vals = cmap(np.mgrid[0.0:1.0:256j])
                self.cmaps[colormap] = vals

        super(ColorMaps, self).__init__()

