widgyts
===============================

[![Documentation
Status](https://readthedocs.org/projects/widgyts/badge/?version=latest)](https://widgyts.readthedocs.io/en/latest/?badge=latest)
[![codecov](https://codecov.io/gh/yt-project/widgyts/branch/master/graph/badge.svg)](https://codecov.io/gh/yt-project/widgyts)
[![status](https://joss.theoj.org/papers/f86e07ce58fe8bb24d928943663d2751/status.svg)](https://joss.theoj.org/papers/f86e07ce58fe8bb24d928943663d2751)
[![DOI](https://zenodo.org/badge/124116100.svg)](https://zenodo.org/badge/latestdoi/124116100)


A fully client-side pan-and-zoom widget, using WebAssembly, for variable mesh
datasets from yt.  It runs in the browser, so once the data hits your notebook,
it's super fast and responsive!

If you'd like to dig into the Rust and WebAssembly portion of the code, you can
find it at https://github.com/data-exp-lab/rust-yt-tools/ and in the npm
package `@data-exp-lab/yt-tools`.

Check out our [SciPy 2018 talk](https://www.youtube.com/watch?v=5dl_m_6T2bU)
and the [associated slides](https://munkm.github.io/2018-07-13-scipy/) for more info!

Documentation
-------------

Our documentation is hosted at readthedocs. Take a look
[here](https://widgyts.readthedocs.io/en/latest/).

Installation
------------

widgyts requires JupyterLab 4 (or Notebook 7) and ipywidgets 8. To install
the most recent released version:

    $ pip install widgyts

This installs both the prebuilt JupyterLab extension and the server extension
that registers the wasm mimetype; no further `jupyter labextension install`
step is required.

To install from this directory:

    $ git clone https://github.com/yt-project/widgyts.git
    $ cd widgyts
    $ pip install .

For a development installation (requires NodeJS; `jlpm` is provided by
JupyterLab):

    $ git clone https://github.com/yt-project/widgyts.git
    $ cd widgyts
    $ pip install -e "."
    $ jupyter labextension develop . --overwrite
    $ jupyter server extension enable widgyts
    $ jlpm build

You can then run `jlpm watch` in one terminal and `jupyter lab` in another
to automatically rebuild the extension as you edit the TypeScript source.

Using
-----

To use this, you will need to have yt installed.  Importing it monkeypatches
the Slice and Projection objects, so you are now able to do:

```
#!python
import yt
import widgyts

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
