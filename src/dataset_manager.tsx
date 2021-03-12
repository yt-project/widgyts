// This is an attempt to implement a manager for datasets and variable meshes and the like.
// Much of it is based on what I was able to learn from @jupyterlab/running and
// @jupyterlab/running-extension.

import { Token } from '@lumino/coreutils';

import { IDisposable, DisposableDelegate } from '@lumino/disposable';

// Let's try doing this with React, shall we?
import * as React from 'react';

import { ReactWidget, ToolbarButtonComponent } from '@jupyterlab/apputils';

import { nullTranslator, ITranslator } from '@jupyterlab/translation';

import { refreshIcon } from '@jupyterlab/ui-components';

// We create a token for all the different types of datasets we want to make
// available, and then we allow each one to provide that token.

export const IYTDatasetsManager = new Token<IYTDatasetsManager>(
  '@yt-project/yt-tools:YTDatasetsManager'
);

// This is the "manager" object. What it does is collect each individual
// "dataset" that is registered with widgyts. It's not obvious to me yet if this
// is too many levels of hierarchy, but it is entirely reasonable that we may
// eventually want each dataset to be an individual yt Dataset, and then have
// multiple objects living underneath it.
//
// It's worth noting that this will show up with one for each running kernel.
// That helps us get around the fact that we'll need to load them from there!
// We also probably want one for the pure Jupyterlab session, or maybe for the
// server instance itself.

export interface IYTDatasetsManager {
  add(manager: IYTDatasetsManager.IManager): IDisposable;
  items(): ReadonlyArray<IYTDatasetsManager.IManager>;
}

// This next part is code from @jupyterlab/extensions , and I think it does
// precisely what we need it to do.
export class YTDatasetsManager implements IYTDatasetsManager {
  /**
   * Add a running item manager.
   *
   * @param manager - The running item manager.
   *
   */
  add(manager: IYTDatasetsManager.IManager): IDisposable {
    this._managers.push(manager);
    return new DisposableDelegate(() => {
      const i = this._managers.indexOf(manager);

      if (i > -1) {
        this._managers.splice(i, 1);
      }
    });
  }

  obtainNewManager(name: string): IYTDatasetsManager.IManager {
    return {
      name: name,
      refreshAvailable: () => null,
      available(): IYTDatasetsManager.IYTDataset[] {
        return [
          {
            open: () => null,
            close: () => null,
            label: () => null
          }
        ];
      }
    };
  }

  /**
   * Return an iterator of launcher items.
   */
  items(): ReadonlyArray<IYTDatasetsManager.IManager> {
    return this._managers;
  }

  private _managers: IYTDatasetsManager.IManager[] = [];
}

export namespace IYTDatasetsManager {
  export interface IManager {
    name: string;
    available(): IYTDataset[];
    refreshAvailable(): void;
  }

  export interface IYTDataset {
    // called when the item is clicked
    open: () => void;
    // when the dataset has been closed (no shutdown)
    close: () => void;
    // called to determine the label for each item
    label: () => string;
    // called to determine the `title` attribute for each item, which is revealed on hover
    labelTitle?: () => string;
    // called to determine the `detail` attribute which is shown optionally
    // in a column after the label
    detail?: () => string;
  }
}

function YTDatasetComponent(props: {
  managers: IYTDatasetsManager;
  translator?: ITranslator;
}) {
  const translator = props.translator || nullTranslator;
  const trans = translator.load('jupyterlab');
  return (
    <>
      <div className={'jp-RunningSessions-header'}>
        <ToolbarButtonComponent
          tooltip={trans.__('Refresh List')}
          icon={refreshIcon}
          onClick={() =>
            props.managers
              .items()
              .forEach(manager => manager.refreshAvailable())
          }
        />
      </div>
      {props.managers.items().map(manager => (
        // this is where we'll have to do a bunch more...
        <li>{manager.name}</li>
      ))}
    </>
  );
}

export class YTDatasets extends ReactWidget {
  constructor(managers: IYTDatasetsManager, translator?: ITranslator) {
    super();
    this.managers = managers;
    this.translator = translator || nullTranslator;

    // we should add a class, probably?
    this.addClass('jp-RunningSessions');
  }
  protected render() {
    return (
      <YTDatasetComponent
        managers={this.managers}
        translator={this.translator}
      />
    );
  }

  private managers: IYTDatasetsManager;
  protected translator: ITranslator;
}
