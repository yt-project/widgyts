"""
widgyts setup
"""
import json
from pathlib import Path

import setuptools
from jupyter_packaging import (
    combine_commands,
    create_cmdclass,
    ensure_targets,
    install_npm,
    skip_if_exists,
)

HERE = Path(__file__).parent.resolve()

# The name of the project
name = "widgyts"

lab_path = HERE / name / "labextension"

# Representative files that should exist after a successful build
jstargets = [
    str(lab_path / "package.json"),
]

package_data_spec = {
    name: ["*"],
}

labext_name = "@yt-project/yt-widgets"

data_files_spec = [
    (f"share/jupyter/labextensions/{labext_name}", str(lab_path), "**"),
    (f"share/jupyter/labextensions/{labext_name}", str(HERE), "install.json"),
    ("etc/jupyter/jupyter_server_config.d", "jupyter-config", "widgyts.json"),
]

cmdclass = create_cmdclass(
    "jsdeps", package_data_spec=package_data_spec, data_files_spec=data_files_spec
)

js_command = combine_commands(
    install_npm(HERE, build_cmd="build:prod", npm=["jlpm"]),
    ensure_targets(jstargets),
)

is_repo = (HERE / ".git").exists()
if is_repo:
    cmdclass["jsdeps"] = js_command
else:
    cmdclass["jsdeps"] = skip_if_exists(jstargets, js_command)

# Get the package info from package.json

setup_args = dict(
    cmdclass=cmdclass,
    ],
)


if __name__ == "__main__":
    setuptools.setup(**setup_args)
