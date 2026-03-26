# DayCraft EC2 Deployment

This repo now supports a single-instance EC2 deployment using Docker Compose:

- `frontend` serves the Vite build with Nginx on port `80`
- `frontend` proxies `/api` requests to the `backend` container
- `backend` runs the Node API on internal port `5000`

## 1. Rotate exposed AWS credentials first

Do not use the access key, secret key, or console password that were shown in screenshots.

- Delete the exposed access key in IAM and create a new one only if you still need CLI access
- Change the IAM user console password
- Review CloudTrail / IAM activity if this account matters

## 2. Launch the EC2 instance

Recommended baseline:

- AMI: Amazon Linux 2023
- Instance type: `t3.small` or `t3.medium`
- Storage: at least `20 GB`
- Inbound security group:
  - `22` from your IP only
  - `80` from `0.0.0.0/0`
  - `443` from `0.0.0.0/0` if you add TLS later

## 3. Copy the app to the server

Clone or upload the repo to:

```bash
/opt/daycraft
```

## 4. Install Docker on the instance

Run:

```bash
chmod +x deploy/ec2/setup-al2023.sh
./deploy/ec2/setup-al2023.sh
```

This installs Docker plus the current Docker Compose and Buildx plugins from Docker's GitHub releases.

Reconnect to the instance only if you want to run `docker` without `sudo`.

## 5. Create production environment file

Create:

```bash
backend/.env.production
```

Start from:

```bash
backend/.env.example
```

Minimum required values:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGINS=http://YOUR_EC2_PUBLIC_IP
GOOGLE_CLIENT_ID=your_google_client_id
GROQ_API_KEY=your_groq_api_key
```

Optional but likely needed if you use these features:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`

If you attach a domain, replace `http://YOUR_EC2_PUBLIC_IP` with your real frontend origin in `CORS_ORIGINS`.

## 6. Deploy

Run:

```bash
chmod +x deploy/ec2/deploy.sh
APP_DIR=/opt/daycraft ./deploy/ec2/deploy.sh
```

## 7. Verify

Check:

```bash
docker compose -f docker-compose.ec2.yml ps
curl http://localhost/ 
curl http://localhost/api/health
```

From your browser:

```text
http://YOUR_EC2_PUBLIC_IP
```

## 8. Optional next steps

- Attach an Elastic IP so the server address stays stable
- Add a domain and TLS with Nginx + Certbot
- Move secrets to AWS Systems Manager Parameter Store or AWS Secrets Manager
- Add a CI/CD path later if you want one-command updates
