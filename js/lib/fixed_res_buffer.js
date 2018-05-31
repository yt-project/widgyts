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
        colormap_name: 'viridis',
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
            console.log(this.frb.get_buffer());
            this.map_name = this.model.get('colormap_name');
            this.model.on('change:colormap_name', this.colormap_changed, this);
            console.log('colormap used:' , this.map_name);
            this.colormaps.normalize(this.map_name,
                this.frb.get_buffer(), true).then(function(array) {
                im = array;
                console.log(im);
                this.imageData = this.ctx.createImageData(
                    this.model.get('width'), this.model.get('height'),
                );
                this.imageData.data.set(im);
                this.redrawCanvasImage();
            }.bind(this));
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

    width_changed: function() {
      $(this.canvas).width(this.model.get('width'));
    },

    height_changed: function() {
      $(this.canvas).height(this.model.get('height'));
    },

    colormap_changed: function() {
      var old_name = this.map_name;
      this.map_name = this.model.get('colormap_name');
      console.log('updating buffer from %s to %s', old_name, this.map_name);

      // If the colormap name is updated then we only need to rerun normalize. 
      // All of the variables defined from our previous plotting routines do 
      // not require updating.  
      this.colormaps.normalize(this.map_name,
          this.frb.get_buffer(), true).then(function(array) {
          im = array;
          console.log(im);
          this.imageData = this.ctx.createImageData(
              this.model.get('width'), this.model.get('height'),
          );
          this.imageData.data.set(im);
          this.redrawCanvasImage();
      }.bind(this));
    }
});

module.exports = {
    FRBModel : FRBModel,
    FRBView : FRBView
};
