import {
  JupyterFrontEndPlugin,
  JupyterFrontEnd,
  ILayoutRestorer,
  ILabShell
} from '@jupyterlab/application';

import { ITranslator } from '@jupyterlab/translation';

import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import {
  ColormapContainerModel,
  FRBModel,
  VariableMeshModel,
  WidgytsCanvasModel,
  WidgytsCanvasView,
  IYTDatasetsManager,
  YTDatasetsManager,
  YTDatasets
} from './widgyts';

import { ytIcon } from './icon';

import { MODULE_NAME, MODULE_VERSION } from './version';
const EXTENSION_ID = MODULE_NAME + ':plugin';

const widgytsPlugin: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry, ITranslator],
  optional: [ILayoutRestorer, ILabShell],
  provides: IYTDatasetsManager,
  activate: (
    app: JupyterFrontEnd,
    registry: IJupyterWidgetRegistry,
    translator: ITranslator,
    restorer: ILayoutRestorer | null,
    labShell: ILabShell | null
  ): void => {
    registry.registerWidget({
      name: MODULE_NAME,
      version: MODULE_VERSION,
      exports: {
        ColormapContainerModel,
        FRBModel,
        VariableMeshModel,
        WidgytsCanvasModel,
        WidgytsCanvasView
      }
    });
    const trans = translator.load('jupyterlab');
    const ytDatasetsManager = new YTDatasetsManager();
    const ytDatasets = new YTDatasets(ytDatasetsManager, translator);
    ytDatasets.id = 'yt-open-datasets';
    ytDatasets.title.caption = trans.__('Open Datasets');
    ytDatasets.title.icon = ytIcon;
    if (restorer) {
      restorer.add(ytDatasets, 'open-yt-datasets');
    }
    if (labShell) {
      console.log('labshell exists');
    }
    const m = ytDatasetsManager.obtainNewManager('Test Manager');
    ytDatasetsManager.add(m);
    app.shell.add(ytDatasets, 'left', { rank: 300 });
  },
  autoStart: true
};

export default widgytsPlugin;
