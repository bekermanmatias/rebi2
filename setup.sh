#!/bin/bash
set -e

echo "Updating packages..."
sudo apt-get update

echo "Installing Node.js 22 and Nginx..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

echo "Installing PM2..."
sudo npm install -g pm2

echo "Setting up backend..."
mkdir -p ~/rebi-backend
tar -xzf ~/backend.tar.gz -C ~/rebi-backend

cd ~/rebi-backend
npm install --omit=dev

# Update .env to reflect the correct FRONTEND_URL and API base url
VM_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip)
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$VM_IP|g" .env
sed -i "s|PUBLIC_API_BASE_URL=.*|PUBLIC_API_BASE_URL=http://$VM_IP:4000|g" .env

echo "Starting backend with PM2..."
pm2 start dist/server.js --name rebi-backend
pm2 save
sudo pm2 startup systemd -u $USER --hp $HOME | sudo bash

echo "Backend setup complete."
