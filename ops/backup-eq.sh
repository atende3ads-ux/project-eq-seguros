#!/usr/bin/env bash
# Backup do banco (SQLite) e das imagens do site EQ Seguros.
#
#   backup-eq.sh              faz o backup, confere que dá para restaurar e apaga os antigos
#   backup-eq.sh --instalar   instala como tarefa diária (03:15) e roda o primeiro backup agora
#
# O banco é copiado com a API de backup do SQLite, que é consistente mesmo com o site no ar
# (copiar o arquivo no meio de uma gravação pode gerar uma cópia corrompida).
# Para testar fora do servidor: DATA_DIR=... MEDIA_DIR=... DEST=... backup-eq.sh
set -euo pipefail

DEST="${DEST:-/var/backups/eq-seguros}"
KEEP_DAYS="${KEEP_DAYS:-14}"        # backups diários guardados
KEEP_WEEKS="${KEEP_WEEKS:-8}"       # cópias de domingo guardadas
CONF=/etc/eq-backup.conf            # opcional: RCLONE_REMOTE=nome:pasta para copiar para fora do servidor

log() { printf '%s %s\n' "$(date '+%F %T')" "$*"; }
fail() { log "ERRO: $*" >&2; exit 1; }

if [[ "${1:-}" == "--instalar" ]]; then
  [[ $EUID -eq 0 ]] || fail "rode como root"
  command -v sqlite3 >/dev/null || { apt-get update -qq && apt-get install -y -qq sqlite3; }
  install -m 0755 "$0" /usr/local/bin/eq-backup
  cat > /etc/systemd/system/eq-backup.service <<'UNIT'
[Unit]
Description=Backup do banco e das imagens do site EQ Seguros
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/eq-backup
Nice=10
UNIT
  cat > /etc/systemd/system/eq-backup.timer <<'UNIT'
[Unit]
Description=Backup diário do site EQ Seguros

[Timer]
OnCalendar=*-*-* 03:15:00
RandomizedDelaySec=300
Persistent=true

[Install]
WantedBy=timers.target
UNIT
  systemctl daemon-reload
  systemctl enable --now eq-backup.timer >/dev/null
  log "tarefa diária instalada (03:15). Primeiro backup agora:"
  exec /usr/local/bin/eq-backup
fi

command -v sqlite3 >/dev/null || fail "sqlite3 não está instalado (apt-get install sqlite3)"

# Onde estão os dados: volumes do Coolify (nome termina em -eq-seguros-data / -eq-seguros-media) ou as pastas informadas.
volume_path() { docker volume ls -q | grep -E -- "-eq-seguros-$1\$" | head -1 | xargs -r docker volume inspect -f '{{.Mountpoint}}'; }
DATA_DIR="${DATA_DIR:-$(volume_path data)}"
MEDIA_DIR="${MEDIA_DIR:-$(volume_path media)}"
[[ -n "$DATA_DIR" && -f "$DATA_DIR/eq-seguros.db" ]] || fail "banco não encontrado (DATA_DIR='$DATA_DIR')"
[[ -n "$MEDIA_DIR" && -d "$MEDIA_DIR" ]] || fail "pasta de imagens não encontrada (MEDIA_DIR='$MEDIA_DIR')"

umask 077
mkdir -p "$DEST" && chmod 700 "$DEST"
mkdir -p "$DEST/diario" "$DEST/semanal"
stamp="$(date '+%Y-%m-%d_%H%M')"
work="$(mktemp -d "$DEST/.tmp.XXXXXX")"
trap 'rm -rf "$work"' EXIT

# 1. Banco: cópia consistente, conferida antes de ser guardada.
sqlite3 "$DATA_DIR/eq-seguros.db" ".backup '$work/eq-seguros.db'"
[[ "$(sqlite3 "$work/eq-seguros.db" 'PRAGMA integrity_check;')" == "ok" ]] || fail "a cópia do banco não passou na verificação de integridade"
pages="$(sqlite3 "$work/eq-seguros.db" 'SELECT count(*) FROM pages;')"
users="$(sqlite3 "$work/eq-seguros.db" 'SELECT count(*) FROM users;')"
gzip -9 -c "$work/eq-seguros.db" > "$DEST/diario/$stamp-banco.db.gz"

# 2. Imagens enviadas.
tar -czf "$DEST/diario/$stamp-imagens.tar.gz" -C "$MEDIA_DIR" .
gzip -t "$DEST/diario/$stamp-banco.db.gz" && tar -tzf "$DEST/diario/$stamp-imagens.tar.gz" >/dev/null || fail "arquivo de backup corrompido"

# 3. Domingo: guarda uma cópia semanal.
if [[ "$(date +%u)" == "7" ]]; then cp -p "$DEST/diario/$stamp-banco.db.gz" "$DEST/diario/$stamp-imagens.tar.gz" "$DEST/semanal/"; fi

# 4. Apaga o que passou do prazo.
find "$DEST/diario" -type f -mtime "+$KEEP_DAYS" -delete
find "$DEST/semanal" -type f -mtime "+$((KEEP_WEEKS * 7))" -delete

# 5. Cópia para fora do servidor, se configurada.
if [[ -r "$CONF" ]]; then
  # shellcheck disable=SC1090
  source "$CONF"
  if [[ -n "${RCLONE_REMOTE:-}" ]]; then
    command -v rclone >/dev/null || fail "RCLONE_REMOTE está definido, mas o rclone não está instalado"
    rclone copy "$DEST" "$RCLONE_REMOTE" --exclude '.tmp.*/**' && log "cópia externa enviada para $RCLONE_REMOTE"
  fi
fi

size="$(du -sh "$DEST" | cut -f1)"
log "backup ok: $stamp | banco com $pages páginas e $users usuário(s) | $(ls "$DEST/diario" | wc -l | tr -d ' ') arquivos em $DEST ($size)"
