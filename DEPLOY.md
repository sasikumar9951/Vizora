# VIZORA — Deployment Guide

## Project Structure
```
vizora-project/
  public/
    index.html       ← Main site (registration form)
    admin.html       ← Admin dashboard
  server.js          ← Express backend
  package.json
  schema.sql         ← Run once in Neon SQL Editor
  .env               ← Your secrets (never commit this)
  .gitignore
```

---

## Step 1 — Set Up Neon PostgreSQL

1. Go to https://neon.tech and create a free account
2. Create a new Project → choose a region closest to your users
3. In the dashboard, go to **SQL Editor**
4. Paste and run the contents of `schema.sql`
5. Go to **Connection Details** → copy the **Connection String**
   - It looks like: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

---

## Step 2 — Configure Environment

Edit your `.env` file:
```env
DATABASE_URL=postgresql://...your-neon-connection-string...
PORT=3000
ADMIN_USER=admin
ADMIN_PASS=YourStrongPassword!
ADMIN_TOKEN=SomeLongRandomString_ChangeMe_abc123
ALLOWED_ORIGIN=https://your-domain.com
```

> ⚠️ Never commit `.env` to Git. It's already in `.gitignore`.

---

## Step 3 — Run Locally

```bash
cd vizora-project
npm install
npm run dev       # uses nodemon for auto-restart
# or
npm start         # production start
```

Visit:
- Site: http://localhost:3000
- Admin: http://localhost:3000/admin.html

---

## Deploy Option A — Render (Recommended, Free Tier)

1. Push project to GitHub (make sure `.env` is gitignored)

2. Go to https://render.com → New → **Web Service**

3. Connect your GitHub repo

4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node

5. Add Environment Variables in Render dashboard:
   - `DATABASE_URL` → your Neon connection string
   - `ADMIN_USER` → admin
   - `ADMIN_PASS` → your password
   - `ADMIN_TOKEN` → your secret token
   - `ALLOWED_ORIGIN` → https://your-app.onrender.com

6. Click **Deploy** — Render will give you a public URL

> Render free tier spins down after 15 min of inactivity. Upgrade to Starter ($7/mo) for always-on.

---

## Deploy Option B — AWS EC2

### 1. Launch EC2 Instance
- AMI: Ubuntu 22.04 LTS
- Instance type: t2.micro (free tier) or t3.small
- Open security group ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000

### 2. SSH & Set Up
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Clone your repo
git clone https://github.com/you/vizora-project.git
cd vizora-project
npm install

# Create .env
nano .env
# (paste your env variables and save)
```

### 3. Start with PM2
```bash
pm2 start server.js --name vizora
pm2 startup        # auto-start on reboot
pm2 save
```

### 4. Set Up Nginx Reverse Proxy (optional but recommended)
```bash
sudo apt install nginx -y

sudo nano /etc/nginx/sites-available/vizora
```

Paste:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/vizora /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Add HTTPS with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/register` | None | Submit registration |
| POST | `/api/admin/login` | None | Admin login |
| GET | `/api/registrations` | Bearer token | Fetch all registrations |
| DELETE | `/api/registrations` | Bearer token | Clear all registrations |

---

## Security Notes

- Admin token is stored in memory only (never localStorage/sessionStorage)
- All DB queries use parameterized statements (SQL injection safe)
- Credentials stored in `.env`, never in frontend code
- For production: consider switching `ADMIN_TOKEN` to JWT (jsonwebtoken package)
