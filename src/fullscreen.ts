import { MODULE_NAME, MODULE_VERSION } from './version';

import { RenderableModel } from 'jupyter-threejs';

import * as fscreen from 'fscreen';
import {
  ISerializers,
  unpack_models,
  DOMWidgetModel,
  DOMWidgetView
} from '@jupyter-widgets/base';

export class FullscreenButtonModel extends DOMWidgetModel {
  defaults(): any {
    return {
      ...super.defaults(),
      ...{
        _model_name: FullscreenButtonModel.model_name,
        _model_module: FullscreenButtonModel.model_module,
        _model_module_version: FullscreenButtonModel.model_module_version,
        _view_name: FullscreenButtonModel.view_name,
        _view_module: FullscreenButtonModel.view_module,
        _view_module_version: FullscreenButtonModel.view_module_version,
        renderer: undefined,
        disabled: false
      }
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    renderer: { deserialize: unpack_models }
  };
  renderer: RenderableModel;
  disabled: boolean;
  static view_name = 'FullscreenButtonView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;
  static model_name = 'FullscreenButtonModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
}

export class FullscreenButtonView extends DOMWidgetView {
  /**
   * Called when view is rendered.
   */
  render(): void {
    super.render();
    this.el.classList.add('jupyter-widgets');
    this.el.classList.add('jupyter-button');
    this.el.classList.add('widget-button');
    this.update(); // Set defaults.
  }

  /**
   * Update the contents of this view
   *
   * Called when the model is changed. The model may have been
   * changed by another view or by a state update from the back-end.
   */
  update(): void {
    this.el.disabled = this.model.get('disabled');
    this.el.setAttribute('title', this.model.get('tooltip'));

    const description = '';
    const icon = 'icon-fullscreen';
    if (description.length || icon.length) {
      this.el.textContent = '';
      if (icon.length) {
        const i = document.createElement('i');
        i.classList.add('fa');
        i.classList.add(
          ...icon
            .split(/[\s]+/)
            .filter(Boolean)
            .map((v: string) => `fa-${v}`)
        );
        if (description.length === 0) {
          i.classList.add('center');
        }
        this.el.appendChild(i);
      }
      this.el.appendChild(document.createTextNode(description));
    }
    return super.update();
  }

  /**
   * Dictionary of events and handlers
   */
  events(): { [e: string]: string } {
    // TODO: return typing not needed in Typescript later than 1.8.x
    // See http://stackoverflow.com/questions/22077023/why-cant-i-indirectly-return-an-object-literal-to-satisfy-an-index-signature-re and https://github.com/Microsoft/TypeScript/pull/7029
    return { click: '_handle_click' };
  }

  /**
   * Handles when the button is clicked.
   */
  _handle_click(event: MouseEvent): void {
    const renderer: RenderableModel = this.model.get('renderer');
    renderer._findView().then(view => {
      if (view === undefined) {
        return;
      }
      if (fscreen.default.fullscreenEnabled) {
        // We do our fullscreening here
        fscreen.default.requestFullscreen(view.el);
        this.oldRendererWidth = renderer.get('_width');
        this.oldRendererHeight = renderer.get('_height');
        renderer.set('_width', screen.width);
        renderer.set('_height', screen.height);
        renderer.save();
      } else {
        // un-fullscreen it
        fscreen.default.exitFullscreen();
        renderer.set('_width', this.oldRendererWidth);
        renderer.set('_height', this.oldRendererHeight);
        renderer.save();
      }
    });
  }

  oldRendererWidth: number;
  oldRendererHeight: number;

  /**
   * The default tag name.
   *
   * #### Notes
   * This is a read-only attribute.
   */
  el: HTMLButtonElement;
}
