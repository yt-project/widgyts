import { ISerializers, unpack_models } from '@jupyter-widgets/base';
import { CanvasModel } from 'ipycanvas';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { VariableMeshModel } from './VariableMeshModel';
import { FRBModel } from './FRBModel';
import { ColormapContainerModel } from './ColormapContainerModel';

export class WidgytsCanvasModel extends CanvasModel {
  defaults(): any {
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

  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);
    this.frb_model = this.get('frb_model');
    this.variable_mesh_model = this.get('variable_mesh_model');
    this.colormaps = this.get('colormaps');
  }

  static serializers: ISerializers = {
    ...CanvasModel.serializers,
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
