# widgyts

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

## Documentation

Our documentation is hosted at readthedocs. Take a look
[here](https://widgyts.readthedocs.io/en/latest/).

## Installation

To install using pip from the most recent released version:

    $ pip install widgyts

To install using pip from this directory:

    $ git clone https://github.com/yt-project/widgyts.git
    $ cd widgyts
    $ pip install .

### Development installation

The following assumes you're using conda. If not, you'll need to install nodejs 
in your environemnt separately.

```bash
conda create -n widgyts-dev -c conda-forge nodejs python=3.10 jupyterlab=3
conda activate widgyts-dev
```

Install the python. This will also build the TS package.
```bash
pip install -e "."
```

When developing your extensions, you need to manually enable your extensions with the
notebook / lab frontend. For lab, this is done by the command:

```
jupyter labextension develop --overwrite .
jlpm run build
```

Note that `jupyterlab` provides `jlpm`, a jupyter-flavored version of `yarn`, 
provided by `jupyterlab`.

### How to see your changes
#### Typescript:
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.

## Using


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
