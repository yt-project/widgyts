---
title: 'widgyts: Custom Jupyter Widgets for Interactive Data Exploration with yt'
tags:
  - Python
  - visualization
  - interactive visualization
authors:
  - name: Madicken Munk
    orcid: 0000-0003-0117-5366
    affiliation: 1
  - name: Matthew J. Turk
    orcid: 0000-0002-5294-0198
    affiliation: 1
affiliations:
  - name: National Center for Supercomputing Applications, University of Illinois at Urbana-Champaign. 1205 W Clark St, Urbana, IL USA 61801
    index: 1
date: 10 Sep 2019
bibliography: paper.bib
---

# Summary

widgyts is a custom jupyter widget library to assist in interactive data
visualization and exploration with yt. yt [@turk_yt:_2010] is a python 
package designed to ingest, process, and visualize multidimensional
scientific data. yt allows users to ingest and visualize data from 
a variety of scientific domains with a nearly identical set of commands. Often,
these datasets are large, sparse, complex, and located remotely. Creating a
publication-quality figure of an area of interest for this data may take
numerous exploratory visualizations and subsequent parameter-tuning events.
The widgyts package allows for interactive visualization with yt, making these
types of events accessible to a broad user base. 

widgyts is built on the ipywidgets [@grout_ipywidgets_2019] framework. 

widgyts is developed on GitHub in the Data Exploration Lab organization. Issues,
questions, new feature requests, and any other relevant discussion can be found
there [@munk_widgyts_2019].

todo: do we want to archive the source code to Zenodo? 

# yt and data accessibility

# The WebAssembly backend

todo: performance comparison with datasets of varying sparsity and show how
they scale with wigyts vs. wrapping yt viz functions with standard widgets. 

# Conclusions

In this paper we introduced `widgyts`, a custom widget library to interactively
visualize and explore data with yt. widgyts makes large, sparse, data
exploration more accessible by passing data to the browser with WebAssembly, 
allowing for image generation to occur client-side. As the number of
interactions from the user increases and as datasets vary in sparsity, widgyts'
features will allow for faster responsiveness.

# Acknowledgements

We would like to acknowledge the contributions to this project from other
developers, including Nathanael Claussen, Kacper Kowalik, and Vasu Chaudhary. 
This work was supported by the Gordon and Betty
Moore Foundation's Data-Driven Discovery Initiative through Grant GBMF4561 (MJT).

# References
