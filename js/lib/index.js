var ImageCanvasModel = require("./image_canvas").ImageCanvasModel;
var ImageCanvasView = require("./image_canvas").ImageCanvasView;
var FRBView= require("./image_canvas").FRBView;
var FRBModel= require("./image_canvas").FRBModel;
var CMapModel= require("./image_canvas").CMapModel;
var version = require('../package.json').version;

module.exports = {
    ImageCanvasModel : ImageCanvasModel,
    ImageCanvasView : ImageCanvasView,
    FRBView: FRBView,
    FRBModel: FRBModel,
    CMapModel: CMapModel,
    version : version
};
