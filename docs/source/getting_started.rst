.. _getting_started:

Getting Started
===============

The widgyts package is designed to work with yt, but it can also work without
a yt import. 

Components of widgyts
---------------------

Presently widgyts has three widgets that a user can interact with:
``ImageCanvas``, ``FRBViewer``, and ``ColorMaps``. Each widget has a number of
traitlets that sync back to the javascript (and potentially webassembly) that
can be updated through the widget API. These traitlets can be linked (see our
:ref:`examples` for some demonstrations of this in practice) so that widget 
instances can update together. 

API Documentation
-----------------

.. autoclass:: widgyts.ImageCanvas
.. autoclass:: widgyts.FRBViewer
.. autofunction:: widgyts.FRBViewer.setup_controls
.. autofunction:: widgyts.display_yt
.. autoclass:: widgyts.ColorMaps

.. _examples:

.. include:: ../../examples/README.rst


Links:

- link to `galaxy display notebook
  <https://github.com/data-exp-lab/widgyts/blob/master/examples/galaxy_display.ipynb>`_
- link to `FRBViewer tutorial notebook
  <https://github.com/data-exp-lab/widgyts/blob/master/examples/FRBViewer_tutorial.ipynb>`_
