import { JupyterFrontEndPlugin, JupyterFrontEnd } from '@jupyterlab/application';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as widgytsExports from './widgyts';

import { MODULE_NAME, MODULE_VERSION } from './version';
const EXTENSION_ID = MODULE_NAME + ':plugin';
console.log('widgyts version ' + MODULE_VERSION);
console.log('widgyts module  ' + MODULE_NAME);

const widgytsPlugin: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry],
  activate: (app: JupyterFrontEnd, registry: IJupyterWidgetRegistry): void => {
    registry.registerWidget({
      name: MODULE_NAME,
      version: MODULE_VERSION,
      exports: widgytsExports
    });
  },
  autoStart: true
};

export default widgytsPlugin;
