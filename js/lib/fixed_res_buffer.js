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
        view_center: undefined,
        view_width: undefined
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
        this.canvas.width = this.model.get('width');
        this.canvas.height = this.model.get('height');
        $(this.canvas)
          .css("width", "100%")
          .css("height", "100%")
          .appendTo(this.el);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        console.log(this.canvas);
        console.log(this.ctx);
        this.model.on('change:width', this.width_changed, this);
        this.model.on('change:height', this.height_changed, this);
        this.model.on('change:width', this.buffer_changed, this);
        this.model.on('change:height', this.buffer_changed, this);
        this.colormaps = this.model.get('colormaps');
        this.setupBuffers();
        this.colormap_events();
        this.view_width = this.model.get('wiew_width');
        this.view_center = this.model.get('view_center');
        this.model.on('change:view_width', this.buffer_changed, this);
        this.model.on('change:view_center', this.buffer_changed, this);
        this.mouse_events();
        bounds = this.calculate_view_bounds();

        this.frb = yt_tools.FixedResolutionBuffer.new(
            this.model.get('width'),
            this.model.get('height'),
            bounds[0], bounds[1],
            bounds[2], bounds[3]
        );
        this.varmesh = yt_tools.VariableMesh.new(
            this.model.get("px").data,
            this.model.get("py").data,
            this.model.get("pdx").data,
            this.model.get("pdy").data,
            this.model.get("val").data
        );
        this.frb.deposit(this.varmesh, this.buffer);
        this.colormaps.data_array = this.buffer;
        this.imageData = this.ctx.createImageData(
            this.model.get('width'), this.model.get('height'),
        );
        this.imageData.data.set(this.colormaps.image_array);
        this.redrawCanvasImage();
    }.bind(this));},

    setupBuffers: function() {
        nx = this.model.get('width');
        ny = this.model.get('height');
        this._buffer = new ArrayBuffer(nx * ny * 8);
        this._image_buffer = new ArrayBuffer(nx * ny);
        this.buffer = new Float64Array(this._buffer);
        // RGBA
        this.image_buffer = new Uint8Array(nx * ny * 4);
        this.colormaps.data_array = this.buffer;
        this.colormaps.image_array = this.image_buffer;
    },

    redrawCanvasImage: function() {
        var nx = this.model.get('width');
        var ny = this.model.get('height');
        // Clear out image first
        createImageBitmap(this.imageData, 0, 0, nx, ny).then(function(bitmap){
              this.ctx.clearRect(0, 0, nx, ny);
              this.ctx.drawImage(bitmap, 0, 0, nx, ny);
        }.bind(this));
    },

    mouse_events: function() {
        this.canvas.addEventListener('click', this.onClick.bind(this), false);
    },

    onClick: function(e) {
        var loc = {x: 0, y:0};
        var cbounds = this.canvas.getBoundingClientRect();
        loc.x = (e.clientX - cbounds.left)/cbounds.width;
        loc.y = (cbounds.bottom - e.clientY)/cbounds.height;
        console.log("loc x:", loc.x, "loc y:", loc.y);
        left_edge = this.view_center[0]-this.view_width[0]/2;
        bottom_edge = this.view_center[1]-this.view_width[1]/2;
        center_x = loc.x*this.view_width[0]+left_edge;
        center_y = loc.y*this.view_width[1]+bottom_edge;
        updated_center = [center_x, center_y];
        console.log('old center:', this.view_center);
        console.log('setting new center to:', updated_center);
        this.model.set({'view_center':updated_center});
        this.model.save_changes();
        console.log('done updating center');
    },

    colormap_events: function() {
        // Set up listeners for the colormap name and scale. Nothing in the FRB 
        // links to these directly so the responses are simple. 
        this.listenTo(this.colormaps, 'change:map_name', function() {
            var new_name = this.colormaps.get('map_name');
        }, this); 
        this.listenTo(this.colormaps, 'change:is_log', function() {
            var scale = this.colormaps.get('is_log');
        }, this); 

        // The listener for the data array of the colormap actually links to the 
        // FRB directly, so a little bit more needs to be done here. Also, since 
        // the data array is set on the js side it may differ from the python side 
        // until we resolve those issues.


        // Last, once a change in the image array is detected, we will redraw 
        // it on the canvas image. 
        this.listenTo(this.colormaps, 'change:generation', function() {
            this.imageData = this.ctx.createImageData(
                this.model.get('width'), this.model.get('height'),
            );
            this.imageData.data.set(this.colormaps.image_array);
            console.log('redrawing image array on canvas');
            this.redrawCanvasImage();
        }, this); 
    },

    buffer_changed: function() {
        bounds = this.calculate_view_bounds();
        console.log(bounds);
        _yt_tools.then(function(yt_tools) {
            this.frb = yt_tools.FixedResolutionBuffer.new(
                this.model.get('width'),
                this.model.get('height'),
                bounds[0], bounds[1],
                bounds[2], bounds[3]
            );
            this.frb.deposit(this.varmesh, this.buffer);
            this.colormaps.data_array = this.buffer;
            // data array not triggering listeners in colormaps. 
            // Normalize() call required to update image array. 
            this.colormaps.normalize();
        }.bind(this));
    },

    calculate_view_bounds: function() {
        this.view_width = this.model.get('view_width');
        this.view_center = this.model.get('view_center');
        hwidths = [this.view_width[0]/2, this.view_width[1]/2];
        var bounds = [this.view_center[0]-hwidths[0],
                  this.view_center[0]+hwidths[0], 
                  this.view_center[1]-hwidths[1], 
                  this.view_center[1]+hwidths[1]];
        return bounds
    },

    width_changed: function() {
      this.canvas.width = this.model.get('width');
      this.setupBuffers();
    },

    height_changed: function() {
      this.canvas.height = this.model.get('height');
      this.setupBuffers();
    },

});

module.exports = {
    FRBModel : FRBModel,
    FRBView : FRBView
};
