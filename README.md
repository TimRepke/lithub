# Literature Hub

## Server deployment
### Frontend
Edit `/var/www/lithub/literature-hub/frontend/.env.production`
```dotenv
VITE_LITHUB_API_URL=/lithub/api
VITE_LITHUB_DATA_URL=/lithub/data
VITE_LITHUB_BASE=/lithub/
```

Build
```bash
cd /var/www/lithub/literature-hub/
git pull origin main
cd frontend/
rm -r node_modules
npm install
source .env.production
npm run build-only
```

Note: Make sure you have node==v21.7.1 (or higher) and npm==v.10.5.0 (or higher).
If necessary, adjust via [nvm](https://github.com/nvm-sh/nvm).

### Backend
Edit `/var/www/lithub/literature-hub/.config/.server.env`
```dotenv
HOST="127.0.0.1"
PORT=9080
LOG_CONF_FILE="../.config/logging.toml"
HEADER_CORS=true
CORS_ORIGINS='["https://apsis.mcc-berlin.net"]'
HEADER_TRUSTED_HOST=false

STATIC_FILES="../frontend/dist"
DATASETS_FOLDER="../.data/"
```

Edit `/var/www/lithub/literature-hub/.config/.server.toml`
```toml
bind = '127.0.0.1:9080'
debug = false
access_log_format = '%(s)s | "%(R)s" |  Size: %(b)s | Referrer: "%(f)s"'
workers = 1
accesslog = '../.logs/hypercorn.access'
errorlog = '../.logs/hypercorn.error'
logconfig = 'toml:../.config/logging.toml'
```

Set up environment
```bash
cd /var/www/lithub/literature-hub/backend
git pull origin main
rm -rf venv
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### systemd
Edit: `/etc/systemd/system/lithub.service`
```
[Unit]
Description=LitHub server
After=network.target

[Service]
User=nacsos
Type=simple
Environment="LITHUB_CONFIG=/var/www/lithub/literature-hub/.config/server.env"
WorkingDirectory=/var/www/lithub/literature-hub/backend
LimitNOFILE=4096
ExecStart=/var/www/lithub/literature-hub/backend/venv/bin/python -m hypercorn main:app --config=../.config/server.toml
Restart=always
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

Then update and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable lithub.service  
sudo systemctl start lithub.service  
```


### nginx

Edit: `/etc/nginx/sites-enabled/default`
```
location /lithub/ {
    include proxy_params;
    proxy_pass_request_headers on;
    proxy_pass http://127.0.0.1:9080/;
}
```

Then test and restart:
```bash
sudo nginx -t
sudo systemctl restart nginx.service  
```
