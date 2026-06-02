# IF INTEL MAC USE /usr/local/bin/brew
eval "$(/opt/homebrew/bin/brew shellenv)"

export NVM_DIR="$HOME/.nvm"
# Resolve nvm default alias via file reads (fast, no nvm.sh sourcing)
() {
    local alias="default"
    local resolved
    while [[ -f "$NVM_DIR/alias/$alias" ]]; do
        resolved=$(< "$NVM_DIR/alias/$alias")
        [[ "$resolved" == "$alias" ]] && break
        alias="$resolved"
    done
    local bin="$NVM_DIR/versions/node/$alias/bin"
    [[ -d "$bin" ]] && export PATH="$bin:$PATH"
}
# Lazy-load NVM for version switching (nvm use, nvm install, etc.)
nvm() {
    unset -f nvm
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm "$@"
}
