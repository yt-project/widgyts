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

export const IWidgytsDatasetManager = new Token<IWidgytsDatasetManager>(
  '@yt-project/yt-tools:WidgytsDataset'
);

// This is the "manager" object. What it does is collect each individual
// "dataset" that is registered with widgyts. It's not obvious to me yet if this
// is too many levels of hierarchy, but it is entirely reasonable that we may
// eventually want each dataset to be an individual yt Dataset, and then have
// multiple objects living underneath it.

export interface IWidgytsDatasetManager {
  add(manager: IWidgytsDatasetManager.IManager): IDisposable;
  items(): ReadonlyArray<IWidgytsDatasetManager.IManager>;
}

// This next part is code from @jupyterlab/extensions , and I think it does
// precisely what we need it to do.
export class WidgytsDatasetManager implements IWidgytsDatasetManager {
  /**
   * Add a running item manager.
   *
   * @param manager - The running item manager.
   *
   */
  add(manager: IWidgytsDatasetManager.IManager): IDisposable {
    this._managers.push(manager);
    return new DisposableDelegate(() => {
      const i = this._managers.indexOf(manager);

      if (i > -1) {
        this._managers.splice(i, 1);
      }
    });
  }

  /**
   * Return an iterator of launcher items.
   */
  items(): ReadonlyArray<IWidgytsDatasetManager.IManager> {
    return this._managers;
  }

  private _managers: IWidgytsDatasetManager.IManager[] = [];
}

export namespace IWidgytsDatasetManager {
  export interface IManager {
    name: string;
    available(): IWidgytsDataset[];
    refreshAvailable(): void;
  }

  export interface IWidgytsDataset {
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

function WidgytsDatasetComponent(props: {
  managers: IWidgytsDatasetManager;
  translator?: ITranslator;
}) {
  const translator = props.translator || nullTranslator;
  const trans = translator.load('jupyterlab');
  return (
    <>
      <div className={'yt-OpenDatasetsClass'}>
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
      // this is where we'll have to do a bunch more...
      {props.managers.items().map(manager => (
        <li>{manager.name}</li>
      ))}
    </>
  );
}

export class WidgytsDatasets extends ReactWidget {
  constructor(managers: IWidgytsDatasetManager, translator?: ITranslator) {
    super();
    this.managers = managers;
    this.translator = translator || nullTranslator;

    // we should add a class, probably?
  }
  protected render() {
    return (
      <WidgytsDatasetComponent
        managers={this.managers}
        translator={this.translator}
      />
    );
  }

  private managers: IWidgytsDatasetManager;
  protected translator: ITranslator;
}
