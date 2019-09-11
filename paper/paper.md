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
date: 11 Sep 2019
bibliography: paper.bib
---

# Summary

widgyts is a custom jupyter widget library to assist in interactive data
visualization and exploration with yt. yt [@turk_yt:_2010] is a python 
package designed to read, process, and visualize multidimensional
scientific data. yt allows users to ingest and visualize data from 
a variety of scientific domains with a nearly identical set of commands. Often,
these datasets are large, sparse, complex, and located remotely. Creating a
publication-quality figure of an area of interest for this data may take
numerous exploratory visualizations and subsequent parameter-tuning events.
The widgyts package allows for interactive exploratory visualization with yt, 
enabling users to more readily determine which parameters and selections they
need to best display their data. 

The widgyts package is built on the ipywidgets [@grout_ipywidgets_2019] framework, which
allows yt users to browse their data using a Jupyter notebook or a Jupyterlab
instance. widgyts is developed on GitHub in the Data Exploration Lab organization. Issues,
questions, new feature requests, and any other relevant discussion can be found
at the source code repository [@munk_widgyts_2019].

# Motivation

Data visualization and manipulation are integral to scientific discovery.
A scientist may slice and pan through various regions of a dataset before
finding a region they wish to share with colleagues. These events may
also require shifting colormap settings, like the scale, type, or bounds,
before the features are highlighted to effectively convey a message. If a
dataset is located on a remote server, for each interaction a request is sent
to the server, the server then calculates a new image, serializes it, and the
image is sent back to the client. The total time to generate one image can
generally be expressed as $T_{server}$, where 

$$t_{server} = t_{request} + t_{image calc, server} + t_{pull,image} + t_{display}.
$$

The total compute time spent on image generation is $T_{server} = n*t_{server}$, where $n$
is the number of interactions with the figure. 

Widgyts modifies this process by shifting image calculation to occur
client-side. Rather than image serialization and calculation happening at a
remote server, a portion of the original data is uploaded into the WebAssembly backend of
widgyts. The time to calculate image client-side can be expressed as:

$$t_{client} = t_{request} + t_{pull,data} + t_{image calc, client} + t_{display}.$$

Subsequent interactions ($n$) with the image only affect the final two terms of
the equation, so 

$$T_{client} = t_{request} + t_{pull,data} + n*[t_{image calc, client} + t_{display}].$$

Thus, this becomes advantageous as 

$$ T_{client} < T_{server}
n*t_{imaage calc, client} + t_{pull, data} < n*[t_{image_calc, server} + \ 
t_{pull, image}]
$$

The time to pull an image or data is dependent on the data size and the
transfer rate. 
$T_{client}$ will be lower than $T_{server}$ as the number of
interactions $n$ grows, as the size of the image (data$_{image}$) grows, and as
the time to calculate the image on the client $t_{image calc, client}$
decreases. 

Moving image calculation to the client requires a large initial cost of
transferring a portion of the original data to the client, which may be
substantially larger than the size of a single image. However, a dataset with
sparse regions will be more efficient to transfer to the client and subsequently
calculate and pixelize there. Pixelizing a dataset with large, sparse regions of low
resolution, such as one caclated on an adaptive mesh, 
with a fixed higher resolution will require recaculating and sending
pixel values for a region that may only be represented by a single value. 

# The WebAssembly backend

To allow for efficient data loading into the browser we chose to use Rust
compiled to WebAssembly. The WebAssembly backing of widgyts allows for binary, zero-copy
storage of loaded data on the client side, and WebAssembly has been designed to
interface well with JavaScript. Further, the primitive structure of WebAssembly
reduces the time to calculate the image in the browser. Finally, WebAssembly
is executed in a sandboxed environment separate from other processes 
and is memory safe. 

While yt can access data at an arbitrary location within the dataset, widgyts
is structured to access any data within a 2D slice. Thus, only a slice of the
data is uploaded client-side, not the entire dataset. For the large, sparse
datasets that widgyts has been designed for, it would be infeasible to upload
the entire dataset into the browser. However, a new slice in
the third dimension will require a new data upload from the server so not all
exploration of the dataset can be performed exclusively client-side.

todo: performance comparison with datasets of varying sparsity and show how
they scale with wigyts vs. wrapping yt viz functions with standard widgets. 

# Conclusions

In this paper we introduced `widgyts`, a custom widget library to interactively
visualize and explore data with yt. widgyts makes large, sparse, data
exploration accessible by passing data to the browser with WebAssembly, 
allowing for image generation to occur client-side. As the number of
interactions from the user increases and as datasets vary in sparsity, widgyts'
features will allow for faster responsiveness. This will reduce the use of
expensive compute resources (like those of a lab or campus cluster) and move
parameter-tuning events to a local machine. 

# Acknowledgements

We would like to acknowledge the contributions to this project from other
developers, including Nathanael Claussen, Kacper Kowalik, and Vasu Chaudhary. 
This work was supported by the Gordon and Betty
Moore Foundation's Data-Driven Discovery Initiative through Grant GBMF4561 (MJT).

# References
