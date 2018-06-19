var widgets = require('@jupyter-widgets/base');
var ipydatawidgets = require('jupyter-dataserializers');
var _yt_tools = import('@data-exp-lab/yt-tools');

var FRBModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend({}, widgets.DOMWidgetModel.prototype.defaults, {
        _model_name : 'FRBMovel',
        _view_name : 'FRBView',
        _model_module : 'yt-jscanvas',
        _view_module : 'yt-jscanvas',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        px: undefined,
        py: undefined,
        pdx: undefined,
        pdy: undefined,
        val: undefined,
        width: 512,
        height: 512,
        colormaps: undefined,
        canvas_edges: undefined,
    }),
}, {
    serializers: _.extend({
      px: ipydatawidgets.data_union_array_serialization,
      py: ipydatawidgets.data_union_array_serialization,
      pdx: ipydatawidgets.data_union_array_serialization,
      pdy: ipydatawidgets.data_union_array_serialization,
      val: ipydatawidgets.data_union_array_serialization,
      colormaps: { deserialize: widgets.unpack_models },
    }, widgets.DOMWidgetModel.serializers),
});

// Custom View. Renders the widget model.
var FRBView = widgets.DOMWidgetView.extend({

    render: function() {return _yt_tools.then(function(yt_tools) {
        this.canvas = document.createElement('canvas');
        $(this.canvas)
          .css("max-width", "100%")
          .css("min-width", "100px")
          .css("min-height", "100px")
          .height(this.model.get('height'))
          .width(this.model.get('width'))
          .appendTo(this.el);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.model.on('change:width', this.width_changed, this);
        this.model.on('change:height', this.height_changed, this);
        this.colormaps = this.model.get('colormaps');
        this.colormap_events();
        this.canvas_edges = this.model.get('canvas_edges');
        this.model.on('change:canvas_edges', this.buffer_changed, this);

        this.frb = yt_tools.FixedResolutionBuffer.new(
            this.model.get('width'),
            this.model.get('height'),
            this.canvas_edges[0], this.canvas_edges[1],
            this.canvas_edges[2], this.canvas_edges[3]
        );
        this.varmesh = yt_tools.VariableMesh.new(
            this.model.get("px").data,
            this.model.get("py").data,
            this.model.get("pdx").data,
            this.model.get("pdy").data,
            this.model.get("val").data
        );
        this.frb.deposit(this.varmesh);
        this.colormaps.data_array = this.frb.get_buffer();
        this.imageData = this.ctx.createImageData(
            this.model.get('width'), this.model.get('height'),
        );
        // note: image array not triggering change yet on first render. 
        // this is likely due to the fact that it's executed before the 
        // new promises have been resolved in the colormapper
        console.log(this.colormaps.image_array);
        this.imageData.data.set(this.colormaps.image_array);
        this.redrawCanvasImage();
    }.bind(this));},

    redrawCanvasImage: function() {
        var nx = this.model.get('width');
        var ny = this.model.get('height');
        var canvasWidth  = $(this.canvas).width();
        var canvasHeight = $(this.canvas).height();
        // Clear out image first
        createImageBitmap(this.imageData, 0, 0, nx, ny).then(function(bitmap){
              this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
              this.ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
        }.bind(this));
    },

    colormap_events: function() {
        // Set up listeners for the colormap name and scale. Nothing in the FRB 
        // links to these directly so the responses are simple. 
        this.listenTo(this.colormaps, 'change:map_name', function() {
            var new_name = this.colormaps.get('map_name');
            console.log('map name change detected in frb to %s', new_name);
        }, this); 
        this.listenTo(this.colormaps, 'change:is_log', function() {
            var scale = this.colormaps.get('is_log');
            console.log('image array log scale change in frb to %s', scale);
        }, this); 

        // The listener for the data array of the colormap actually links to the 
        // FRB directly, so a little bit more needs to be done here. Also, since 
        // the data array is set on the js side it may differ from the python side 
        // until we resolve those issues.


        // Last, once a change in the image array is detected, we will redraw 
        // it on the canvas image. 
        this.listenTo(this.colormaps, 'change:image_array', function() {
            var array = this.colormaps.get('image_array');
            console.log('image array updated to: ', array);
            this.imageData = this.ctx.createImageData(
                this.model.get('width'), this.model.get('height'),
            );
            this.imageData.data.set(array);
            console.log('redrawing image array on canvas');
            this.redrawCanvasImage();
        }, this); 
    },

    buffer_changed: function() {
        this.canvas_edges = this.model.get('canvas_edges');
        console.log('canvas edge array changed to:');
        console.log(this.canvas_edges);
        _yt_tools.then(function(yt_tools) {
            this.frb = yt_tools.FixedResolutionBuffer.new(
                this.model.get('width'),
                this.model.get('height'),
                this.canvas_edges[0], this.canvas_edges[1],
                this.canvas_edges[2], this.canvas_edges[3]
            );
            this.frb.deposit(this.varmesh);
            this.colormaps.data_array = this.frb.get_buffer();
            // data array not triggering listeners in colormaps. 
            // Normalize() call required to update image array. 
            this.colormaps.normalize();
        }.bind(this));
    },

    width_changed: function() {
      $(this.canvas).width(this.model.get('width'));
    },

    height_changed: function() {
      $(this.canvas).height(this.model.get('height'));
    },

});

module.exports = {
    FRBModel : FRBModel,
    FRBView : FRBView
};
