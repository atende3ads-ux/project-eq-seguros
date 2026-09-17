import * as migration_20260917_172103_initial from './20260917_172103_initial';

export const migrations = [
  {
    up: migration_20260917_172103_initial.up,
    down: migration_20260917_172103_initial.down,
    name: '20260917_172103_initial'
  },
];
