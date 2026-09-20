import * as path from 'node:path';

export const workspaceAliases = {
  '@chordcraft/shared': path.join(__dirname, 'packages/shared/src'),
  '@chordcraft/context-chart': path.join(__dirname, 'packages/context-chart/src'),
};
