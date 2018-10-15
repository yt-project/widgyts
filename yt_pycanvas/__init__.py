from ._version import version_info, __version__

from .image_canvas import *

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'yt-jscanvas',
        'require': 'yt-jscanvas/extension'
    }]

def _jupyter_server_extension_paths():
    return [{
        "module": "yt_pycanvas"
    }]

def load_jupyter_server_extension(nb_app):
    '''
    Just add to mimetypes.
    '''
    import mimetypes
    mimetypes.add_type("application/wasm", ".wasm")
