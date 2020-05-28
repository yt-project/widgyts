import { DOMWidgetModel, ISerializers } from '@jupyter-widgets/base';
import { CanvasView } from 'ipycanvas';
import { VariableMesh, FixedResolutionBuffer} from '@data-exp-lab/yt-tools';
var EXTENSION_VERSION = '0.4.0';

function serializeArray(array: Float64Array) {
    return new DataView(array.buffer.slice(0));
}

function deserializeArray(dataview: DataView | null) {
    if (dataview === null) {
        return null;
    }

    return new Float64Array(dataview.buffer);
}

/* 
 * We have this as we can potentially have more than one FRB for a variable mesh
 *
 */
export class VariableMeshModel extends DOMWidgetModel
{
    defaults() {
        return {...super.defaults(),
            _model_name: VariableMeshModel.model_name,
            _model_module: VariableMeshModel.model_module,
            _model_module_version: EXTENSION_VERSION,
            _view_module_version: EXTENSION_VERSION,
            px: null,
            pdx: null,
            py: null,
            pdy: null,
            val: null,
            variable_mesh: null
        };
    }

    initialize(attributes: any, options: any) {
        super.initialize(attributes, options);
        this.variable_mesh = new VariableMesh(
            this.get('px'),
            this.get('py'),
            this.get('pdx'),
            this.get('pdy'),
            this.get('val')
        );
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
        px: { serialize: serializeArray, deserialize: deserializeArray },
        pdx: { serialize: serializeArray, deserialize: deserializeArray },
        py: { serialize: serializeArray, deserialize: deserializeArray },
        pdy: { serialize: serializeArray, deserialize: deserializeArray },
        val: { serialize: serializeArray, deserialize: deserializeArray }
    }

    px: Float64Array;
    pdx: Float64Array;
    py: Float64Array;
    pdy: Float64Array;
    val: Float64Array;
    variable_mesh: VariableMesh;

    static model_name = "VariableMeshModel"
    static model_module = "@data-exp-lab/yt-widgets";
    static model_module_version = EXTENSION_VERSION;
}

interface FRBViewBounds {
  x_low: number,
  x_high: number,
  y_low: number,
  y_high: number
}

export class FRBModel extends DOMWidgetModel {

    defaults() {
        return {
            ...super.defaults(),
            _model_name: FRBModel.model_name,
            _model_module: FRBModel.model_module,
            _model_module_version: EXTENSION_VERSION,
            _view_module_version: EXTENSION_VERSION,
            image_data: null,
            width: 512,
            height: 512,
            view_center: [0.5, 0.5],
            view_width: [1.0, 1.0],
            frb: null,
            variable_mesh_model: null
        };
    }

    initialize(attributes: any, options: any) {
      super.initialize(attributes, options);
      this.on_some_change(['width', 'height'], this.sizeChanged, this);
    }

    sizeChanged() {
      this.width = this.get('width');
      this.height = this.get('height');
      this.data_buffer = new Float64Array(this.width * this.height);
    }
    
    calculateViewBounds(): FRBViewBounds {
        this.view_width = this.get('view_width');
        this.view_center = this.get('view_center');
        let hwidths: [number, number] = [
          this.view_width[0]/2, this.view_width[1]/2];
        let bounds = <FRBViewBounds>
           {x_low: this.view_center[0] - hwidths[0],
            x_high: this.view_center[0] + hwidths[0],
            y_low: this.view_center[1] - hwidths[1],
            y_high: this.view_center[1] + hwidths[1]};
        return bounds;
    }

    depositDataBuffer() {
      let bounds: FRBViewBounds = this.calculateViewBounds();
      this.frb = new FixedResolutionBuffer(
        this.width, this.height,
        bounds.x_low, bounds.x_high, bounds.y_low, bounds.y_high);
      this.frb.deposit(this.variable_mesh_model.variable_mesh,
        this.data_buffer)
    }

    frb: FixedResolutionBuffer;
    variable_mesh_model: VariableMeshModel;
    data_buffer: Float64Array;
    width: number;
    height: number;
    view_center: [number, number];
    view_width: [number, number];

    static model_name = "FRBModel"
    static model_module = "@data-exp-lab/yt-widgets";
    static model_module_version = EXTENSION_VERSION;
}

export class WidgytsCanvasModel extends DOMWidgetModel {
  defaults() {
    return {...super.defaults(),
            _model_name: WidgytsCanvasModel.model_name,
            _model_module: WidgytsCanvasModel.model_module,
            _model_module_version: EXTENSION_VERSION,
            _view_name: WidgytsCanvasModel.view_name,
            _view_module: WidgytsCanvasModel.view_module,
            _view_module_version: EXTENSION_VERSION,
            min_val: undefined,
            max_val: undefined,
            is_log: true,
            colormap_name: "viridis"
    }
  }

  min_val: number;
  max_val: number;
  is_log: boolean;
  colormap_name: string;

    static view_name = "WidgytsCanvasView"
    static view_module = "@data-exp-lab/yt-widgets";
    static model_name = "WidgytsCanvasModel"
    static model_module = "@data-exp-lab/yt-widgets";
    static model_module_version = EXTENSION_VERSION;
}

export class WidgytsCanvas extends CanvasView {
    render () {
        /* This is where we update stuff! */
        super.render();
    }
    frb_model: FRBModel;
    image_buffer: Uint8ClampedArray;
    variable_mesh_model: VariableMeshModel;
}