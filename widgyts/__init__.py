from ._version import version_info, __version__

from .image_canvas import *
from .dataset_viewer import (
    DatasetViewer,
    AMRDomainViewer,
    FieldDefinitionViewer,
    ParametersViewer
)

def _jupyter_nbextension_paths():
    # Not sure we need this anymore
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'yt-widgets',
        'require': 'yt-widgets/extension'
    }]

def _jupyter_server_extension_paths():
    return [{
        "module": "widgyts"
    }]

def load_jupyter_server_extension(lab_app):
    '''
    Just add to mimetypes.
    '''
    import mimetypes
    mimetypes.add_type("application/wasm", ".wasm")
    lab_app.log.info("Registered application/wasm MIME type")
