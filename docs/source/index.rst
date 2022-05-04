.. widgyts documentation master file, created by
   sphinx-quickstart on Thu Jun  6 11:14:51 2019.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to widgyts's documentation!
===================================

widgyts is a package built on jupyter widgets intended to aid in fast,
interactive, exploratory visualization of data. If you have a dataset you'd
like to explore but aren't completely sure about what parameters need to be
tuned to make the visualization that best representes your data, widgyts is the
package for you! widgyts has been designed to work as a companion to `yt
<https://yt-project.org/>`_, but it is also flexible and can handle any
mesh-based data.

widyts includes a dataset viewer for yt, as well as a fully client-side
pan-and-zoom widget, using WebAssembly, for variable mesh datasets from yt.  It
runs in the browser, so once the data hits your notebook, it's super fast and
responsive! This will allow you to quickly update your visualization to figure
out how best to illustrate the interesting aspects of your data.

If you'd like to dig into the Rust and WebAssembly portion of the code, you can
find it at `Github <https://github.com/data-exp-lab/rust-yt-tools/>`_ and in the npm
package `@data-exp-lab/yt-tools`.

Check out our `SciPy 2018 talk <https://www.youtube.com/watch?v=5dl_m_6T2bU>`_
and the `associated slides <https://munkm.github.io/2018-07-13-scipy/>`_ for more info!

.. toctree::
   :maxdepth: 2
   :caption: Table of Contents:

   install
   getting_started
   contributing
   developer_guide
   code_of_conduct
   help



Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
