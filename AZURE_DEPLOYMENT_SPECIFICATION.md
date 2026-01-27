# AZURE DEPLOYMENT SPECIFICATION FOR PIMS
## Police Information Management System

**Version**: 1.0
**Last Updated**: January 19, 2026
**Environment**: Microsoft Azure Cloud

---

## TABLE OF CONTENTS

1. [System Architecture Requirements](#1-system-architecture-requirements)
2. [Software Bill of Materials (SBOM)](#2-software-bill-of-materials-sbom)
3. [Container/Server Specifications](#3-containerserver-specifications)
4. [Network and Port Requirements](#4-network-and-port-requirements)
5. [Environment Variables and Configuration](#5-environment-variables-and-configuration)
6. [Azure Service Recommendations](#6-azure-service-recommendations)
7. [Cost Estimation](#7-cost-estimation)
8. [Deployment Checklist](#8-deployment-checklist)
9. [Security and Monitoring](#9-security-and-monitoring)

---

## 1. SYSTEM ARCHITECTURE REQUIREMENTS

### 1.1 Application Components

#### Frontend Application (React SPA)
- **Framework**: React 18.3.1
- **Build Tool**: Create React App with Tailwind CSS 4.0.13
- **Runtime**: Static assets (HTML, CSS, JS)
- **Build Output**: ~150-300 MB
- **Package Manager**: npm 10.x

#### Backend API Server
- **Runtime**: Node.js 20.x LTS
- **Framework**: Express 4.21.2
- **Main Entry**: [backend/src/server.js](backend/src/server.js)
- **Default Port**: 5000
- **Dependencies**: 40+ npm packages
- **Size**: ~300-500 MB node_modules

#### MongoDB Database
- **Version**: 4.13.0+ (Mongoose 6.9.2 compatible)
- **Collections**: 22+ models
- **Storage**: GridFS for file storage
- **Features**: Multi-document transactions, audit logging, versioning

#### Redis Cache
- **Client**: ioredis 5.7.0
- **Port**: 6379 (6380 for SSL)
- **Usage**: User presence tracking (30s TTL)
- **Data Structures**: Sorted Sets, Hash Maps

#### Cloud Storage
- **Primary**: AWS S3 (Bucket: files-pims)
- **Secondary**: Azure Blob Storage (Account: pimsresources, Container: lr-files)
- **Local**: `/backend/src/temp_uploads/` for temporary processing

### 1.2 System Requirements by Component

| Component | vCPU | RAM | Storage | Azure SKU Recommendation |
|-----------|------|-----|---------|-------------------------|
| Frontend | 2-4 | 3.5-7 GB | 100 GB | Static Web Apps Standard or App Service P1V2 |
| Backend | 4+ | 7-14 GB | 100 GB | App Service P2V2 (4 vCPU, 7GB) |
| MongoDB | 8+ | 16-32 GB | 500 GB SSD | Cosmos DB (10k-50k RUs) or VM Standard_D8s_v3 |
| Redis | 2-4 | 6-13 GB | - | Azure Cache for Redis C4 (13GB) Premium |
| Storage | - | - | 500GB-2TB | StorageV2 with GRS |

---

## 2. SOFTWARE BILL OF MATERIALS (SBOM)

### 2.1 Backend Dependencies (40+ packages)

#### Core Framework
- `express@4.21.2` - Web framework
- `cors@2.8.5` - CORS middleware
- `dotenv@16.6.1` - Environment configuration
- `method-override@3.0.0` - HTTP method override

#### Database & Storage
- `mongoose@6.9.2` - MongoDB ODM
- `gridfs-stream@1.1.1` - GridFS file streaming
- `multer-gridfs-storage@5.0.2` - GridFS storage engine
- `mongodb@4.13.0` - MongoDB driver (pinned)
- `@aws-sdk/client-s3@3.892.0` - AWS S3 client
- `@aws-sdk/s3-request-presigner@3.892.0` - S3 presigned URLs
- `@azure/storage-blob@12.29.1` - Azure Blob Storage

#### Authentication & Security
- `jsonwebtoken@9.0.2` - JWT tokens
- `bcryptjs@2.4.3` - Password hashing

#### Document Processing
- `pdf-lib@1.17.1` - PDF manipulation
- `pdfkit@0.16.0` - PDF generation
- `puppeteer@24.6.0` - Headless Chrome (HTML to PDF)
- `mammoth@1.9.0` - DOCX parsing
- `libreoffice-convert@1.6.1` - Document conversion

#### Caching
- `ioredis@5.7.0` - Redis client

#### File Upload
- `multer@1.4.4` - Multipart form data handling

### 2.2 Frontend Dependencies (30+ packages)

#### Core Framework
- `react@18.3.1` - React library
- `react-dom@18.3.1` - DOM rendering
- `react-router-dom@6.28.0` - Client-side routing
- `react-scripts@5.0.1` - CRA build scripts

#### State Management
- `@tanstack/react-query@5.85.5` - Server state management

#### API & Authentication
- `axios@1.7.9` - HTTP client
- `jwt-decode@4.0.0` - JWT decoding

#### Document Processing
- `jspdf@3.0.0` - PDF generation
- `html2canvas@1.4.1` - HTML to canvas
- `react-pdf@10.1.0` - PDF viewer
- `pdfjs-dist@5.3.93` - PDF.js worker
- `react-to-print@3.0.5` - Print functionality

#### UI & Styling
- `tailwindcss@4.0.13` - CSS framework
- `react-icons@5.4.0` - Icon library
- `react-quill@2.0.0` - Rich text editor
- `autoprefixer@10.4.21` - CSS vendor prefixing
- `postcss@8.5.3` - CSS processing

#### Utilities
- `papaparse@5.5.2` - CSV parsing
- `chart.js@4.4.8` - Charts
- `leaflet@1.9.4` - Maps

### 2.3 Runtime Requirements

#### Node.js
- **Version**: 20.x LTS (minimum 20.10+)
- **npm**: 10.x+

#### System-Level Dependencies

**For Puppeteer (Headless Chrome)**:
```
Chromium browser (~500 MB)
Linux packages:
  libx11-6, libx11-xcb1, libxcb1, libxcomposite1
  libxcursor1, libxdamage1, libxext6, libxfixes3
  libxi6, libxrandr2, libxrender1, libxss1
  libxtst6, libgbm1, libasound2, libatk1.0-0
  libcups2, libdbus-1-3, libdrm2, libglib2.0-0
  libgtk-3-0
```

**For LibreOffice Conversion**:
```
LibreOffice suite (500 MB - 1 GB)
Binary: /usr/bin/soffice
X11 libraries or xvfb-run for headless
```

---

## 3. CONTAINER/SERVER SPECIFICATIONS

### 3.1 Frontend Deployment

#### Azure Static Web Apps (Recommended)
```yaml
Service: Static Web Apps
SKU: Standard
Region: Canada Central
Build Command: CI=false npm run build
Build Output: frontend/build/
Features:
  - Automatic HTTPS
  - Global CDN
  - Custom domains
  - GitHub integration
Cost: ~$9/month
```

#### Configuration
```nginx
# Nginx-style routing
location / {
  try_files $uri $uri/ /index.html;
}

# Cache control
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location /index.html {
  add_header Cache-Control "no-cache";
}
```

### 3.2 Backend API Server

#### Azure App Service Configuration
```yaml
Service: App Service
SKU: P2V2 (4 vCPU, 7GB RAM)
Region: Canada Central
Runtime Stack: Node.js 20 LTS
Auto-scale: 2-10 instances

Scaling Rules:
  Scale Up: CPU > 70% for 5 min → Add instance
  Scale Down: CPU < 30% for 10 min → Remove instance
  Min Instances: 2
  Max Instances: 10

Health Check:
  Path: /api/health
  Interval: 30 seconds
  Timeout: 10 seconds
  Unhealthy Threshold: 3
```

#### Node.js Process Configuration
```bash
# Startup command
node --max-old-space-size=4096 src/server.js

# Environment
NODE_ENV=production
PORT=5000
UV_THREADPOOL_SIZE=256
```

### 3.3 MongoDB Database

#### Azure Cosmos DB (Recommended)
```yaml
Service: Azure Cosmos DB
API: MongoDB (version 4.2+)
Database: pims
Throughput: Auto-scale 10,000-50,000 RUs
Storage: 100 GB+ (auto-scales)
Consistency: Session level
Regions: Canada Central (primary) + East US (secondary)
Backup: Continuous (30-day retention)
Cost: ~$300-500/month
```

#### Collections & Indexes
```javascript
// Key collections from models/
Users, Cases, LeadReturns, CompleteleadReturn
AuditLog, LeadReturnAuditLog
LRPerson, LRVehicle, LREvidence, LRTimeline
LRPicture, LRAudio, LRVideo, LREnclosure
LRScratchpad, Roles, Meetings, Notifications

// Critical indexes
LeadReturn: { caseNo: 1, leadNo: 1 }
AuditLog: { timestamp: -1 }, { "performedBy.username": 1 }
CompleteleadReturn: { leadNo: 1, version: -1 }
```

### 3.4 Redis Cache

#### Azure Cache for Redis
```yaml
Service: Azure Cache for Redis
SKU: Premium
Size: C4 (13 GB) or C5 (26 GB)
Clustering: Enabled
Geo-replication: Secondary region
Persistence: RDB snapshots every 6 hours
Eviction Policy: allkeys-lru
Port: 6380 (SSL required)
Cost: ~$250-400/month
```

#### Configuration
```javascript
// Redis connection
{
  host: process.env.REDIS_HOST,
  port: 6380,
  password: process.env.REDIS_PASSWORD,
  tls: { servername: process.env.REDIS_HOST },
  db: 0,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3
}

// Key patterns from presenceStore.js
presence:z:{roomKey}  // Sorted set for presence tracking
presence:h:{roomKey}  // Hash map for user roles
TTL: 30 seconds
```

### 3.5 Storage Services

#### Azure Blob Storage
```yaml
Service: Storage Account
Type: StorageV2
Redundancy: Geo-Redundant Storage (GRS)
Access Tier: Hot
Encryption: AES-256 (enabled by default)

Containers:
  lr-files: Lead return documents
  temp-uploads: Temporary processing
  reports: Generated PDF reports
  backups: Database backups

Lifecycle Management:
  0-90 days: Hot tier
  91-365 days: Cool tier
  366+ days: Archive tier

Cost: ~$50/month for 500 GB
```

#### AWS S3 (if maintaining dual storage)
```yaml
Bucket: files-pims
Region: us-east-1
Storage Class: Standard
Versioning: Enabled
Encryption: AES-256 (SSE-S3)
Lifecycle:
  30 days → Intelligent-Tiering
  90 days → Glacier
  365 days → Deep Archive
Cost: ~$15-30/month for 500 GB
```

---

## 4. NETWORK AND PORT REQUIREMENTS

### 4.1 Port Mapping

| Service | Port | Protocol | Access | Purpose |
|---------|------|----------|--------|---------|
| Frontend | 443 | HTTPS | Public | Web application |
| Frontend | 80 | HTTP | Public | Redirect to HTTPS |
| Backend | 443 | HTTPS | Public via API Gateway | REST API |
| Backend | 5000 | HTTP | Internal only | App Service internal |
| MongoDB | 27017 | TCP | VNet only | Database connection |
| Cosmos DB | 10255 | TCP | VNet only | MongoDB API |
| Redis | 6379 | TCP | VNet only | Cache (non-SSL) |
| Redis SSL | 6380 | TCP | VNet only | Cache (SSL) |

### 4.2 VNet Configuration

```yaml
Virtual Network: pims-vnet
Address Space: 10.0.0.0/16

Subnets:
  - frontend-subnet: 10.0.1.0/24 (256 IPs)
  - backend-subnet: 10.0.2.0/24 (256 IPs)
  - database-subnet: 10.0.3.0/24 (256 IPs)
  - cache-subnet: 10.0.4.0/24 (256 IPs)
  - storage-subnet: 10.0.5.0/24 (256 IPs)
```

### 4.3 Network Security Groups (NSGs)

```yaml
Frontend NSG:
  Inbound:
    - Allow 80, 443 from Internet
    - Deny all other traffic
  Outbound:
    - Allow to backend-subnet:5000
    - Allow to Internet (CDN, APIs)

Backend NSG:
  Inbound:
    - Allow 5000 from frontend-subnet
    - Allow 443 from Application Gateway
  Outbound:
    - Allow to database-subnet:27017,10255
    - Allow to cache-subnet:6379,6380
    - Allow to Internet (S3, Azure Blob)

Database NSG:
  Inbound:
    - Allow 27017,10255 from backend-subnet only
  Outbound:
    - None required

Cache NSG:
  Inbound:
    - Allow 6379,6380 from backend-subnet only
  Outbound:
    - None required
```

### 4.4 CORS Configuration

```javascript
// backend/src/server.js CORS settings
const corsOptions = {
  origin: [
    'http://localhost:3000', // Development
    'https://your-frontend.azurewebsites.net', // Production
    'https://yourdomain.com' // Custom domain
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 3600
};
```

### 4.5 External API Endpoints

```yaml
AWS S3:
  Endpoint: https://s3.amazonaws.com
  Region: us-east-1
  Port: 443 (HTTPS only)

Azure Blob Storage:
  Endpoint: https://pimsresources.blob.core.windows.net
  Port: 443 (HTTPS only)
  Authentication: SAS Token or Managed Identity
```

---

## 5. ENVIRONMENT VARIABLES AND CONFIGURATION

### 5.1 Backend Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/pims?retryWrites=true&w=majority
# OR for Cosmos DB
COSMOS_URI=mongodb://account:password@account.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retryWrites=false&maxIdleTimeMS=120000&appName=@account@

# Authentication
JWT_SECRET=your-super-secret-minimum-32-characters-long
JWT_EXPIRES_IN=5h

# Redis
REDIS_HOST=your-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# AWS S3
AWS_ACCESS_KEY_ID=AKIAT...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
BUCKET=files-pims
S3_BUCKET_URL=https://files-pims.s3.amazonaws.com

# Azure Blob Storage
STORAGE_ACCOUNT_NAME=pimsresources
CONTAINER_NAME=lr-files
SAS_TOKEN=sv=2024-11-04&ss=bfqt&srt=co&sp=rwdlacupiytfx&se=...
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=pimsresources;AccountKey=...

# Document Processing
LIBREOFFICE_PATH=/usr/bin/soffice
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_HEADLESS=true
PUPPETEER_NO_SANDBOX=true

# Monitoring
LOG_LEVEL=info
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=...
```

### 5.2 Frontend Environment Variables

```bash
# API Configuration
REACT_APP_API_BASE_URL=https://api.yourdomain.com/api
REACT_APP_API_TIMEOUT=30000

# Authentication
REACT_APP_JWT_TOKEN_KEY=token

# Analytics (optional)
REACT_APP_APP_INSIGHTS_KEY=your-instrumentation-key
```

### 5.3 Azure Key Vault Secrets

**Store these secrets in Azure Key Vault**:
```
- JWT_SECRET
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- MONGO_URI or COSMOS_URI
- REDIS_PASSWORD
- SAS_TOKEN
- AZURE_STORAGE_CONNECTION_STRING
```

**Reference in App Service Configuration**:
```
@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/JWT-SECRET/)
@Microsoft.KeyVault(SecretUri=https://your-keyvault.vault.azure.net/secrets/MONGO-URI/)
```

---

## 6. AZURE SERVICE RECOMMENDATIONS

### 6.1 Recommended Architecture

```
Component               Azure Service                    SKU/Size           Cost/Month
─────────────────────────────────────────────────────────────────────────────────────
Frontend                Static Web Apps                  Standard           $9
Backend                 App Service                      P2V2               $365
Database                Cosmos DB (MongoDB API)          10k-50k RUs        $300
Cache                   Azure Cache for Redis            C4 Premium         $250
Storage                 Blob Storage                     StorageV2 GRS      $50
Monitoring              Application Insights             Standard           $100
Secrets                 Key Vault                        Standard           $10
Networking              VNet + NSG + App Gateway         Basic              $50
─────────────────────────────────────────────────────────────────────────────────────
TOTAL ESTIMATED                                                             $1,134/mo
```

### 6.2 Service Details

#### Frontend: Azure Static Web Apps
```yaml
Tier: Standard
Features:
  - Global CDN (Automatic)
  - Custom domains with free SSL
  - GitHub/Azure DevOps integration
  - Staging environments
  - API routes (optional)
Deployment: GitHub Actions or Azure DevOps
```

#### Backend: Azure App Service
```yaml
App Service Plan: Premium v2 (P2V2)
Specs: 4 vCPU, 7 GB RAM
Auto-scale: 2-10 instances
Features:
  - Deployment slots (staging/production)
  - Automatic HTTPS
  - VNet integration
  - Managed identity support
  - Application Insights integration
Health Check: /api/health endpoint
```

#### Database: Azure Cosmos DB
```yaml
API: MongoDB (4.2+ compatible)
Consistency: Session level
Throughput: Auto-scale 10,000-50,000 RUs
Storage: Unlimited (pay-per-GB)
Regions: Multi-region (Canada Central + East US)
Backup: Continuous (30-day retention)
Features:
  - 99.999% SLA
  - Automatic failover
  - Global distribution
  - Encryption at rest
```

#### Cache: Azure Cache for Redis
```yaml
Tier: Premium
Size: C4 (13 GB) or C5 (26 GB)
Features:
  - Clustering enabled
  - Geo-replication
  - Redis persistence (RDB)
  - Zone redundancy
  - Virtual network support
SSL: Required (port 6380)
```

#### Storage: Azure Blob Storage
```yaml
Type: General Purpose v2
Redundancy: Geo-Redundant Storage (GRS)
Access Tier: Hot
Features:
  - Lifecycle management
  - Blob versioning
  - Soft delete (7 days)
  - Encryption at rest (AES-256)
Containers:
  - lr-files
  - temp-uploads
  - reports
  - backups
```

### 6.3 Monitoring & Security

#### Application Insights
```yaml
Features:
  - Application performance monitoring
  - Request/response tracking
  - Dependency tracking
  - Exception logging
  - Custom metrics
  - Live metrics stream
Log Retention: 90 days (extendable to 730 days)
```

#### Azure Key Vault
```yaml
SKU: Standard
Features:
  - Secret management
  - Certificate storage
  - Access policies (RBAC)
  - Audit logging
  - Soft delete (90 days)
Integration: Managed identity with App Service
```

#### Azure Security Center
```yaml
Tier: Standard
Features:
  - Threat detection
  - Vulnerability assessment
  - Security recommendations
  - Compliance dashboards
  - Just-in-time VM access
```

---

## 7. COST ESTIMATION

### 7.1 Monthly Cost Breakdown (USD)

| Service | SKU | Quantity | Unit Cost | Total |
|---------|-----|----------|-----------|-------|
| Static Web Apps | Standard | 1 | $9 | $9 |
| App Service P2V2 | 4vCPU, 7GB | 3 avg instances | $122/instance | $365 |
| Cosmos DB | 20k RU avg | 720 hours | $0.42/hour | $300 |
| Redis C4 Premium | 13 GB | 1 | $250 | $250 |
| Blob Storage | 500 GB GRS | 500 GB | $0.10/GB | $50 |
| Application Insights | Standard | 50 GB data | $2/GB | $100 |
| Key Vault | Standard | 10 secrets | $1/10k ops | $10 |
| VNet + NSG | Basic | - | $50 | $50 |
| **TOTAL** | | | | **$1,134/mo** |

### 7.2 Cost Optimization Strategies

1. **Use Reserved Instances** for App Service (save 30-50%)
2. **Enable auto-scaling** to reduce costs during low traffic
3. **Implement lifecycle policies** for Blob Storage (move to Cool/Archive tiers)
4. **Use Azure Hybrid Benefit** if you have existing Windows Server licenses
5. **Monitor and optimize Cosmos DB RUs** based on actual usage
6. **Use Azure Cost Management** to set budgets and alerts

### 7.3 Scaling Cost Impact

| Load Level | Instances | Cosmos RUs | Redis | Monthly Cost |
|------------|-----------|------------|-------|--------------|
| Light | 2 | 10k | C3 (6GB) | $800 |
| **Medium** (recommended) | **3-4** | **20k** | **C4 (13GB)** | **$1,134** |
| Heavy | 6-8 | 40k | C5 (26GB) | $2,000 |
| Enterprise | 10+ | 50k+ | C6 (53GB) | $3,500+ |

---

## 8. DEPLOYMENT CHECKLIST

### 8.1 Pre-Deployment

#### Infrastructure Setup
- [ ] Create Azure subscription and resource group
- [ ] Set up VNet and subnets
- [ ] Configure Network Security Groups (NSGs)
- [ ] Create Azure Key Vault
- [ ] Set up Azure Container Registry (if using containers)

#### Service Provisioning
- [ ] Create Azure Static Web Apps (frontend)
- [ ] Create App Service Plan and App Service (backend)
- [ ] Provision Cosmos DB with MongoDB API
- [ ] Create Azure Cache for Redis
- [ ] Set up Blob Storage account and containers
- [ ] Configure Application Insights

#### Security Configuration
- [ ] Generate strong JWT secret (32+ characters)
- [ ] Store all secrets in Azure Key Vault
- [ ] Create Managed Identity for App Service
- [ ] Grant Key Vault access to Managed Identity
- [ ] Configure RBAC for all resources
- [ ] Set up Azure Security Center

#### Database Setup
- [ ] Create Cosmos DB database and collections
- [ ] Configure indexes (see [backend/src/models/](backend/src/models/))
- [ ] Set up connection strings
- [ ] Enable continuous backup
- [ ] Test connection from local environment

### 8.2 Deployment Steps

#### Backend Deployment
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install production dependencies
npm ci --only=production

# 3. Test locally
npm start

# 4. Deploy to Azure App Service
az webapp up --name pims-api --resource-group pims-rg --runtime "NODE:20-lts"

# OR use GitHub Actions / Azure DevOps pipeline
```

#### Frontend Deployment
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm ci

# 3. Build production bundle
CI=false npm run build

# 4. Deploy to Static Web Apps
# (Configure GitHub Actions or Azure DevOps)

# OR manual deployment
az staticwebapp create --name pims-frontend \
  --resource-group pims-rg \
  --source frontend \
  --branch main
```

#### Environment Variables Setup
```bash
# Backend App Service configuration
az webapp config appsettings set --name pims-api \
  --resource-group pims-rg \
  --settings \
    NODE_ENV=production \
    PORT=5000 \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://pims-kv.vault.azure.net/secrets/JWT-SECRET/)" \
    MONGO_URI="@Microsoft.KeyVault(SecretUri=https://pims-kv.vault.azure.net/secrets/MONGO-URI/)" \
    REDIS_HOST=pims-redis.redis.cache.windows.net \
    REDIS_PORT=6380 \
    REDIS_PASSWORD="@Microsoft.KeyVault(SecretUri=https://pims-kv.vault.azure.net/secrets/REDIS-PASSWORD/)"
```

### 8.3 Post-Deployment Validation

#### Smoke Tests
- [ ] Frontend loads successfully
- [ ] API health check responds: `GET /api/health`
- [ ] User login/authentication works
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] File upload to Azure Blob works
- [ ] PDF report generation works
- [ ] Audit logging functional

#### Performance Testing
- [ ] Load test with 100 concurrent users
- [ ] Verify response times < 1000ms (p95)
- [ ] Check auto-scaling triggers correctly
- [ ] Monitor memory usage under load
- [ ] Verify database query performance

#### Security Validation
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured correctly
- [ ] Authentication required for protected routes
- [ ] Secrets not exposed in logs or errors
- [ ] NSG rules blocking unauthorized access

#### Monitoring Setup
- [ ] Application Insights receiving telemetry
- [ ] Custom metrics configured
- [ ] Alerts set up for critical thresholds
- [ ] Log Analytics queries tested
- [ ] Dashboard created for key metrics

---

## 9. SECURITY AND MONITORING

### 9.1 Security Best Practices

#### Network Security
```yaml
Implemented:
  - VNet isolation for all backend services
  - NSG rules with deny-all default
  - Private endpoints for Cosmos DB and Redis
  - HTTPS/TLS 1.2+ enforced everywhere
  - CORS whitelist configured

Recommended:
  - Enable Azure DDoS Protection Standard
  - Add Web Application Firewall (WAF) to Application Gateway
  - Implement rate limiting on API endpoints
  - Use Azure Front Door for global load balancing
```

#### Application Security
```yaml
From code analysis:
  ✓ JWT authentication (5-hour expiration)
  ✓ bcryptjs password hashing
  ✓ Mongoose query sanitization (prevents NoSQL injection)
  ✓ React XSS protection (automatic escaping)
  ✓ CORS configuration with origin whitelist

Add:
  - Helmet.js for security headers
  - Rate limiting middleware (express-rate-limit)
  - CSRF token validation
  - Input validation with Joi or Zod
  - SQL injection prevention (already using Mongoose)
```

#### Data Security
```yaml
Encryption at Rest:
  - Cosmos DB: AES-256 encryption (automatic)
  - Blob Storage: SSE with Microsoft-managed keys
  - Redis: Encrypted storage

Encryption in Transit:
  - TLS 1.2+ for all connections
  - Redis SSL (port 6380)
  - Cosmos DB SSL required

Access Control:
  - RBAC for Azure resources
  - JWT tokens for API authentication
  - Managed Identity for service-to-service auth
  - SAS tokens with expiration for blob access
```

### 9.2 Monitoring Strategy

#### Key Metrics to Monitor

**Application Metrics** (Application Insights)
```javascript
// Request metrics
- Total requests/second
- Average response time (p50, p95, p99)
- Failed requests (4xx, 5xx errors)
- Request duration by endpoint

// Business metrics
- User logins per hour
- Lead returns created/updated
- PDF reports generated
- File uploads (count and size)
- Audit log entries
```

**Infrastructure Metrics** (Azure Monitor)
```yaml
App Service:
  - CPU percentage
  - Memory percentage
  - HTTP queue length
  - Instance count (auto-scale)
  - Response time

Cosmos DB:
  - Request Units consumed
  - Throttled requests
  - Storage used
  - Query latency
  - Replication lag

Redis:
  - Cache hit rate
  - Memory usage
  - Connected clients
  - Operations per second
  - Evicted keys

Blob Storage:
  - Total requests
  - Ingress/egress
  - Storage capacity
  - Transaction count
```

#### Alert Thresholds

**Critical Alerts** (immediate action required)
```yaml
- API error rate > 5% for 5 minutes
- API response time p95 > 5000ms for 5 minutes
- App Service CPU > 90% for 10 minutes
- Cosmos DB 429 errors (throttling) > 100/minute
- Redis memory usage > 90%
- Any service completely unavailable
```

**Warning Alerts** (investigate soon)
```yaml
- API error rate > 1% for 10 minutes
- API response time p95 > 1000ms for 10 minutes
- App Service CPU > 70% for 15 minutes
- App Service memory > 80% for 15 minutes
- Cosmos DB RUs > 80% of provisioned
- Redis cache hit rate < 70%
- Disk space > 85%
```

#### Log Analytics Queries

**Find slow API requests**
```kusto
requests
| where timestamp > ago(1h)
| where duration > 1000
| summarize count() by operation_Name, bin(timestamp, 5m)
| order by count_ desc
```

**Monitor authentication failures**
```kusto
traces
| where timestamp > ago(1h)
| where message contains "authentication failed"
| summarize count() by bin(timestamp, 5m)
```

**Track file upload errors**
```kusto
exceptions
| where timestamp > ago(1h)
| where outerMessage contains "upload" or outerMessage contains "s3" or outerMessage contains "blob"
| project timestamp, outerMessage, innermostMessage
```

### 9.3 Backup and Disaster Recovery

#### Backup Strategy
```yaml
Cosmos DB:
  Mode: Continuous backup (automatic)
  Retention: 30 days
  Recovery: Point-in-time restore to any second

Blob Storage:
  Replication: GRS (Geo-Redundant Storage)
  Versioning: Enabled
  Soft Delete: 7 days
  Snapshots: Manual weekly snapshots

Application Code:
  Repository: GitHub with protected main branch
  Releases: Tagged versions
  Artifacts: Stored in Azure DevOps or GitHub releases
```

#### Recovery Objectives
```yaml
Recovery Time Objective (RTO): 2 hours
  - Time to restore service after disaster

Recovery Point Objective (RPO): 15 minutes
  - Maximum data loss acceptable

Achieved through:
  - Cosmos DB continuous backup
  - Blob Storage geo-replication
  - Multi-region deployment (optional)
```

#### Disaster Recovery Procedures

**Database Failure**
```bash
# 1. Check Cosmos DB status
az cosmosdb show --name pims-cosmos --resource-group pims-rg

# 2. Initiate failover (automatic in multi-region)
az cosmosdb failover-priority-change \
  --name pims-cosmos \
  --resource-group pims-rg \
  --failover-policies WestUS=0 EastUS=1

# 3. Verify application reconnects automatically
```

**Application Service Failure**
```bash
# 1. Check health status
az webapp show --name pims-api --resource-group pims-rg --query state

# 2. Restart app service
az webapp restart --name pims-api --resource-group pims-rg

# 3. If persistent, swap to staging slot (if configured)
az webapp deployment slot swap \
  --name pims-api \
  --resource-group pims-rg \
  --slot staging
```

**Complete Region Failure**
```yaml
Prerequisites:
  - Multi-region Cosmos DB configured
  - Blob Storage with GRS replication
  - Traffic Manager or Front Door for DNS failover

Steps:
  1. Deploy application to secondary region
  2. Update DNS records (if not using Traffic Manager)
  3. Verify Cosmos DB failover completed
  4. Test application functionality
  5. Monitor for issues

Estimated Time: 1-2 hours for manual failover
```

---

## APPENDIX A: Dockerfile for Backend

```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install system dependencies for Puppeteer and LibreOffice
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    libreoffice \
    xvfb \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy node_modules from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create temp directories
RUN mkdir -p src/temp_uploads reports && \
    chown -R nodejs:nodejs src/temp_uploads reports

# Environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_NO_SANDBOX=true \
    LIBREOFFICE_PATH=/usr/bin/soffice

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
```

---

## APPENDIX B: Azure DevOps Pipeline YAML

```yaml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - backend/**
      - frontend/**

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '20.x'
  azureSubscription: 'Azure Subscription Connection'

stages:
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      - job: BuildBackend
        displayName: 'Build Backend'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'

          - script: |
              cd backend
              npm ci
            displayName: 'Install dependencies'

          - script: |
              cd backend
              npm run test
            displayName: 'Run tests'
            continueOnError: true

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: 'backend'
              includeRootFolder: false
              archiveType: 'zip'
              archiveFile: '$(Build.ArtifactStagingDirectory)/backend-$(Build.BuildId).zip'
            displayName: 'Archive backend files'

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: '$(Build.ArtifactStagingDirectory)'
              ArtifactName: 'backend-drop'
            displayName: 'Publish backend artifact'

      - job: BuildFrontend
        displayName: 'Build Frontend'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: $(nodeVersion)
            displayName: 'Install Node.js'

          - script: |
              cd frontend
              npm ci
            displayName: 'Install dependencies'

          - script: |
              cd frontend
              CI=false npm run build
            displayName: 'Build production bundle'

          - task: ArchiveFiles@2
            inputs:
              rootFolderOrFile: 'frontend/build'
              includeRootFolder: false
              archiveType: 'zip'
              archiveFile: '$(Build.ArtifactStagingDirectory)/frontend-$(Build.BuildId).zip'
            displayName: 'Archive frontend files'

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: '$(Build.ArtifactStagingDirectory)'
              ArtifactName: 'frontend-drop'
            displayName: 'Publish frontend artifact'

  - stage: DeployDev
    displayName: 'Deploy to Development'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/develop'))
    jobs:
      - deployment: DeployBackendDev
        displayName: 'Deploy Backend to Dev'
        environment: 'development'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: $(azureSubscription)
                    appType: 'webAppLinux'
                    appName: 'pims-api-dev'
                    package: '$(Pipeline.Workspace)/backend-drop/backend-$(Build.BuildId).zip'
                    runtimeStack: 'NODE|20-lts'
                    startUpCommand: 'node src/server.js'

      - deployment: DeployFrontendDev
        displayName: 'Deploy Frontend to Dev'
        environment: 'development'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureStaticWebApp@0
                  inputs:
                    app_location: '/'
                    output_location: 'build'
                    azure_static_web_apps_api_token: $(STATIC_WEB_APP_TOKEN_DEV)

  - stage: DeployProd
    displayName: 'Deploy to Production'
    dependsOn: Build
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - deployment: DeployBackendProd
        displayName: 'Deploy Backend to Production'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                # Deploy to staging slot first
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: $(azureSubscription)
                    appType: 'webAppLinux'
                    appName: 'pims-api'
                    package: '$(Pipeline.Workspace)/backend-drop/backend-$(Build.BuildId).zip'
                    runtimeStack: 'NODE|20-lts'
                    deployToSlotOrASE: true
                    resourceGroupName: 'pims-rg'
                    slotName: 'staging'

                # Run smoke tests on staging
                - script: |
                    curl -f https://pims-api-staging.azurewebsites.net/api/health || exit 1
                  displayName: 'Smoke test on staging'

                # Swap staging to production
                - task: AzureAppServiceManage@0
                  inputs:
                    azureSubscription: $(azureSubscription)
                    action: 'Swap Slots'
                    webAppName: 'pims-api'
                    resourceGroupName: 'pims-rg'
                    sourceSlot: 'staging'
                    targetSlot: 'production'

      - deployment: DeployFrontendProd
        displayName: 'Deploy Frontend to Production'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureStaticWebApp@0
                  inputs:
                    app_location: '/'
                    output_location: 'build'
                    azure_static_web_apps_api_token: $(STATIC_WEB_APP_TOKEN_PROD)
```

---

## APPENDIX C: Performance Tuning

### Node.js Optimization
```javascript
// backend/src/server.js enhancements

// 1. Compression middleware
const compression = require('compression');
app.use(compression());

// 2. Optimize JSON parsing
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// 3. Production settings
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('etag', 'weak');

// 4. Connection pooling
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 45000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});

// 5. Redis connection pooling
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false
});
```

### Startup Command
```bash
# App Service startup command with optimization flags
node --max-old-space-size=4096 \
     --max-http-header-size=16384 \
     --optimize-for-size \
     src/server.js
```

### Mongoose Query Optimization
```javascript
// Add indexes for frequently queried fields
// Already defined in models, verify they're created:

// LeadReturn model
LeadReturnSchema.index({ caseNo: 1, leadNo: 1 });
LeadReturnSchema.index({ assignedTo: 1, status: 1 });
LeadReturnSchema.index({ createdAt: -1 });

// AuditLog model
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ 'performedBy.username': 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

// Use lean() for read-only queries
const leads = await LeadReturn.find({ status: 'active' })
  .lean()
  .limit(100);

// Use select() to limit fields
const users = await User.find()
  .select('username email role')
  .lean();
```

---

## APPENDIX D: Security Headers

```javascript
// backend/src/middleware/security.js

const helmet = require('helmet');

module.exports = (app) => {
  // Use Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.yourdomain.com'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // Rate limiting
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
  });
  app.use('/api/', limiter);

  // Stricter rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts'
  });
  app.use('/api/auth/login', authLimiter);
};
```

---

## CONTACT AND SUPPORT

**Document Maintained By**: DevOps Team
**Last Review**: January 19, 2026
**Next Review**: April 19, 2026

**For Questions**:
- Technical Issues: devops@yourdomain.com
- Security Concerns: security@yourdomain.com
- Azure Support: https://portal.azure.com (create support ticket)

**Version History**:
- v1.0 (2026-01-19): Initial deployment specification

---

**END OF DOCUMENT**
