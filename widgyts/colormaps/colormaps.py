import ipywidgets as ipywidgets
from ipydatawidgets import DataUnion, shape_constraints, \
        data_union_serialization
import numpy as np
import traitlets

rgba_image_shape = shape_constraints(None, None, 4)
vmesh_shape = shape_constraints(None)
to_json = ipywidgets.widget_serialization['to_json']

@ipywidgets.register
class ColorMaps(ipywidgets.Widget):
    """Colormapping widget used to collect available colormaps """

    _model_name = traitlets.Unicode('CMapModel').tag(sync=True)
    _model_module = traitlets.Unicode('@data-exp-lab/yt-widgets').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.3.0').tag(sync=True)

    cmaps = traitlets.Dict({}).tag(sync=True, config=True)
    map_name = traitlets.Unicode('autumn').tag(sync=True, config=True)
    is_log = traitlets.Bool(False).tag(sync=True, config=True)
    min_val = traitlets.Float().tag(sync=True, config=True)
    max_val = traitlets.Float().tag(sync=True, config=True)
    generation = traitlets.Int(0).tag(sync=True, config=True)

    def __init__(self, *args, **kwargs):
        self.cmaps = self.get_mpl_cmaps()
        super(ColorMaps, self).__init__()

    def get_mpl_cmaps(self):
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
