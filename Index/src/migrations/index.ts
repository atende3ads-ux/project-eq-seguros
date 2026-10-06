import * as migration_20260917_172103_initial from './20260917_172103_initial';
import * as migration_20260929_184151_settings from './20260929_184151_settings';
import * as migration_20260929_190814_seo from './20260929_190814_seo';
import * as migration_20260929_194554_blog from './20260929_194554_blog';
import * as migration_20261006_222019_users_reset_password_requested_at from './20261006_222019_users_reset_password_requested_at';
import * as migration_20261006_230000_rodape_link_3ads from './20261006_230000_rodape_link_3ads';

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
    name: '20260929_190814_seo',
  },
  {
    up: migration_20260929_194554_blog.up,
    down: migration_20260929_194554_blog.down,
    name: '20260929_194554_blog',
  },
  {
    up: migration_20261006_222019_users_reset_password_requested_at.up,
    down: migration_20261006_222019_users_reset_password_requested_at.down,
    name: '20261006_222019_users_reset_password_requested_at'
  },
  {
    up: migration_20261006_230000_rodape_link_3ads.up,
    down: migration_20261006_230000_rodape_link_3ads.down,
    name: '20261006_230000_rodape_link_3ads'
  },
];
