from ._version import version_info, __version__

from .image_canvas import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'yt-jscanvas',
        'require': 'yt-jscanvas/extension'
    }]
