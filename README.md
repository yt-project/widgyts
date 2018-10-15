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

Using
-----

To use this, you will need to have yt installed.  Importing it monkeypatches
the Slice and Projection objects, so you are now able to do:

```
#!python
import yt
import yt_pycanvas

ds = yt.load("data/IsolatedGalaxy/galaxy0030/galaxy0030")
s = ds.r[:,:,0.5]
s.display("density")
```

and for a projection:

```
#!python
ds = yt.load("data/IsolatedGalaxy/galaxy0030/galaxy0030")
p = ds.r[:].integrate("density", axis="x")
p.display()
```

There are a number of traits you can set on the resultant objects, as well.
