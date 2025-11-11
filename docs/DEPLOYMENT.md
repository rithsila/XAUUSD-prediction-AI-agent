# Deployment Guide - XAUUSD Prediction Agent

This guide provides detailed instructions for deploying the XAUUSD Prediction Agent to production environments.

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Cloud Deployment Options](#cloud-deployment-options)
5. [Post-Deployment](#post-deployment)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] Valid OpenAI API key with sufficient credits
- [ ] Production database (MySQL/TiDB) provisioned
- [ ] Domain name configured (optional)
- [ ] SSL certificate ready (for custom domains)
- [ ] Environment variables documented
- [ ] Database backup strategy in place
- [ ] Monitoring tools configured

---

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file with the following variables:

```env
# Database Configuration
DATABASE_URL=mysql://username:password@host:port/database?ssl=true

# OpenAI API
OPENAI_API_KEY=sk-...your-production-key

# Application Security
JWT_SECRET=<generate-strong-random-secret>
NODE_ENV=production

# Development login (no external OAuth)
DEV_LOGIN_ENABLED=true
VITE_DEV_LOGIN_ENABLED=true
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=your-name

# Application Branding
VITE_APP_TITLE=XAUUSD Prediction Agent
VITE_APP_LOGO=https://your-cdn.com/logo.png

# Storage (S3)
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=your-aws-region
# AWS_ACCESS_KEY_ID=your-access-key-id
# AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Notifications (Telegram; optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.your-domain.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### Generate Secure Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup

### 1. Provision Database

**Option A: TiDB Cloud (Recommended)**
- Sign up at https://tidbcloud.com
- Create a new cluster
- Note connection string

**Option B: MySQL**
- Use managed MySQL (AWS RDS, Google Cloud SQL, etc.)
- Or self-hosted MySQL 8.0+

### 2. Configure Connection

Update `DATABASE_URL` with your connection string:

```
mysql://username:password@host:port/database?ssl=true
```

### 3. Run Migrations

```bash
# Install dependencies
pnpm install

# Push schema to database
pnpm db:push
```

### 4. Verify Tables

Connect to your database and verify tables were created:
- `users`
- `predictions`
- `newsEvents`
- `mt5Notifications`

---

## Cloud Deployment Options

### Option 1: Vercel (Recommended for Simplicity)

**Pros**: Zero-config, automatic SSL, global CDN
**Cons**: Serverless limitations for long-running tasks

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all required variables from `.env.production`

5. **Custom Domain (Optional)**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

---

### Option 2: Railway

**Pros**: Full-stack support, database included, simple deployment
**Cons**: Paid service

#### Steps:

1. **Create Railway Account**
   - Sign up at https://railway.app

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

3. **Login**
   ```bash
   railway login
   ```

4. **Initialize Project**
   ```bash
   railway init
   ```

5. **Add Database**
   - Go to Railway Dashboard
   - Add MySQL plugin
   - Copy `DATABASE_URL` from plugin

6. **Set Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY=sk-...
   railway variables set JWT_SECRET=...
   # ... add all other variables
   ```

7. **Deploy**
   ```bash
   railway up
   ```

---

### Option 3: Docker + Cloud Provider

**Pros**: Maximum control, portable, scalable
**Cons**: More complex setup

#### 1. Create Dockerfile

```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

#### 2. Create docker-compose.yml (for local testing)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=xauusd
      - MYSQL_USER=xauusd_user
      - MYSQL_PASSWORD=xauusd_pass
    ports:
      - "3306:3306"
    volumes:
      - db_data:/var/lib/mysql

volumes:
  db_data:
```

#### 3. Build and Test Locally

```bash
docker-compose up --build
```

#### 4. Deploy to Cloud

**AWS ECS/Fargate:**
```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t xauusd-agent .
docker tag xauusd-agent:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/xauusd-agent:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/xauusd-agent:latest

# Create ECS task definition and service
# (Use AWS Console or CLI)
```

**Google Cloud Run:**
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/xauusd-agent
gcloud run deploy xauusd-agent --image gcr.io/PROJECT-ID/xauusd-agent --platform managed
```

**DigitalOcean App Platform:**
```bash
# Use DigitalOcean Console
# Connect GitHub repo
# Configure environment variables
# Deploy
```

---

### Option 4: VPS (Ubuntu/Debian)

**Pros**: Full control, cost-effective
**Cons**: Manual setup, maintenance required

#### Steps:

1. **Provision VPS**
   - DigitalOcean Droplet, Linode, AWS EC2, etc.
   - Ubuntu 22.04 LTS recommended
   - Minimum: 2GB RAM, 2 vCPUs

2. **SSH into Server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Dependencies**
   ```bash
   # Update system
   apt update && apt upgrade -y

   # Install Node.js 22
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
   apt install -y nodejs

   # Install pnpm
   npm install -g pnpm

   # Install PM2 (process manager)
   npm install -g pm2

   # Install Nginx (reverse proxy)
   apt install -y nginx

   # Install MySQL (or use external database)
   apt install -y mysql-server
   ```

4. **Clone Repository**
   ```bash
   cd /var/www
   git clone <your-repo-url> xauusd-agent
   cd xauusd-agent
   ```

5. **Configure Environment**
   ```bash
   nano .env.production
   # Add all environment variables
   ```

6. **Install and Build**
   ```bash
   pnpm install
   pnpm build
   pnpm db:push
   ```

7. **Start with PM2**
   ```bash
   pm2 start npm --name "xauusd-agent" -- start
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx**
   ```bash
   nano /etc/nginx/sites-available/xauusd-agent
   ```

   Add:
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

   Enable site:
   ```bash
   ln -s /etc/nginx/sites-available/xauusd-agent /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

9. **Setup SSL with Let's Encrypt**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

---

## Post-Deployment

### 1. Verify Deployment

**Check Application**
```bash
curl https://your-domain.com/api/trpc/predictions.latest
```

**Check Database Connection**
- Generate a test prediction
- Verify it appears in database

### 2. Test All Features

- [ ] Generate prediction (all timeframes)
- [ ] Analyze news sentiment
- [ ] View prediction history
- [ ] MT5 notification
- [ ] Theme switching
- [ ] Mobile responsiveness

### 3. Performance Testing

```bash
# Load testing with Apache Bench
ab -n 100 -c 10 https://your-domain.com/

# Or use Artillery
npm install -g artillery
artillery quick --count 10 --num 100 https://your-domain.com/
```

---

## Monitoring & Maintenance

### Application Monitoring

**Option 1: PM2 Monitoring (VPS)**
```bash
pm2 monit
pm2 logs xauusd-agent
```

**Option 2: Cloud Provider Monitoring**
- Vercel Analytics
- Railway Metrics
- AWS CloudWatch
- Google Cloud Monitoring

**Option 3: External Monitoring**
- Sentry for error tracking
- LogRocket for session replay
- Datadog for comprehensive monitoring

### Database Monitoring

**Key Metrics to Track:**
- Connection pool usage
- Query performance
- Storage usage
- Backup status

### OpenAI API Monitoring

**Track:**
- API usage (tokens)
- Request latency
- Error rates
- Cost per day

### Backup Strategy

**Database Backups:**
```bash
# Daily automated backup
0 2 * * * mysqldump -u username -p password xauusd > /backups/xauusd-$(date +\%Y\%m\%d).sql
```

**Application Backups:**
- Use Git for code versioning
- Backup environment variables securely
- Document configuration changes

### Scaling Considerations

**Horizontal Scaling:**
- Load balancer (Nginx, AWS ALB)
- Multiple application instances
- Redis for session storage

**Database Scaling:**
- Read replicas
- Connection pooling
- Query optimization

**Caching:**
- Redis for prediction caching
- CDN for static assets
- Browser caching headers

---

## Troubleshooting

### Common Production Issues

**Issue: High OpenAI API Costs**
- Implement request caching
- Rate limit prediction generation
- Use cheaper models for non-critical features

**Issue: Database Connection Timeouts**
- Increase connection pool size
- Optimize queries
- Add database indexes

**Issue: Slow Response Times**
- Enable compression
- Optimize bundle size
- Use CDN for assets
- Implement caching

**Issue: Memory Leaks**
- Monitor with PM2 or cloud provider tools
- Restart application periodically
- Profile with Node.js inspector

---

## Security Hardening

### Application Security

1. **Rate Limiting**
   ```typescript
   // Add to server
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

2. **Helmet.js**
   ```bash
   pnpm add helmet
   ```
   
   ```typescript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. **CORS Configuration**
   ```typescript
   app.use(cors({
     origin: ['https://your-domain.com'],
     credentials: true
   }));
   ```

### Infrastructure Security

- Keep dependencies updated
- Use environment variables for secrets
- Enable firewall rules
- Regular security audits
- SSL/TLS encryption
- Database access controls

---

## Cost Estimation

### Monthly Costs (Approximate)

**Small Scale (< 1000 predictions/day)**
- Database (TiDB Serverless): $0-10
- Hosting (Vercel/Railway): $0-20
- OpenAI API: $10-50
- **Total: $10-80/month**

**Medium Scale (1000-10000 predictions/day)**
- Database: $20-50
- Hosting: $20-100
- OpenAI API: $50-200
- **Total: $90-350/month**

**Large Scale (10000+ predictions/day)**
- Database: $100-500
- Hosting: $100-500
- OpenAI API: $200-1000+
- **Total: $400-2000+/month**

---

## Support

For deployment assistance:
- **GitHub Issues**: Technical problems
- **Documentation**: Full deployment guides
- **Community**: Discord/Slack channels

---

**Last Updated**: October 20, 2025

