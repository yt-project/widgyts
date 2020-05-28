import { DOMWidgetModel, ISerializers, WidgetModel } from '@jupyter-widgets/base';
import { CanvasView } from 'ipycanvas';
import type { FixedResolutionBuffer, ColormapCollection, VariableMesh } from '@data-exp-lab/yt-tools';
import { MODULE_NAME, MODULE_VERSION } from './version';
const _yt_tools = import('@data-exp-lab/yt-tools');

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
            _model_module_version: VariableMeshModel.model_module_version,
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
        _yt_tools.then( yt_tools => {
          this.variable_mesh = new yt_tools.VariableMesh(
              this.get('px'),
              this.get('py'),
              this.get('pdx'),
              this.get('pdy'),
              this.get('val')
        );})
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

    static model_name = "VariableMeshModel";
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
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
            _model_module_version: FRBModel.model_module_version,
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

    async depositDataBuffer() {
      let bounds: FRBViewBounds = this.calculateViewBounds();
      let yt_tools = await _yt_tools;
      this.frb = new yt_tools.FixedResolutionBuffer(
        this.width, this.height,
        bounds.x_low, bounds.x_high, bounds.y_low, bounds.y_high);
      this.frb.deposit(this.variable_mesh_model.variable_mesh,
        this.data_buffer);
        return this.data_buffer;
    }

    frb: FixedResolutionBuffer;
    variable_mesh_model: VariableMeshModel;
    data_buffer: Float64Array;
    width: number;
    height: number;
    view_center: [number, number];
    view_width: [number, number];

    static model_name = "FRBModel"
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
}

export class WidgytsCanvasModel extends DOMWidgetModel {
  defaults() {
    return {...super.defaults(),
            _model_name: WidgytsCanvasModel.model_name,
            _model_module: WidgytsCanvasModel.model_module,
            _model_module_version: WidgytsCanvasModel.model_module_version,
            _view_name: WidgytsCanvasModel.view_name,
            _view_module: WidgytsCanvasModel.view_module,
            _view_module_version: WidgytsCanvasModel.view_module_version,
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

    static view_name = "WidgytsCanvasView";
    static view_module = MODULE_NAME;
    static view_module_version = MODULE_VERSION;
    static model_name = "WidgytsCanvasModel";
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
}

export class WidgytsCanvas extends CanvasView {
    render () {
        /* This is where we update stuff! */
      super.render();
      this.frb_model.on_some_change(['width', 'height'],
        this.resizeFromFRB, this);
      this.frb_model.on_some_change(['view_center', 'view_width'],
        this.redrawBitmap, this);
        
    }
    frb_model: FRBModel;
    image_buffer: Uint8ClampedArray;
    image_data: ImageData;
    image_bitmap: ImageBitmap;
    variable_mesh_model: VariableMeshModel;

    updateCanvas() {
      /* 
       * We don't call super.updateCanvas here, and we just re-do what it does
       */
      this.clear()
      this.ctx.drawImage(this.image_bitmap, 0, 0);
      this.ctx.drawImage(this.model.canvas, 0, 0);
    }

    resizeFromFRB() {
      // this.model.set('width', this.frb_model.get('width'));
      //this.model.set('width', this.frb_model.get('width'));
      let width =  this.frb_model.get('width');
      let height = this.frb_model.get('height');
      let npix = width * height;
      this.image_buffer = new Uint8ClampedArray(npix);
      this.image_data = this.ctx.createImageData(width, height)
    }
    
    regenerateBuffer() {
      this.frb_model.depositDataBuffer();
    }

    async redrawBitmap() {
    /* 
     * This needs to make sure our deposition is up to date,
     * normalize it, and then re-set our image data
    */
      /* Need to normalize here somehow */
      let nx = this.frb_model.get('width');
      let ny = this.frb_model.get('height');
      this.image_bitmap = await createImageBitmap(this.image_data, 0, 0, nx, ny);
    }
}

export class ColormapContainerModel extends WidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      colormap_values: {},
      _initialized: false,
      _model_name: ColormapContainerModel.model_name,
      _model_module: ColormapContainerModel.model_module,
      _model_module_version: ColormapContainerModel.model_module_version,
    }
  }

  async normalize(colormap_name: string, data_array: Float64Array,
    output_array: Uint8ClampedArray, min_val: number, max_val: number,
    take_log: boolean) {
      if (!this._initialized) {
        await this.setupColormaps();
      }
    let unclamped: Uint8Array = new Uint8Array(output_array.buffer);
    this.colormaps.normalize(colormap_name, data_array,
      unclamped, min_val, max_val, take_log);
  }

  private async setupColormaps() {
    if (this._initialized) return;
    let yt_tools = await _yt_tools;
    this.colormaps = new yt_tools.ColormapCollection();
    for (let [name, values] of this.colormap_values) {
      let arr_values: Uint8Array = Uint8Array.from(values);
      this.colormaps.add_colormap(name, arr_values);
    }
  }

  colormap_values: Map<string, Array<number>>;
  colormaps: ColormapCollection;
  _initialized: boolean;
  static model_name = "ColormapContainerModel";
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
}