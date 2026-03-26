#!/usr/bin/env bash

set -euo pipefail

sudo yum update -y
sudo yum install -y git docker
sudo mkdir -p /usr/local/lib/docker/cli-plugins

COMPOSE_VERSION="$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | python3 -c "import json,sys; print(json.load(sys.stdin)['tag_name'])")"
BUILDX_VERSION="$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | python3 -c "import json,sys; print(json.load(sys.stdin)['tag_name'])")"

sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo curl -SL "https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64" -o /usr/local/lib/docker/cli-plugins/docker-buildx
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/lib/docker/cli-plugins/docker-buildx

sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user

echo "Docker, Docker Compose, and Docker Buildx are installed."
echo "Reconnect to the instance once if you want to run docker without sudo."
