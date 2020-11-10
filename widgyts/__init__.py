from ._version import __version__, version_info
from .dataset_viewer import (
    AMRDomainViewer,
    DatasetViewer,
    FieldDefinitionViewer,
    ParametersViewer,
)
from .image_canvas import *


def _jupyter_nbextension_paths():
    # Not sure we need this anymore
    return [
        {
            "section": "notebook",
            "src": "static",
            "dest": "yt-widgets",
            "require": "yt-widgets/extension",
        }
    ]


def _jupyter_server_extension_paths():
    return [{"module": "widgyts"}]


def load_jupyter_server_extension(lab_app):
    """
    Just add to mimetypes.
    """
    import mimetypes

    mimetypes.add_type("application/wasm", ".wasm")
    lab_app.log.info("Registered application/wasm MIME type")
