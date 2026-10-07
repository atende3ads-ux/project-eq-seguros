#!/usr/bin/env bash
# Endurece a VPS Ubuntu do site EQ Seguros: firewall, fail2ban, atualizações automáticas e,
# opcionalmente, login SSH só por chave. Pode ser repetido sem problema.
#
#   endurecer-vps.sh --simular            mostra o que faria, sem mudar nada
#   endurecer-vps.sh                      firewall + fail2ban + atualizações automáticas
#   endurecer-vps.sh --travar-ssh         também desliga o login por senha (exige chave SSH já instalada)
#   opção extra: --admin-ip=1.2.3.4       IP que o fail2ban nunca bloqueia (repita a opção para vários)
#
# ATENÇÃO: o firewall do Ubuntu (ufw) NÃO controla portas publicadas pelo Docker. As portas do
# Coolify (8000, 6001, 6002) continuam abertas até serem fechadas pelo firewall do provedor
# (hPanel da Hostinger) ou por regras no DOCKER-USER, depois que o painel tiver domínio com HTTPS.
set -euo pipefail

DRY=0; LOCK_SSH=0; ADMIN_IPS=()
for arg in "$@"; do
  case "$arg" in
    --simular) DRY=1 ;;
    --travar-ssh) LOCK_SSH=1 ;;
    --admin-ip=*) ADMIN_IPS+=("${arg#*=}") ;;
    *) echo "opção desconhecida: $arg" >&2; exit 2 ;;
  esac
done

log() { printf '\n==> %s\n' "$*"; }
run() { if (( DRY )); then printf '    [simulação] %s\n' "$*"; else "$@"; fi; }
put() { # put <arquivo> : grava o conteúdo recebido na entrada padrão
  if (( DRY )); then printf '    [simulação] gravaria %s:\n' "$1"; sed 's/^/        | /'; else mkdir -p "$(dirname "$1")"; cat > "$1"; fi
}

if (( ! DRY )) && [[ $EUID -ne 0 ]]; then echo "rode como root (ou use --simular)" >&2; exit 1; fi
(( DRY )) && echo "MODO SIMULAÇÃO: nada será alterado."

# IP de quem está conectado agora: nunca entra na lista de bloqueio do fail2ban.
if [[ -n "${SSH_CLIENT:-}" ]]; then ADMIN_IPS+=("${SSH_CLIENT%% *}"); fi
SSH_PORT="$(sshd -T 2>/dev/null | awk '/^port /{print $2; exit}' || true)"; SSH_PORT="${SSH_PORT:-22}"

log "Pacotes"
run env DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ufw fail2ban unattended-upgrades sqlite3

log "Firewall (ufw): a regra do SSH entra ANTES de ligar, para não trancar o acesso"
run ufw default deny incoming
run ufw default allow outgoing
run ufw allow "$SSH_PORT/tcp" comment 'SSH'
run ufw allow 80/tcp comment 'HTTP (redireciona para HTTPS)'
run ufw allow 443/tcp comment 'HTTPS'
run ufw allow 443/udp comment 'HTTP/3'
run ufw --force enable

log "fail2ban: bloqueia por 1 hora quem erra a senha do SSH 5 vezes em 10 minutos (e dobra a cada reincidência)"
put /etc/fail2ban/jail.d/eq-sshd.local <<JAIL
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
bantime.increment = true
bantime.maxtime = 1w
# As faixas privadas são a rede interna do Docker: o Coolify administra o servidor entrando por SSH a partir dela.
ignoreip = 127.0.0.1/8 ::1 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16 ${ADMIN_IPS[*]:-}

[sshd]
enabled = true
backend = systemd
port = $SSH_PORT
JAIL
run systemctl enable --now fail2ban
run systemctl restart fail2ban

log "Atualizações de segurança automáticas"
put /etc/apt/apt.conf.d/20auto-upgrades <<'APT'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT

if (( LOCK_SSH )); then
  log "SSH só por chave"
  if [[ ! -s /root/.ssh/authorized_keys ]] || ! grep -q -E '^(ssh-|ecdsa-)' /root/.ssh/authorized_keys; then
    echo "ABORTADO: não há chave em /root/.ssh/authorized_keys. Instale a sua antes (ssh-copy-id) e teste o login por chave." >&2
    exit 1
  fi
  # O arquivo 00- é lido primeiro, e no sshd vale o primeiro valor encontrado (sobrepõe o 50-cloud-init.conf).
  put /etc/ssh/sshd_config.d/00-eq-hardening.conf <<'SSHD'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
MaxAuthTries 4
LoginGraceTime 30
X11Forwarding no
SSHD
  if (( ! DRY )); then
    sshd -t || { rm -f /etc/ssh/sshd_config.d/00-eq-hardening.conf; echo "configuração inválida, revertida" >&2; exit 1; }
  fi
  run systemctl reload ssh
  echo "    Mantenha ESTA sessão aberta e teste outra, em outro terminal, antes de sair."
else
  log "SSH: login por senha continua ligado (use --travar-ssh depois de instalar a sua chave)"
fi

if (( ! DRY )); then
  log "Situação final"
  ufw status verbose | sed 's/^/    /'
  echo "    fail2ban: $(fail2ban-client status sshd 2>/dev/null | tr '\n' ' ' | sed 's/  */ /g')"
  sshd -T 2>/dev/null | grep -E '^(passwordauthentication|permitrootlogin|pubkeyauthentication|port) ' | sed 's/^/    ssh: /'
  echo "    portas publicadas pelo Docker (o ufw NÃO controla estas): $(docker ps --format '{{.Ports}}' 2>/dev/null | grep -o '0.0.0.0:[0-9]*' | sort -u | tr '\n' ' ')"
fi
