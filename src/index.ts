import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { requestAPI } from './widgyts';

/**
 * Initialization data for the widgyts extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'widgyts',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension widgyts is activated!');

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The widgyts server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default extension;
