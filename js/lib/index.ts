import ImageCanvasModel = require("./image_canvas").ImageCanvasModel;
import ImageCanvasView = require("./image_canvas").ImageCanvasView;
import FRBView= require("./image_canvas").FRBView;
import FRBModel= require("./image_canvas").FRBModel;
import CMapModel= require("./image_canvas").CMapModel;
import version = require('../package.json').version;

export = {
    ImageCanvasModel : ImageCanvasModel,
    ImageCanvasView : ImageCanvasView,
    FRBView: FRBView,
    FRBModel: FRBModel,
    CMapModel: CMapModel,
    version : version
};
