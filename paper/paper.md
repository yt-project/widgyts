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

`widgyts` is a custom Jupyter widget library to assist in interactive data
visualization and exploration with `yt`. `yt` [@turk_yt_2011] is a python 
package designed to read, process, and visualize multidimensional
scientific data. `yt` allows users to ingest and visualize data from 
a variety of scientific domains with a nearly identical set of commands. Often,
these datasets are large, sparse, complex, and located remotely. Creating a
publication-quality figure of an area of interest for this data may take
numerous exploratory visualizations and subsequent parameter-tuning events.
The `widgyts` package allows for interactive exploratory visualization with `yt`, 
enabling users to more readily determine which parameters and selections they
need to best display their data. 

The `widgyts` package is built on the `ipywidgets` [@grout_ipywidgets_2019] framework, which
allows `yt` users to browse their data using a Jupyter notebook or a Jupyterlab
instance. `widgyts` is developed on GitHub in the Data Exploration Lab organization. Issues,
questions, new feature requests, and any other relevant discussion can be found
at the source code repository [@munk_widgyts_2019].

# Motivation

Data visualization and manipulation are integral to scientific discovery.
A scientist may slice and pan through various regions of a dataset before
finding a region they wish to share with colleagues. These events may
also require shifting colormap settings, like the scale, type, or bounds,
before the features are highlighted to effectively convey a message. Each of
these interactions will require a new image to be calculated and displayed.

A number of packages in the python ecosystem use interactivity to help users
parameter-tune their visualizations. Matplotlib and ITK 
have custom widgets build on the ipywidgets framework [@jupyter-matplotlib_2019,
@itkwidgets_2019] that act as supplements to their plots. 
This is the principle that widgyts follows as well. 
Other libraries like 
Bokeh [@bokeh_2019] distribute interactive javascript-backed widgets. 
Other frameworks like bqplot [@bqplot_2019] 
have every plot returned with interactive features. The packages named here are
by no means
comprehensive; the python ecosystem is rich with interactive tools for
visualization. However, it is illustrative of the need and investment in
interactivity for the visualization community.

A common user case for visualization is to have data stored remotely on a
server and some interface with which to interact with the data over the web. 
Because every plot interaction requires a new image calculation, this may
result in significant data transfer needs. 
For this case, a request is sent
to the server, which calculates the images, with every new plot interaction.
When the request is sent the server calculates a new image, 
serializes it, and the
image is sent back to the client. The total time to generate one image can
generally be expressed as $T_{\text{server}}$, where 

$$t_{\text{server}} = t_{\text{request}} + t_{\text{image calc, server}} + \
t_{\text{pull, image}} + t_{\text{display}}.
$$

The total compute time spent on image generation is $T_{\text{server}} = n*t_{\text{server}}$, where $n$
is the number of interactions with the figure. 

`widgyts` modifies this process by shifting image calculation to occur
client-side in the browser. 
Rather than image serialization and calculation happening on a
remote server, a portion of the original data is uploaded into the `WebAssembly` backend of
`widgyts`. The time to calculate image client-side can be expressed as:

$$t_{\text{client}} = t_{\text{request}} + t_{\text{pull,data}} + t_{\text{image calc, client}} \
+ t_{\text{display}}.$$

Subsequent interactions ($n$) with the image only affect the final two terms of
the equation, so 

$$T_{\text{client}} = t_{\text{request}} + t_{\text{pull,data}} + \
n*[t_{\text{image calc, client}} + t_{\text{display}}].$$

Thus, this becomes advantageous as 

$$ T_{\text{client}} < T_{\text{server}} $$

or

$$
n*t_{\text{image calc, client}} + t_{\text{pull, data}} <  \
n*[t_{\text{image calc, server}} + t_{\text{pull, image}}] .
$$

The time to pull an image or data is dependent on the data size and the
transfer rate. 
$T_{\text{client}}$ will be lower than $T_{\text{server}}$ as the number of
interactions $n$ grows, as the size of the image (data$_{\text{image}}$) grows, and as
the time to calculate the image on the client $t_{\text{image calc, client}}$
decreases. 

Moving image calculation to the client requires a large initial cost of
transferring a portion of the original data to the client, which may be
substantially larger than the size of a single image. However, a dataset with
sparse regions will be more efficient to transfer to the client and subsequently
calculate and pixelize there. Pixelizing a dataset with large, sparse regions of low
resolution, such as one caclated from an adaptive mesh, 
with a fixed higher resolution will require recaculating and sending
pixel values for a region that may only be represented by a single value. Thus,
for certain data representations this methodology also becomes advantageous.

# The WebAssembly Backend

To allow for efficient data loading into the browser we chose to use Rust
compiled to WebAssembly. The WebAssembly backing of `widgyts` allows for binary, zero-copy
storage of loaded data on the client side, and WebAssembly has been designed to
interface well with JavaScript. Further, the primitive structure of WebAssembly
reduces the time to calculate the image in the browser, thus reducing the time
to calculate the image client-side. Finally, WebAssembly
is executed in a sandboxed environment separate from other processes 
and is memory safe. At the time of writing, widgyts is the only
webassembly-native backed visualization widget in the python ecosystem. 

While `yt` can access data at an arbitrary location within the dataset, `widgyts`
is structured to access any data within a 2D slice. Thus, only a slice of the
data is uploaded client-side, not the entire dataset. For the large, sparse
datasets that `widgyts` has been designed for, it would be infeasible to upload
the entire dataset into the browser. A new slice in
the third dimension will require an additional data upload from the server. Therefore,
not all
exploration of the dataset can be performed exclusively client-side.

# Results

The following image is a simple timing comparison between using `yt` with 
the Jupyter widgets package `ipywidgets` 
and using the `widgyts` package on the same dataset. The dataset is the
IsolatedGalaxy dataset; a commonly used example in the yt documentation
consisting of a galaxy simulation perfomed on an adaptive mesh. The dataset has
variable resolution and is sparse near the domain boundaries. 
A notebook is
included in the `widgyts` repository [@munk_widgyts_2019] for one interested in replicating this
analysis.

-![A timing comparison between using `ipywidgets` with `yt` and `widgyts` on
the IsolatedGalaxy dataset distributed with `yt`. The image generated by each 
tool is 512x512 pixels. Each timing point is based 
on a number of panning interactions in x, averaged over 10 measurements. The
data points are accompanied by a 95% confidence interval.](timing.png)

While `widgyts` outperforms the implementation of `ipywidgets` with `yt` that we
wrote for this paper, there are a number of factors that may affect these
timing results beyond loading the data in the browser. In the Jupyter widgets
implementation we are using `yt` functionality to recalculate image and convert
it into a .png, which is being done in WebAssembly in `widgyts`. This is the most 
extreme example of reducing the time to compute in the browser, because almost
no computation is being performed browser-side in the `ipywidgets` case. This calculation
was performed locally, so while the data is being transfered continuously to the
browser with the Jupyter widgets implementation, the timing results may become 
more disparate with a slower data transfer time from a remote server. Other
packages with custom tools for interactivity may be faster than the naive
implementation with `ipywidgets` that we've included here. 
However, these results remain an illustrative example that
loading data into the browser and performing image recalculation in the browser
is advantageous. 

# Conclusions

In this paper we introduced `widgyts`, a custom widget library to interactively
visualize and explore data with `yt`. `widgyts` makes large, sparse, data
exploration accessible by passing data to the browser with WebAssembly, 
allowing for image generation to occur client-side. As the number of
interactions from the user increases and as datasets vary in sparsity, `widgyts`'
features will allow for faster responsiveness. This will reduce the use of
expensive compute resources (like those of a lab or campus cluster) and move
parameter-tuning events to a local machine. 

# Acknowledgements

We would like to acknowledge the contributions to this project from other
developers, including Nathanael Claussen, Kacper Kowalik, and Vasu Chaudhary. 
This work was supported by the Gordon and Betty
Moore Foundation's Data-Driven Discovery Initiative through Grant GBMF4561 (MJT).

# References
