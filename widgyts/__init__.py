import json
from pathlib import Path

from ._version import __version__

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

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": data["name"]}]


def _jupyter_server_extension_points():
    return [{"module": "widgyts"}]


def _load_jupyter_server_extension(server_app):
    """
    Just add to mimetypes.
    """
    import mimetypes

    mimetypes.add_type("application/wasm", ".wasm")
    server_app.log.info("Registered application/wasm MIME type")
