#!/bin/bash
# Download bb CLI at Vercel build time
BB_VERSION="v0.87.0"
BB_PATH="./bin/bb"

if [ ! -f "$BB_PATH" ]; then
  mkdir -p ./bin
  curl -L "https://github.com/AztecProtocol/aztec-packages/releases/download/${BB_VERSION}/barretenberg-amd64-linux.tar.gz" \
    -o /tmp/bb.tar.gz
  tar -xzf /tmp/bb.tar.gz -C ./bin
  chmod +x ./bin/bb
fi
echo "bb ready: $(./bin/bb --version)"
