############
Contributing
############

We welcome and encourage new contributors to this project! We're happy to help
you work through any issues you're having or to help you contribute to the
project, so please reach out if you're interested. 

.. important::
   We want your help. No, really.

   There may be a little voice inside your head that is telling you that you're
   not ready to be an open source contributor; that your skills aren't nearly good
   enough to contribute. What could you possibly offer a project like this one?
   
   We assure you - the little voice in your head is wrong. If you can write code
   at all, you can contribute code to open source. Contributing to open source
   projects is a fantastic way to advance one's coding skills. Writing perfect
   code isn't the measure of a good developer (that would disqualify all of us!);
   it's trying to create something, making mistakes, and learning from those
   mistakes. That's how we all improve, and we are happy to help others learn.
   
   Being an open source contributor doesn't just mean writing code, either. You
   can help out by writing documentation, tests, or even giving feedback about the
   project (and yes - that includes giving feedback about the contribution
   process). Some of these contributions may be the most valuable to the project
   as a whole, because you're coming to the project with fresh eyes, so you can
   see the errors and assumptions that seasoned contributors have glossed over.

Issues, Bugs, and New Feature Suggestions
-----------------------------------------

If you have
suggestions on new features, improvements to the project itself, you've
detected some unruly behavior or a bug, or a suggestion of how we can
make the project more accessible, feel free to file an `issue on
github <https://github.com/data-exp-lab/widgyts/issues)>`_. 

Communication Channels
----------------------

If you need help or have any questions about using widgyts that's beyond the
documentation (or if you'd like to join our community), you're welcome to
join the `yt project's slack <https://yt-project.org/slack.html>`_ (specifically in the widgyts channel) 
or ask in the `yt users mailing list
<https://mail.python.org/mailman3/lists/yt-users.python.org/>`_.

If you'd like to talk about new features or development of widgyts, the widyts
channel in the `yt project's slack <https://yt-project.org/slack.html>`_ is a
good place to go. The `yt development mailing list 
<https://mail.python.org/mailman3/lists/yt-dev.python.org/>`_ is channel where
these discussions are welcomed. 

Contributing Code
-----------------

We would be delighted for you to join and work on the widgyts project! If
you're interested in getting started, browse some of our `open issues
<https://github.com/data-exp-lab/widgyts/issues>`_ and see if there's anything
that you may find interesting. If there's a new feature you'd like to add that
isn't in open issues, please reach out in the `widgyts slack channel in the yt
slack <https://yt-project.org/slack.html>`_ or on the `yt development mailing 
list <https://mail.python.org/mailman3/lists/yt-dev.python.org/>`_ to talk a 
bit more about
what you'd like to contribute. This will help make your contribution review go
smoothly and merge quickly!

To get a development environment set up on your machine, please see the
:ref:`development_install` directions to get started. 

When issuing a pull request for new features in the widgyts package, please 
make sure the following are satisfied:

- new features have accompanying documentation, including docstrings and
  examples
- if javascript functionality is added, ensure it is commented thoroughly
- tests have been added for new features
- all tests run and pass
- new documentation satisfies documentation contribution requirements

.. _building_the_documentation:

Contributing Examples or Documentation
--------------------------------------

To contribute new examples or update the documentation you do not need to have
a development build of widgyts on your personal machine. To build the
documentation, we have opted to use the same method as `ipywidgets
<https://ipywidgets.readthedocs.io/en/stable/dev_docs.html>`_ and distribute an
``environment.yml`` file that can be used to create an environment with the
necessary packages to build the documentation on your personal machine. 

To install a widgyts docs environment with conda::

  $ conda env create -f docs/environment.yml

and then to activate it::

  $ source activate widgyts_docs

Once the packages necessary to build the documentation are installed on your
machine, navigate into the documentation folder and use the Makefile to build
the documentation::

  $ cd docs
  $ make clean
  $ make html

The documentation will be built in the ``build/html`` folder.  

When issuing a pull request for additional documentation or new examples, please 
make sure the following are satisfied:

- new links, references, and pages work as expected
- the documentation renders locally 
- trivializing words like "just", "simply" or "trivial" are used minimally
- if contributing a notebook, ensure that the data source is clearly documented 
- if contributing a notebook, please ensure that each cell has a preamble
  or comment explaining the contents of the next cell to be executed 

Code Review and Expectations
-----------------------------

After you submit a PR with your contribution, you can expect maintainers of the
project to begin review within a week. 

Please keep in mind
that this project is fairly new, so we will try to get back to you as soon as
possible with any contributions, but it may take a few days. 

.. note::
   We expect members of this community to abide by the :doc:`Code of Conduct
   <code_of_conduct>` when interacting in this community. 
