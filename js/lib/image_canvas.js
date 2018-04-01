var widgets = require('@jupyter-widgets/base');
var ipydatawidgets = require('jupyter-dataserializers');
var _ = require('lodash');

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var ImageCanvasModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend({}, widgets.DOMWidgetModel.prototype.defaults, {
        _model_name : 'ImageCanvasModel',
        _view_name : 'ImageCanvasView',
        _model_module : 'yt-jscanvas',
        _view_module : 'yt-jscanvas',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        image_array: undefined,
        width: 256,
        height: 256
    }),
}, {
    serializers: _.extend({
      image_array: ipydatawidgets.data_union_array_serialization
    }, widgets.DOMWidgetModel.serializers),
});

// We should try creating an image bitmap, then drawing it with drawImage

// Custom View. Renders the widget model.
var ImageCanvasView = widgets.DOMWidgetView.extend({
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
        this.data = null;
        this.imageData = null;
        this.imageShape = new Array(3);
        this.imageShape[0] = this.imageShape[1] = this.imageShape[2] = -1;
        this.model.on('change:image_array', this.image_array_changed, this);
        this.model.on('change:width', this.width_changed, this);
        this.model.on('change:height', this.height_changed, this);
        this.image_array_changed();
    },

    redrawCanvasImage: function() {
        var nx = this.imageShape[0];
        var ny = this.imageShape[1];
        var canvasWidth  = $(this.canvas).width();
        var canvasHeight = $(this.canvas).height();
        // Clear out image first
        createImageBitmap(this.imageData, 0, 0, nx, ny).then(function(bitmap){
              this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
              this.ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
        }.bind(this));
    },

    image_array_changed: function() {
        
        arrayModel = this.model.get('image_array');
        this.data = arrayModel;
        // https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
        a1 = this.data.shape;
        a2 = this.imageShape;
        shapeChanged = !(a1.length==a2.length
                     && a1.every(function(v,i) {return v === a2[i]}));
        if (shapeChanged) {
          // We need to reallocate our imageData and update our shape
          this.imageData = this.ctx.createImageData(
            this.data.shape[0], this.data.shape[1]);
          this.imageShape = this.data.shape;
        }
        this.imageData.data.set(this.data.data);
        this.redrawCanvasImage();
    },

    width_changed: function() {
      $(this.canvas).width(this.model.get('width'));
    },

    height_changed: function() {
      $(this.canvas).height(this.model.get('height'));
    }
});


module.exports = {
    ImageCanvasModel : ImageCanvasModel,
    ImageCanvasView : ImageCanvasView
};
