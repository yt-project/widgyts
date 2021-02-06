import {
  DOMWidgetModel,
  ISerializers,
  WidgetModel,
  unpack_models
} from '@jupyter-widgets/base';
import { CanvasView, CanvasModel } from 'ipycanvas';
import type {
  FixedResolutionBuffer,
  ColormapCollection,
  VariableMesh
} from '@data-exp-lab/yt-tools';
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
export class VariableMeshModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
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
    _yt_tools.then(yt_tools => {
      this.variable_mesh = new yt_tools.VariableMesh(
        this.get('px'),
        this.get('py'),
        this.get('pdx'),
        this.get('pdy'),
        this.get('val')
      );
    });
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    px: { serialize: serializeArray, deserialize: deserializeArray },
    pdx: { serialize: serializeArray, deserialize: deserializeArray },
    py: { serialize: serializeArray, deserialize: deserializeArray },
    pdy: { serialize: serializeArray, deserialize: deserializeArray },
    val: { serialize: serializeArray, deserialize: deserializeArray }
  };

  px: Float64Array;
  pdx: Float64Array;
  py: Float64Array;
  pdy: Float64Array;
  val: Float64Array;
  variable_mesh: VariableMesh;

  static model_name = 'VariableMeshModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
}

interface FRBViewBounds {
  x_low: number;
  x_high: number;
  y_low: number;
  y_high: number;
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
    this.sizeChanged();
  }
  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    variable_mesh_model: { deserialize: unpack_models }
  };

  sizeChanged() {
    this.width = this.get('width');
    this.height = this.get('height');
    this.data_buffer = new Float64Array(this.width * this.height);
  }

  calculateViewBounds(): FRBViewBounds {
    this.view_width = this.get('view_width');
    this.view_center = this.get('view_center');
    const hwidths: [number, number] = [
      this.view_width[0] / 2,
      this.view_width[1] / 2
    ];
    const bounds = <FRBViewBounds>{
      x_low: this.view_center[0] - hwidths[0],
      x_high: this.view_center[0] + hwidths[0],
      y_low: this.view_center[1] - hwidths[1],
      y_high: this.view_center[1] + hwidths[1]
    };
    return bounds;
  }

  async depositDataBuffer(variable_mesh_model: VariableMeshModel) {
    const bounds: FRBViewBounds = this.calculateViewBounds();
    const yt_tools = await _yt_tools;
    this.frb = new yt_tools.FixedResolutionBuffer(
      this.width,
      this.height,
      bounds.x_low,
      bounds.x_high,
      bounds.y_low,
      bounds.y_high
    );
    this.frb.deposit(variable_mesh_model.variable_mesh, this.data_buffer);
    return this.data_buffer;
  }

  frb: FixedResolutionBuffer;
  variable_mesh_model: VariableMeshModel;
  data_buffer: Float64Array;
  width: number;
  height: number;
  view_center: [number, number];
  view_width: [number, number];

  static model_name = 'FRBModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
}

export class WidgytsCanvasModel extends CanvasModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: WidgytsCanvasModel.model_name,
      _model_module: WidgytsCanvasModel.model_module,
      _model_module_version: WidgytsCanvasModel.model_module_version,
      _view_name: WidgytsCanvasModel.view_name,
      _view_module: WidgytsCanvasModel.view_module,
      _view_module_version: WidgytsCanvasModel.view_module_version,
      min_val: undefined,
      max_val: undefined,
      is_log: true,
      colormap_name: 'viridis',
      colormaps: null,
      frb_model: null,
      variable_mesh_model: null,
      image_bitmap: undefined,
      image_data: undefined,
      _dirty_frb: false,
      _dirty_bitmap: false
    };
  }

  initialize(attributes: any, options: any) {
    super.initialize(attributes, options);
    this.frb_model = this.get('frb_model');
    this.variable_mesh_model = this.get('variable_mesh_model');
    this.colormaps = this.get('colormaps');
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    frb_model: { deserialize: unpack_models },
    variable_mesh_model: { deserialize: unpack_models },
    colormaps: { deserialize: unpack_models }
  };

  min_val: number;
  max_val: number;
  is_log: boolean;
  colormap_name: string;
  frb_model: FRBModel;
  variable_mesh_model: VariableMeshModel;
  colormaps: ColormapContainerModel;
  _dirty_frb: boolean;
  _dirty_bitmap: boolean;

  static view_name = 'WidgytsCanvasView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
  static model_name = 'WidgytsCanvasModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
}

export class WidgytsCanvasView extends CanvasView {
  render() {
    /* This is where we update stuff!
     * Render in the base class will set up the ctx, but also calls
     * updateCanvas, so we need to check before calling anything in there.
     */
    this.drag = false;
    this.locked = true;
    super.render();
    this.initializeArrays().then(() => {
      this.setupEventListeners();
      this.locked = false;
      this.updateCanvas();
    });
  }
  image_buffer: Uint8ClampedArray;
  image_data: ImageData;
  image_bitmap: ImageBitmap;
  model: WidgytsCanvasModel;
  locked: boolean;
  drag: boolean;
  dragStart: [number, number];
  dragStartCenter: [number, number];
  frbWidth: [number, number];

  setupEventListeners() {
    this.model.frb_model.on_some_change(
      ['width', 'height'],
      this.resizeFromFRB,
      this
    );
    this.model.frb_model.on_some_change(
      ['view_center', 'view_width'],
      this.dirtyFRB,
      this
    );
    this.model.on_some_change(
      ['_dirty_frb', '_dirty_bitmap'],
      this.updateBitmap,
      this
    );
    this.model.on_some_change(
      ['min_val', 'max_val', 'colormap_name', 'is_log'],
      this.dirtyBitmap,
      this
    );
    this.canvas.addEventListener('wheel', this.conductZoom.bind(this));
    this.canvas.addEventListener('mousedown', this.startDrag.bind(this));
    this.canvas.addEventListener('mousemove', this.conductDrag.bind(this));
    window.addEventListener('mouseup', this.endDrag.bind(this));
  }

  conductZoom(event: WheelEvent) {
    event.preventDefault();
    const view_width: [number, number] = this.model.frb_model.get('view_width');
    let n_units = 0;
    if (event.deltaMode == event.DOM_DELTA_PIXEL) {
      // let's say we have 10 units per image
      n_units = event.deltaY / (this.frbWidth[1] / 10);
    } else if (event.deltaMode == event.DOM_DELTA_LINE) {
      // two lines per unit let's say
      n_units = event.deltaY / 2;
    } else if (event.deltaMode == event.DOM_DELTA_PAGE) {
      // yeah i don't know
      return;
    }
    const zoomFactor: number = 1.1 ** n_units;
    const new_view_width: [number, number] = [
      view_width[0] * zoomFactor,
      view_width[1] * zoomFactor
    ];
    this.model.frb_model.set('view_width', new_view_width);
    this.model.frb_model.save_changes();
  }

  startDrag(event: MouseEvent) {
    this.drag = true;
    this.dragStart = [event.offsetX, event.offsetY];
    this.dragStartCenter = this.model.frb_model.get('view_center');
  }

  conductDrag(event: MouseEvent) {
    if (!this.drag) {
      return;
    }
    const shiftValue: [number, number] = [
      event.offsetX - this.dragStart[0],
      event.offsetY - this.dragStart[1]
    ];
    // Now we shift the actual center
    const view_width: [number, number] = this.model.frb_model.get('view_width');
    const dx = view_width[0] / this.frbWidth[0]; // note these are FRB dims, which are *pixel* dims, not display dims
    const dy = (view_width[1] / this.frbWidth[1]) * -1; // origin is upper left, so flip dy
    const new_view_center: [number, number] = [
      this.dragStartCenter[0] - dx * shiftValue[0],
      this.dragStartCenter[1] - dy * shiftValue[1]
    ];
    this.model.frb_model.set('view_center', new_view_center);
  }

  endDrag(event: MouseEvent) {
    if (!this.drag) {
      return;
    }
    this.drag = false;
    this.model.frb_model.save_changes();
  }

  dirtyBitmap() {
    this.model.set('_dirty_bitmap', true);
  }

  dirtyFRB() {
    this.model.set('_dirty_frb', true);
  }

  async initializeArrays() {
    this.regenerateBuffer(); // This will stick stuff into the FRB's data buffer
    this.resizeFromFRB(); // This will create image_buffer and image_data
    await this.createBitmap(); // This creates a bitmap array and normalizes
  }

  updateCanvas() {
    /*
     * We don't call super.updateCanvas here, and we just re-do what it does.
     * This means we'll have to update it when the base class changes, but it
     * also means greater control.
     */
    this.clear();
    if (this.image_bitmap !== undefined) {
      //console.log("Drawing this.image_bitmap");
      this.ctx.drawImage(this.image_bitmap, 0, 0);
    }
    if (this.model.canvas !== undefined) {
      //console.log("Drawing this.model.canvas");
      this.ctx.drawImage(this.model.canvas, 0, 0);
    }
  }

  async updateBitmap() {
    if (this.locked) {
      return;
    }
    //console.log("Locking.");
    this.locked = true;
    //console.log("Update bitmap");
    if (this.model.get('_dirty_frb')) {
      //console.log("frb is dirty; regenerating");
      this.regenerateBuffer();
    }
    if (this.model.get('_dirty_bitmap')) {
      //console.log("bitmap is dirty; regenerating");
      await this.createBitmap();
      this.updateCanvas();
    }
    //console.log("Unlocking.");
    this.locked = false;
  }

  resizeFromFRB() {
    //console.log("resizeFromFRB");
    if (this.model.frb_model !== null && this.ctx !== null) {
      //console.log("frb initialized; creating new clamped array and image");
      const width = this.model.frb_model.get('width');
      const height = this.model.frb_model.get('height');
      this.frbWidth = [width, height];
      const npix = width * height;
      // Times four so that we have one for *each* channel :)
      this.image_buffer = new Uint8ClampedArray(npix * 4);
      this.image_data = this.ctx.createImageData(width, height);
    }
  }

  regenerateBuffer() {
    //console.log("regenerateBuffer");
    this.model.frb_model.depositDataBuffer(this.model.variable_mesh_model);
    this.model.set('_dirty_frb', false);
    this.model.set('_dirty_bitmap', true);
  }

  async createBitmap() {
    /*
     * This needs to make sure our deposition is up to date,
     * normalize it, and then re-set our image data
     */
    /* Need to normalize here somehow */
    //console.log("Creating bitmap.");
    await this.model.colormaps.normalize(
      this.model.get('colormap_name'),
      this.model.frb_model.data_buffer,
      this.image_buffer,
      this.model.get('min_val'),
      this.model.get('max_val'),
      this.model.get('is_log')
    );
    this.image_data.data.set(this.image_buffer);
    const nx = this.model.frb_model.get('width');
    const ny = this.model.frb_model.get('height');
    /* This has to be called every time image_data changes */
    this.image_bitmap = await createImageBitmap(this.image_data, 0, 0, nx, ny);
    this.model.set('_dirty_bitmap', false);
    //console.log("Setting bitmap to undirty.");
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
      _model_module_version: ColormapContainerModel.model_module_version
    };
  }

  initialize(attributes: any, options: any) {
    super.initialize(attributes, options);
    this.colormap_values = this.get('colormap_values');
  }

  async normalize(
    colormap_name: string,
    data_array: Float64Array,
    output_array: Uint8ClampedArray,
    min_val: number,
    max_val: number,
    take_log: boolean
  ) {
    if (!this._initialized) {
      await this.setupColormaps();
    }
    const unclamped: Uint8Array = new Uint8Array(output_array.buffer);
    this.colormaps.normalize(
      colormap_name,
      data_array,
      unclamped,
      min_val,
      max_val,
      take_log
    );
  }

  private async setupColormaps() {
    if (this._initialized) {
      return;
    }
    const yt_tools = await _yt_tools;
    this.colormaps = new yt_tools.ColormapCollection();
    for (const [name, values] of Object.entries(this.colormap_values)) {
      const arr_values: Uint8Array = Uint8Array.from(values);
      this.colormaps.add_colormap(name, arr_values);
    }
    this._initialized = true;
  }

  colormap_values: Object;
  colormaps: ColormapCollection;
  _initialized: boolean;
  static model_name = 'ColormapContainerModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
}
