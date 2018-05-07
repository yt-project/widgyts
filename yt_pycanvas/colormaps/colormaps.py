import ipywidgets as ipywidgets
from ipydatawidgets import DataUnion, shape_constraints, \
        data_union_serialization
import numpy as np
import traitlets

to_json = ipywidgets.widget_serialization['to_json']

@ipywidgets.register
class ColorMaps(ipywidgets.Widget):
    """Colormapping widget used to collect available colormaps """

    _model_name = traitlets.Unicode('CMapModel').tag(sync=True)
    _model_module = traitlets.Unicode('yt-jscanvas').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)

    cmaps = traitlets.Dict({}).tag(sync=True)

    def __init__(self):
        print("getting colormaps from matplotlib...")

        super(ColorMaps, self).__init__()
        self.cmaps = self.get_mpl_cmaps()
        cmaps = traitlets.Dict(self.cmaps).tag(sync=True)

    def get_mpl_cmaps(self):
        """ Adds available colormaps from matplotlib."""
        cmaps = {}
        try:
            import matplotlib.cm as mplcm
        except ImportError:
            print("can't import matplotlib.cm")
        else:
            cmap_list =  mplcm.cmap_d.keys()
            for colormap in cmap_list:
                cmap = mplcm.get_cmap(colormap)
                vals = cmap(np.mgrid[0.0:1.0:256j])
                cmaps[colormap] = vals
        # maybe trying to pass the Dict of arrays will work? Not sure yet.
        return cmaps
