# DigitalOcean API Deployment Guide

This guide explains how to deploy `apps/api` from this monorepo to a DigitalOcean droplet, how to update it later when code changes, and what each important command does.

It is written to be beginner-friendly and assumes:

- the API runs on a DigitalOcean droplet
- the frontend stays on Vercel
- nginx is used as the reverse proxy
- PM2 is used to keep the API running
- the public API domain is `api.shopvendly.store`
- the repo path on the droplet is `/var/www/shopvendly/shopvendly`

---

# 1. High-level architecture

## What runs where

- `apps/api`
  - runs on DigitalOcean
  - served through nginx
  - kept alive by PM2

  # QUICK GUIDE

      cd /var/www/shopvendly/shopvendly
      git pull origin main
      pnpm install --frozen-lockfile
      pnpm --filter @shopvendly/api build
      pm2 restart shopvendly-api
      pm2 save

      curl http://127.0.0.1:8000/health

  curl https://api.shopvendly.store/health
  pm2 logs shopvendly-api --lines 50

- `apps/web`
  - stays on Vercel
  - calls the API through `https://api.shopvendly.store`

## Why this setup was chosen

The API handles payment flows, status polling, settlement logic, and external provider calls. Running it on a VPS is more reliable for long-running work than a serverless API deployment.

---

# 2. Important production values

## Main paths and domains

- **Droplet repo path**
  - `/var/www/shopvendly/shopvendly`

- **Public API domain**
  - `api.shopvendly.store`

- **Internal API port**
  - `8000`

## Main services used

- **Node.js**
  - runs the API

- **pnpm**
  - installs workspace dependencies

- **PM2**
  - keeps the API running in the background

- **nginx**
  - receives public traffic and forwards it to `127.0.0.1:8000`

- **Certbot**
  - issues and renews HTTPS certificates

---

# 3. First-time deployment steps

## Step 1: SSH into the droplet

```bash
ssh root@YOUR_DROPLET_IP
```

This connects you to the server.

---

## Step 2: Install Node.js, pnpm, PM2, nginx, and Git

If these are not already installed, install them.

### Install Node with NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### Check Node

```bash
node -v
npm -v
```

### Install pnpm

```bash
npm install -g pnpm
```

### Install PM2

```bash
npm install -g pm2
```

### Install nginx and Git

```bash
apt update
apt install -y nginx git
```

---

## Step 3: Put the project on the server

### Create the folder

```bash
mkdir -p /var/www/shopvendly
```

### Go into it

```bash
cd /var/www/shopvendly
```

### Clone the repository

```bash
git clone YOUR_REPO_URL shopvendly
```

### Enter the repo

```bash
cd /var/www/shopvendly/shopvendly
```

---

## Step 4: Create the production `.env`

Create the environment file in the repo root:

```bash
nano /var/www/shopvendly/shopvendly/.env
```

Add your real production values.

Example shape:

```env
DATABASE_URL=your_database_url
COLLECTO_BASE_URL=https://collecto.cissytech.com/api
COLLECTO_USERNAME=your_collecto_username
COLLECTO_API_KEY=your_collecto_api_key
COLLECTO_PROXY_SECRET=your_collecto_proxy_secret
PORT=8000
```

Also include any other secrets your API requires.

### Protect the file

```bash
chmod 600 /var/www/shopvendly/shopvendly/.env
```

What this does:

- only the owner can read/write the file
- helps protect secrets

---

## Step 5: Install dependencies

From the repo root:

```bash
cd /var/www/shopvendly/shopvendly
pnpm install --frozen-lockfile
```

What this does:

- installs all workspace dependencies
- uses the lockfile exactly as committed

If that fails because the lockfile changed, run:

```bash
pnpm install
```

---

## Step 6: Build the API

```bash
pnpm --filter @shopvendly/api build
```

What this does:

- builds only `apps/api`
- creates the production output in `apps/api/dist`

### Verify build output

```bash
ls apps/api/dist
```

You should see files like `server.mjs`.

---

## Step 7: Test the API manually

Run the built API directly:

```bash
PORT=8000 node apps/api/dist/server.mjs
```

Then in another terminal session on the droplet:

```bash
curl http://127.0.0.1:8000/health
```

Expected result:

```json
{"ok":true,"service":"api",...}
```

Stop the API with `Ctrl + C` after the test.

---

# 4. Starting the API with PM2

Because this monorepo had environment-loading issues in production, the working PM2 command used the explicit Node binary and explicit `dotenv` preload path.

## Find the real Node binary

```bash
which node
```

Example output:

```bash
/root/.nvm/versions/node/v20.20.1/bin/node
```

## Start the API with PM2

```bash
pm2 start /root/.nvm/versions/node/v20.20.1/bin/node --name shopvendly-api -- -r /var/www/shopvendly/shopvendly/apps/api/node_modules/dotenv/config /var/www/shopvendly/shopvendly/apps/api/dist/server.mjs dotenv_config_path=/var/www/shopvendly/shopvendly/.env
```

What this does:

- starts the API with PM2
- loads the `.env` file before the app starts
- runs the built API server entrypoint

## Check status

```bash
pm2 list
```

## Check logs

```bash
pm2 logs shopvendly-api --lines 50
```

## Save PM2 state

```bash
pm2 save
```

## Enable auto-start on reboot

```bash
pm2 startup
```

PM2 prints another command. Run that exact command, then run:

```bash
pm2 save
```

---

# 5. Configure nginx

## Create the nginx config

```bash
nano /etc/nginx/sites-available/api-shopvendly
```

Use this config before SSL:

```nginx
server {
    listen 80;
    server_name api.shopvendly.store;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Enable the site

```bash
ln -s /etc/nginx/sites-available/api-shopvendly /etc/nginx/sites-enabled/api-shopvendly
```

## Test nginx config

```bash
nginx -t
```

## Reload nginx

```bash
systemctl reload nginx
```

## Test locally through nginx

```bash
curl -H "Host: api.shopvendly.store" http://127.0.0.1/health
```

Expected result:

```json
{"ok":true,"service":"api",...}
```

---

# 6. Point DNS to the droplet

The domain used Vercel nameservers, so the DNS record had to be added in the Vercel DNS zone.

## Create this DNS record

- **Type**
  - `A`
- **Name**
  - `api`
- **Value**
  - `YOUR_DROPLET_IP`

## Verify public resolution

```bash
dig api.shopvendly.store +short
```

Expected result:

```bash
YOUR_DROPLET_IP
```

If `dig` still shows old IPs, the authoritative nameservers may already be correct while recursive resolvers are still caching old answers.

To query the authoritative Vercel nameservers directly:

```bash
dig api.shopvendly.store @ns1.vercel-dns.com +short
dig api.shopvendly.store @ns2.vercel-dns.com +short
```

---

# 7. Add HTTPS with Certbot

Install Certbot:

```bash
apt install -y certbot python3-certbot-nginx
```

Issue the certificate:

```bash
certbot --nginx -d api.shopvendly.store
```

What this does:

- requests an SSL certificate from Let’s Encrypt
- updates nginx automatically
- enables HTTPS for your API domain

## Test HTTPS

```bash
curl https://api.shopvendly.store/health
```

Expected result:

```json
{"ok":true,"service":"api",...}
```

---

# 8. Update the frontend to use the new API

In the Vercel project for `apps/web`, set:

```env
NEXT_PUBLIC_API_URL=https://api.shopvendly.store
```

Then redeploy the frontend.

---

# 9. Commands used during troubleshooting

These commands were useful during setup and debugging.

## Check if `.env` exists

```bash
ls -la /var/www/shopvendly/shopvendly/.env
```

## Check if a variable exists inside `.env`

```bash
grep DATABASE_URL /var/www/shopvendly/shopvendly/.env
```

## Confirm PM2 process health

```bash
pm2 list
pm2 logs shopvendly-api --lines 50
```

## Force HTTPS test to the droplet IP

```bash
curl --resolve api.shopvendly.store:443:YOUR_DROPLET_IP https://api.shopvendly.store/health
```

What this does:

- bypasses normal DNS resolution
- forces the request to the droplet
- still sends the correct host/SNI for HTTPS

## Test the API directly on localhost

```bash
curl http://127.0.0.1:8000/health
```

## Test nginx locally with the correct host header

```bash
curl -H "Host: api.shopvendly.store" http://127.0.0.1/health
```

## Show authoritative nameservers

```bash
dig NS shopvendly.store +short
```

## Query public resolvers directly

```bash
dig api.shopvendly.store @1.1.1.1 +short
dig api.shopvendly.store @8.8.8.8 +short
```

## Flush old PM2 logs

```bash
pm2 flush
```

## Save PM2 process state

```bash
pm2 save
```

---

# 10. How to update the API when code changes later

This is the normal repeatable update workflow for future API changes.

## Standard update flow

```bash
cd /var/www/shopvendly/shopvendly
git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @shopvendly/api build
pm2 restart shopvendly-api
pm2 save
```

## What each command does

- `git pull origin main`
  - gets the latest code from GitHub

- `pnpm install --frozen-lockfile`
  - installs dependencies exactly as defined in the lockfile

- `pnpm --filter @shopvendly/api build`
  - rebuilds only the API app

- `pm2 restart shopvendly-api`
  - restarts the running API with the new build

- `pm2 save`
  - saves the current PM2 process list for reboot persistence

## Verify after every update

```bash
curl http://127.0.0.1:8000/health
curl https://api.shopvendly.store/health
pm2 logs shopvendly-api --lines 50
```

---

# 11. What to do if only frontend code changed

If only `apps/web` changed and it is hosted on Vercel:

- push changes to GitHub
- redeploy on Vercel
- no API droplet update is needed

---

# 12. What to do if only environment variables changed

If only API env vars changed:

```bash
nano /var/www/shopvendly/shopvendly/.env
pm2 restart shopvendly-api
pm2 save
```

You usually do not need to rebuild if only env vars changed.

---

# 13. Troubleshooting guide

## Problem: `DATABASE_URL is not defined`

Cause:

- `.env` file missing
- wrong `.env` path
- env file not loaded before runtime

Checks:

```bash
ls -la /var/www/shopvendly/shopvendly/.env
grep DATABASE_URL /var/www/shopvendly/shopvendly/.env
```

---

## Problem: nginx gives `502 Bad Gateway`

Cause:

- PM2 process is down
- API is not listening on port `8000`

Checks:

```bash
pm2 list
pm2 logs shopvendly-api --lines 50
curl http://127.0.0.1:8000/health
```

---

## Problem: domain still hits Vercel instead of the droplet

Cause:

- DNS record not updated
- stale resolver cache
- old subdomain still attached in Vercel

Checks:

```bash
dig api.shopvendly.store +short
dig api.shopvendly.store @ns1.vercel-dns.com +short
dig api.shopvendly.store @ns2.vercel-dns.com +short
```

---

## Problem: PowerShell `curl` behaves strangely on Windows

Cause:

- PowerShell aliases `curl` to `Invoke-WebRequest`

Use one of these instead:

```powershell
curl.exe https://api.shopvendly.store/health
```

or

```powershell
Invoke-WebRequest https://api.shopvendly.store/health
```

Linux-style flags like `-H` and `--resolve` should be run on the droplet shell, not in PowerShell.

---

## Problem: `pnpm install --frozen-lockfile` fails

Fix:

```bash
pnpm install
```

Then continue with build and restart.

---

## Problem: PM2 process breaks after restart

Recreate it using the working command:

```bash
pm2 delete shopvendly-api
pm2 start /root/.nvm/versions/node/v20.20.1/bin/node --name shopvendly-api -- -r /var/www/shopvendly/shopvendly/apps/api/node_modules/dotenv/config /var/www/shopvendly/shopvendly/apps/api/dist/server.mjs dotenv_config_path=/var/www/shopvendly/shopvendly/.env
pm2 save
```

---

# 14. Payment-specific note

The Collecto initiation flow was updated so that:

- each attempt gets a unique reference
- `transactionId: 0` is treated as unusable
- `requestToPay: false` is treated as failure
- duplicate-reference responses are surfaced clearly

If payment initiation starts failing again, check:

```bash
pm2 logs shopvendly-api --lines 100
```

and inspect the Collecto initiation logs.

---

# 15. Recommended future improvement

The deployment works, but the monorepo env loading is still a little fragile.

A future improvement would be to make env loading more robust in:

- `apps/api/server.ts`
- `packages/db/src/env.ts`

so the app can load the repo root `.env` without needing the explicit PM2 preload workaround.

---

# 16. Quick copy-paste command blocks

## First-time API deploy

```bash
cd /var/www/shopvendly
git clone YOUR_REPO_URL shopvendly
cd /var/www/shopvendly/shopvendly
nano .env
chmod 600 .env
pnpm install --frozen-lockfile
pnpm --filter @shopvendly/api build
pm2 start /root/.nvm/versions/node/v20.20.1/bin/node --name shopvendly-api -- -r /var/www/shopvendly/shopvendly/apps/api/node_modules/dotenv/config /var/www/shopvendly/shopvendly/apps/api/dist/server.mjs dotenv_config_path=/var/www/shopvendly/shopvendly/.env
pm2 save
pm2 startup
```

## Future API update

```bash
cd /var/www/shopvendly/shopvendly
git pull origin main
pnpm install --frozen-lockfile
pnpm --filter @shopvendly/api build
pm2 restart shopvendly-api
pm2 save
```

## Health checks

```bash
curl http://127.0.0.1:8000/health
curl https://api.shopvendly.store/health
pm2 logs shopvendly-api --lines 50
```
