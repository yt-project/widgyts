var widgets = require('@jupyter-widgets/base');
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
var HelloModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'HelloModel',
        _view_name : 'HelloView',
        _model_module : 'yt-jscanvas',
        _view_module : 'yt-jscanvas',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
        value : 'Hello World'
    })
});

function colormap(inputArray, minVal, maxVal, colorMap) {
  // RGBA, and 1 byte for each, so our input times 4
  outputBuffer = new ArrayBuffer(inputArray.length * 4);
  outputImage = new Uint8ClampedArray(outputBuffer);
  for (i = 0; i < inputArray.length ; i++) {
    outputImage[i*4] = (inputArray[i] - minVal) / (maxVal - minVal) * 255;
    //outputImage[i*4] = 255;
    outputImage[i*4+3] = 255;
  }
  console.log("Returning outputImage");
  return outputImage;
}

function generateRSquared(nx, ny){
  newBuffer = new ArrayBuffer(nx * ny * 4);
  newArray = new Float32Array(newBuffer);
  dx = 2.0/nx;
  dy = 2.0/ny;
  for (i = 0; i < nx; i++) {
    for (j = 0; j < ny; j++) {
      r2 = (i * dx - 1.0)**2 + (j * dy - 1.0)**2;
      newArray[i * ny + j] = r2**0.5;
    }
  }
  console.log("Returning newArray");
  return newArray;
}


// We should try creating an image bitmap, then drawing it with drawImage

// Custom View. Renders the widget model.
var HelloView = widgets.DOMWidgetView.extend({
    render: function() {
        this.value_changed();
        this.model.on('change:value', this.value_changed, this);
        this.canvas = document.createElement('canvas');
        $(this.canvas).appendTo(this.el);
        var canvasWidth  = this.canvas.width;
        var canvasHeight = this.canvas.height;
        var ctx = this.canvas.getContext('2d');

        nx = canvasWidth; ny = canvasHeight;
        nx = 16; ny = 16;
        r2 = generateRSquared(nx, ny);
        image = colormap(r2, 0.0, 2.0, "passive");
        console.log(image);
        var imageData = ctx.createImageData(nx, ny);
        imageData.data.set(image);
        
        // Toggle this to switch on and off
        ctx.imageSmoothingEnabled = false;
        
        createImageBitmap(imageData, 0, 0, nx, ny).then(function(bitmap){
              ctx.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
        });

    },

    value_changed: function() {
        this.el.textContent = this.model.get('value');
    }
});


module.exports = {
    HelloModel : HelloModel,
    HelloView : HelloView
};
