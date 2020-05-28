import {
    Application, IPlugin
} from '@lumino/application';

import {
    Widget
} from '@lumino/widgets';

import {
    IJupyterWidgetRegistry
} from '@jupyter-widgets/base';

import * as widgetsExports from './widgyts';

import {
    MODULE_NAME,
    MODULE_VERSION
} from './version';

const EXTENSION_ID = 'widgyts:plugin';

const widgytsPlugin: IPlugin<Application<Widget>, void> = {
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry],
    activation: activateWidgetExtension,
    autoStart: true
} as unknown as IPlugin<Application<Widget>, void>;

export default widgytsPlugin;

function activateWidgetExtension(app: Application<Widget>, registry: IJupyterWidgetRegistry): void {
    registry.registerWidget({
        name: MODULE_NAME,
        version: MODULE_VERSION,
        exports: widgetsExports,
    });
}