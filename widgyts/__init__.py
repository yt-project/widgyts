try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode:
    # https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings

    warnings.warn("Importing 'widgyts' outside a proper installation.")
    __version__ = "dev"

EXTENSION_VERSION = "~" + __version__

from .dataset_viewer import (
    AMRGridComponent,
    DatasetViewer,
    DomainViewer,
    FieldDefinitionViewer,
    FullscreenButton,
    ParametersViewer,
    ParticleComponent,
)
from .image_canvas import *


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "@yt-project/yt-widgets"}]


def _jupyter_server_extension_points():
    return [{"module": "widgyts"}]


def _load_jupyter_server_extension(server_app):
    """
    Just add to mimetypes.
    """
    import mimetypes

    mimetypes.add_type("application/wasm", ".wasm")
    server_app.log.info("Registered application/wasm MIME type")
