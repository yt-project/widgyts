.. _developer_guide:

###############
Developer Guide
###############

Getting A Development Build of Widgyts
--------------------------------------

To get a development build of ``widgyts`` on your machine, refer to the
:ref:`development_install` instructions.

Building the Docs
-----------------

To build the documentation locally, refer to the instructions in the
:ref:`building_the_documentation` section.

Testing
-------

Our test framework uses pytest. At present, the tests for widgyts are located
in the ``widgyts/widgyts/tests/`` directory. To run the tests, you can
execute::

  $ pytest

in the top level widgyts directory. Alternatively, you may choose to run a
single file of tests, which can be run using::

  $ pytest ./widgyts/tests/test_widgyts.py

Finally, you can choose to run a single test by calling the specific class and
function that run the test within the file by::

  $ pytest widgyts/tests/test_widgyts.py::TestControls::test_zoom_view


Releasing
---------
