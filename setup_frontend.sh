#!/bin/bash
set -e

echo "Setting up frontend directory..."
sudo mkdir -p /var/www/rebi
sudo tar -xzf ~/frontend.tar.gz -C /var/www/rebi
sudo chown -R www-data:www-data /var/www/rebi

echo "Configuring Nginx..."
cat << 'EOF' | sudo tee /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    root /var/www/rebi;
    index index.html index.htm;

    server_name _;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

echo "Restarting Nginx..."
sudo systemctl restart nginx
echo "Frontend setup complete!"
