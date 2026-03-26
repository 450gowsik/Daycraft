#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/daycraft}"

cd "$APP_DIR"

if [[ ! -f "backend/.env.production" ]]; then
    echo "Missing backend/.env.production"
    exit 1
fi

sudo docker compose -f docker-compose.ec2.yml up -d --build
sudo docker compose -f docker-compose.ec2.yml ps
