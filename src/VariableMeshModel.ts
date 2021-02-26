import { DOMWidgetModel, ISerializers } from '@jupyter-widgets/base';
import { VariableMesh } from '@data-exp-lab/yt-tools';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { f64Serializer } from './utils';

const yt_tools = await import('@data-exp-lab/yt-tools');

/*
 * We have this as we can potentially have more than one FRB for a variable mesh
 *
 */

export class VariableMeshModel extends DOMWidgetModel {
  defaults(): any {
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

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);
    this.variable_mesh = new yt_tools.VariableMesh(
      this.get('px'),
      this.get('py'),
      this.get('pdx'),
      this.get('pdy'),
      this.get('val')
    );
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    px: f64Serializer,
    pdx: f64Serializer,
    py: f64Serializer,
    pdy: f64Serializer,
    val: f64Serializer
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
