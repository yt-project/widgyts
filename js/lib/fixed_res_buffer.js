var widgets = require('@jupyter-widgets/base');
var ipydatawidgets = require('jupyter-dataserializers');
var yt_tools = require('yt-tools');

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
    render: function() {
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
        yt_tools.booted.then(function(yt_tools) {
            this.colormaps = this.model.get('colormaps');
            this.colormap_events();
            this.frb = yt_tools.FixedResolutionBuffer.new(
                this.model.get('width'),
                this.model.get('height'),
                0.45, 0.65, 0.45, 0.65
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
        }.bind(this));
    },

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
