.. _getting_started:

Getting Started
===============

The widgyts package is designed to work with yt, but it can also work without
a yt import. 

Components of widgyts
---------------------

There are two different sets of widgets that widgyts has, that are for different purposes.

.. note:: We anticipate these will eventually be unified!

Dataset Summary Viewer
++++++++++++++++++++++

Widgyts has an "overview" module for viewing datasets, with a simple 3D grid
viewer built-in for AMR datasets.  At present it has a few widgets that you can
generate, but only one (``DatasetViewer``) is necessary, as the others are
implicitly set up.

The ``DatasetViewer`` has a list of ``components`` that are all displayed; this
automatically includes a viewer for the ``ds.parameters`` object and a viewer
for the fields and some other metadata about the dataset.  You can append any
``ipywidgets`` component to have it viewed inline, but we also anticipate this
being the place that additional widgets and functionality will be added to
widgyts.

Unlike the variable mesh viewer, the ``DatasetViewer`` needs to be both instantiated explicitly and the ``widget()`` method called on it:

.. code:: python

   import yt
   import widgyts
   ds = yt.load_sample("IsolatedGalaxy")
   dsv = widgyts.DatasetViewer(ds = ds)
   dsv.widget()

The data displayed here should persist with a notebook save, and should even be
visible on `nbviewer<https://nbviewer.jupyter.org>`_!

Variable Mesh Viewer
++++++++++++++++++++

The "pan and zoom" part of widgyts has three widgets that a user can interact
with: ``ImageCanvas``, ``FRBViewer``, and ``ColorMaps``.  Each widget has a
number of traitlets that sync back to the javascript (and potentially
webassembly) that can be updated through the widget API. These traitlets can be
linked (see our :ref:`examples` for some demonstrations of this in practice) so
that widget instances can update together. 

API Documentation
-----------------

.. autoclass:: widgyts.ImageCanvas
.. autoclass:: widgyts.FRBViewer
.. autofunction:: widgyts.FRBViewer.setup_controls
.. autofunction:: widgyts.display_yt
.. autoclass:: widgyts.ColorMaps
.. autoclass:: widgyts.DatasetViewer
.. autoclass:: widgyts.AMRDomainViewer
.. autoclass:: widgyts.FieldDefinitionViewer
.. autoclass:: widgyts.ParametersViewer

.. _examples:

.. include:: ../../examples/README.rst


Links:

- link to `galaxy display notebook
  <https://github.com/data-exp-lab/widgyts/blob/master/examples/galaxy_display.ipynb>`_
- link to `FRBViewer tutorial notebook
  <https://github.com/data-exp-lab/widgyts/blob/master/examples/FRBViewer_tutorial.ipynb>`_
