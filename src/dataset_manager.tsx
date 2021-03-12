// This is an attempt to implement a manager for datasets and variable meshes and the like.
// Much of it is based on what I was able to learn from @jupyterlab/running and
// @jupyterlab/running-extension.

import { Token } from '@lumino/coreutils';

// Let's try doing this with React, shall we?
import * as React from 'react';

// We create a token for all the different types of datasets we want to make
// available, and then we allow each one to provide that token.

export const IWidgytsDataset = new Token<IWidgytsDataset>(
  '@yt-project/yt-tools:WidgytsDataset'
);

export interface IWidgytsDataset {
  items(): ReadonlyArray<unknown>;
}
