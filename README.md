yt-canvas-widget
===============================

A Custom Jupyter Widget Library

Installation
------------

To install use pip:

    $ pip install yt_pycanvas
    $ jupyter nbextension enable --py --sys-prefix yt_pycanvas


For a development installation (requires npm),

    $ git clone https://github.com/data-exp-lab/yt-canvas-widget.git
    $ cd yt-canvas-widget
    $ pip install -e .
    $ jupyter serverextension enable --py --sys-prefix yt_pycanvas
    $ jupyter nbextension install --py --symlink --sys-prefix yt_pycanvas
    $ jupyter nbextension enable --py --sys-prefix yt_pycanvas

Note that in previous versions, serverextension was not provided and you were
required to set up your own mimetype in your local configuration.  This is no
longer the case and you are now able to use this server extension to set up the
correct wasm mimetype.
