var ImageCanvasModel = require("./index").ImageCanvasModel;
var ImageCanvasView = require("./index").ImageCanvasView;
var FRBView= require("./index").FRBView;
var FRBModel= require("./index").FRBModel;
var CMapModel= require("./index").CMapModel;
var version = require('../package.json').version;

module.exports = {
    ImageCanvasModel : ImageCanvasModel,
    ImageCanvasView : ImageCanvasView,
    FRBView: frb.FRBView,
    FRBModel: frb.FRBModel,
    CMapModel: cmaps.CMapModel,
    version : version
};
