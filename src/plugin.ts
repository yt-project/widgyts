import {
    Application, IPlugin
} from '@lumino/application';

import {
    Widget
} from '@lumino/widgets';

import {
    IJupyterWidgetRegistry
} from '@jupyter-widgets/base';

import * as widgytsExports from './widgyts';

import {
    MODULE_NAME,
    MODULE_VERSION
} from './version';
const EXTENSION_ID = MODULE_NAME + ":plugin";
console.log("widgyts version " + MODULE_VERSION);
console.log("widgyts module  " + MODULE_NAME);

const widgytsPlugin: IPlugin<Application<Widget>, void> = {
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry],
    activate: activateWidgetExtension,
    autoStart: true
} as unknown as IPlugin<Application<Widget>, void>;

export default widgytsPlugin;

function activateWidgetExtension(app: Application<Widget>, registry: IJupyterWidgetRegistry): void {
    registry.registerWidget({
        name: MODULE_NAME,
        version: MODULE_VERSION,
        exports: widgytsExports,
    });
}