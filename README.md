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
    $ jupyter nbextension install --py --symlink --sys-prefix yt_pycanvas
    $ jupyter nbextension enable --py --sys-prefix yt_pycanvas
