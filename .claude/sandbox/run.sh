#!/bin/zsh
exec sandbox-exec -f "$(dirname "$0")/protect-eslint.sb" /bin/zsh -c "$*"
