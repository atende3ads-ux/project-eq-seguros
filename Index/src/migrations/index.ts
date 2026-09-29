import * as migration_20260917_172103_initial from './20260917_172103_initial';
import * as migration_20260929_184151_settings from './20260929_184151_settings';

export const migrations = [
  {
    up: migration_20260917_172103_initial.up,
    down: migration_20260917_172103_initial.down,
    name: '20260917_172103_initial',
  },
  {
    up: migration_20260929_184151_settings.up,
    down: migration_20260929_184151_settings.down,
    name: '20260929_184151_settings'
  },
];
