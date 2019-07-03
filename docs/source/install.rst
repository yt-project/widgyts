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
`Github <https://github.com/data-exp-lab/widgyts>`_::

  $ git clone https://github.com/data-exp-lab/widgyts.git

Then navigate into the newly created directory and install using pip::

  $ cd widgyts
  $ pip install .

.. _development_install:
  
Development Installation 
------------------------

For a development installation your machine will need npm to manage the
associated javascript code and dependencies. :: 

  $ git clone https://github.com/data-exp-lab/widgyts.git
  $ cd widgyts/js
  $ npm install 
  $ cd ../
  $ pip install -e .
  $ jupyter serverextension enable --py --sys-prefix widgyts
  $ jupyter nbextension install --py --symlink --sys-prefix widgyts
  $ jupyter nbextension enable --py --sys-prefix widgyts

If you are modifying code on the python side, you may have to periodically
update your installation from the steps ``pip install`` onwards. If you are
modifying javascript code, you'll need to rerun ``npm install`` to have your
changes available in jupyter notebooks.

Note that in previous versions, serverextension was not provided and you were
required to set up your own mimetype in your local configuration.  This is no
longer the case and you are now able to use this server extension to set up the
correct wasm mimetype.

To install the jupyterlab extension, you will need to make sure you are on a
recent enough version of Jupyterlab, preferably 0.35 or above.  For a
development installation, do: ::

    $ jupyter labextension install js

To install the latest released version, :: 

    $ jupyter labextension install @data-exp-lab/yt-widgets

