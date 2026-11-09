.. _installation:

############
Installation
############

Dependencies
------------

The widgyts project depends on a number of packages. Minimally, your machine
should have ``ipywidgets``, ``ipydatawidgets`` and ``yt``.

For a development version, you will also be required to install `npm
<https://www.npmjs.com/>`_ and `node.js <https://nodejs.org/en/>`_ to manage
the javascript code and associated dependencies. Due to the
proliferation of the jupyter widgets ecosystem, these are available to install
with conda.

PyPI Installation (recommended)
-------------------------------

``widgyts`` is packaged and available on the `Python Package Index
<https://pypi.org/project/widgyts/>`_. You can install ``widgyts`` from pypi by
executing::

  $ pip install widgyts

Note that if you do not already have jupyter widgets or jupyter datawidgets
installed on your machine or in your current active environment,
this step may take some time.

Installation from Source
------------------------

To install ``widgyts`` from source, you'll need to clone the repository from
`Github <https://github.com/yt-project/widgyts>`_::

  $ git clone https://github.com/yt-project/widgyts.git

Then navigate into the newly created directory and install using pip::

  $ cd widgyts
  $ pip install .

.. _development_install:

Development Installation
------------------------

``widgyts`` is a prebuilt JupyterLab 4 extension, so no ``jupyter
labextension install`` step is needed for regular installations. For a
development installation your machine will need `node.js
<https://nodejs.org/en/>`_ (which provides the ``jlpm`` package manager bundled
with JupyterLab) to build the javascript code::

  $ git clone https://github.com/yt-project/widgyts.git
  $ cd widgyts
  $ pip install -e "."
  $ jupyter labextension develop . --overwrite
  $ jupyter server extension enable widgyts
  $ jlpm build

If you are modifying javascript code, you can watch the source directory and
rebuild automatically in one terminal while running JupyterLab in another::

  $ jlpm watch
  $ jupyter lab

Note that in previous versions, a server extension was not provided and you
were required to set up your own mimetype in your local configuration.  This is
no longer the case: the bundled server extension registers the correct wasm
mimetype.

To uninstall a development installation::

  $ pip uninstall widgyts

and remove the ``@yt-project/yt-widgets`` symlink from the ``labextensions``
directory reported by ``jupyter labextension list``.
