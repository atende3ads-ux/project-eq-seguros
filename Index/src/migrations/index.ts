import * as migration_20260917_172103_initial from './20260917_172103_initial';
import * as migration_20260929_184151_settings from './20260929_184151_settings';
import * as migration_20260929_190814_seo from './20260929_190814_seo';

export const migrations = [
  {
    up: migration_20260917_172103_initial.up,
    down: migration_20260917_172103_initial.down,
    name: '20260917_172103_initial',
  },
  {
    up: migration_20260929_184151_settings.up,
    down: migration_20260929_184151_settings.down,
    name: '20260929_184151_settings',
  },
  {
    up: migration_20260929_190814_seo.up,
    down: migration_20260929_190814_seo.down,
    name: '20260929_190814_seo'
  },
];
