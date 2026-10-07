#!/usr/bin/env bash
set -euo pipefail
exec ssh -N -T -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
  -L 127.0.0.1:8765:127.0.0.1:8765 \
  -L 127.0.0.1:8768:127.0.0.1:8768 \
  -L 127.0.0.1:8767:127.0.0.1:8767 "${CAFE_SSH_HOST:-gpu-host}"
