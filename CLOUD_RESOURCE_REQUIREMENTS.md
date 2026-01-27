# Cloud Resource Requirements
## PIMS - Police Investigation Management System

**Version:** 1.0
**Date:** January 20, 2026
**Purpose:** Define cloud infrastructure resource requirements for deployment

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Application Server Requirements](#2-application-server-requirements)
3. [Database Requirements](#3-database-requirements)
4. [Storage Requirements](#4-storage-requirements)
5. [Network and Bandwidth](#5-network-and-bandwidth)
6. [Cost Estimates](#6-cost-estimates)
7. [Scaling Recommendations](#7-scaling-recommendations)

---

## 1. Executive Summary

The PIMS application is a full-stack web application with moderate resource requirements suitable for small to medium law enforcement agencies. This document provides detailed specifications for cloud deployment on Azure with AWS S3 storage integration.

### Quick Reference

| Resource Type | Minimum | Recommended | Production |
|--------------|---------|-------------|------------|
| **Web App (VM)** | 2 vCPU, 4 GB RAM | 4 vCPU, 8 GB RAM | 4-8 vCPU, 16 GB RAM |
| **Database** | 2 vCPU, 8 GB RAM | 4 vCPU, 16 GB RAM | 8 vCPU, 32 GB RAM |
| **Disk Storage** | 50 GB | 100 GB | 250+ GB |
| **File Storage** | 100 GB | 500 GB | 1-5 TB |
| **Monthly Cost** | ~$300-500 | ~$600-900 | ~$1,200-2,000 |

---

## 2. Application Server Requirements

### 2.1 Azure Web App (App Service)

#### Development/Testing Environment

**Tier:** Basic (B2)
- **vCPUs:** 2 cores
- **RAM:** 3.5 GB
- **Storage:** 10 GB local disk
- **Use Case:** Development, testing, small pilot deployments
- **Concurrent Users:** 10-20 users
- **Estimated Cost:** ~$75/month

#### Staging Environment

**Tier:** Standard (S2)
- **vCPUs:** 2 cores
- **RAM:** 3.5 GB
- **Storage:** 50 GB local disk
- **Features:** Deployment slots, auto-scaling, custom domains
- **Concurrent Users:** 20-50 users
- **Estimated Cost:** ~$150/month

#### Production Environment (Small Agency)

**Tier:** Standard (S3) or Premium (P1V2)
- **vCPUs:** 4 cores
- **RAM:** 7-8 GB
- **Storage:** 50 GB local disk
- **Features:** Deployment slots, auto-scaling, custom domains, VNet integration
- **Concurrent Users:** 50-100 users
- **Estimated Cost:** ~$200-300/month

#### Production Environment (Medium-Large Agency)

**Tier:** Premium (P2V2) or (P3V2)
- **vCPUs:** 4-8 cores
- **RAM:** 14-16 GB
- **Storage:** 250 GB local disk
- **Features:** All premium features, enhanced security, private endpoints
- **Concurrent Users:** 100-300 users
- **Estimated Cost:** ~$400-800/month

### 2.2 Application Resource Breakdown

#### Node.js Backend Requirements

**Base Memory Usage:**
- Node.js runtime: ~100-150 MB
- Express.js framework: ~50 MB
- Dependencies (38 packages): ~200-300 MB
- **Total Base:** ~350-500 MB

**Runtime Memory Usage:**
- Active connections (per user): ~5-10 MB
- JWT token processing: ~1-2 MB per request
- File processing (Puppeteer, PDFKit): 100-500 MB spikes
- Database connections pool: ~50-100 MB
- **Peak Usage (50 concurrent users):** 2-4 GB

**Critical Dependencies with High Memory Usage:**
- **Puppeteer:** 100-200 MB (includes Chromium browser)
- **pdfkit:** 20-50 MB
- **AWS SDK:** 30-50 MB
- **Mongoose:** 50-100 MB (connection pools)
- **libreoffice-convert:** 50-100 MB (if LibreOffice installed)

**CPU Requirements:**
- Typical API requests: Low CPU (5-10%)
- PDF generation: Medium CPU (30-50%)
- Document conversion: High CPU (60-80%)
- Version snapshot creation: Medium CPU (20-40%)

#### React Frontend (Served as Static)

**Build Size:**
- Production build: ~13 MB
- Gzipped: ~4-5 MB
- Static assets (images, fonts): ~2-3 MB
- **Total:** ~15-18 MB disk space

**Memory Impact:**
- Served as static files: Minimal (<50 MB)
- Cached in CDN/browser: Zero server impact after first load

### 2.3 Disk Space Requirements

**Application Code:**
- Backend source + node_modules: ~500-800 MB
- Frontend build: ~15-20 MB
- Temp upload directory: 1-5 GB (transient files)
- Logs: 500 MB - 2 GB (with rotation)
- **Minimum Disk:** 10 GB
- **Recommended Disk:** 50 GB
- **Production Disk:** 100+ GB

---

## 3. Database Requirements

### 3.1 Azure Cosmos DB (MongoDB API)

#### Database Size Estimation

**Per Case Calculation:**
- 1 Case: ~5 KB
- 10 Leads per case: ~50 KB
- 10 Lead Returns (current + components): ~200 KB
- 10 Version snapshots per lead: ~2 MB
- Audit logs (100 entries): ~500 KB
- **Total per case:** ~2.75 MB

**Database Growth Projections:**

| Number of Cases | Database Size | Storage Needed |
|----------------|---------------|----------------|
| 100 cases | 275 MB | 1 GB |
| 500 cases | 1.4 GB | 5 GB |
| 1,000 cases | 2.75 GB | 10 GB |
| 5,000 cases | 13.75 GB | 50 GB |
| 10,000 cases | 27.5 GB | 100 GB |
| 50,000 cases | 137.5 GB | 500 GB |

**Note:** File attachments (images, videos, documents) are NOT stored in database - they're stored in S3/Azure Blob Storage.

#### Development/Testing Environment

**Tier:** Serverless
- **RU/s (Request Units):** 1000 RU/s max (auto-scale)
- **Storage:** 25 GB
- **Throughput:** 1000 operations/sec
- **Use Case:** Dev/test environments
- **Estimated Cost:** ~$30-50/month

#### Small Production Environment

**Tier:** Provisioned Throughput
- **RU/s:** 4000 RU/s
- **Storage:** 50 GB
- **Throughput:** 4000 operations/sec
- **Concurrent Users:** 50-100 users
- **Cases:** Up to 5,000 cases
- **Estimated Cost:** ~$200-250/month

#### Medium Production Environment

**Tier:** Provisioned Throughput
- **RU/s:** 8000-10,000 RU/s
- **Storage:** 200 GB
- **Throughput:** 8000-10,000 operations/sec
- **Concurrent Users:** 100-200 users
- **Cases:** Up to 20,000 cases
- **Estimated Cost:** ~$400-600/month

#### Large Production Environment

**Tier:** Provisioned Throughput with Auto-scale
- **RU/s:** 10,000-20,000 RU/s (auto-scale)
- **Storage:** 500 GB - 1 TB
- **Throughput:** 10,000-20,000 operations/sec
- **Concurrent Users:** 200-500 users
- **Cases:** 50,000+ cases
- **Estimated Cost:** ~$800-1,500/month

### 3.2 Alternative: MongoDB Atlas (if not using Azure Cosmos DB)

#### M10 Cluster (Small Production)
- **RAM:** 2 GB
- **Storage:** 10 GB (auto-scaling to 4 TB)
- **vCPUs:** 2
- **Concurrent Connections:** ~500
- **Cost:** ~$60-80/month

#### M20 Cluster (Medium Production)
- **RAM:** 4 GB
- **Storage:** 20 GB (auto-scaling to 4 TB)
- **vCPUs:** 2
- **Concurrent Connections:** ~1,500
- **Cost:** ~$150-200/month

#### M30 Cluster (Large Production)
- **RAM:** 8 GB
- **Storage:** 40 GB (auto-scaling to 4 TB)
- **vCPUs:** 2
- **Concurrent Connections:** ~3,000
- **Cost:** ~$300-400/month

### 3.3 Database Connection Pool Settings

```javascript
// Recommended Mongoose Connection Settings
mongoose.connect(MONGO_URI, {
  maxPoolSize: 50,      // Small: 20, Medium: 50, Large: 100
  minPoolSize: 10,      // Small: 5, Medium: 10, Large: 20
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
});
```

### 3.4 Database Indexes (Impact on Storage)

**Index Overhead:** ~10-20% of total data size

**Critical Indexes:**
- users.username: ~100 KB per 1000 users
- cases.caseNo: ~200 KB per 1000 cases
- leads.leadNo + caseNo: ~500 KB per 10,000 leads
- completeleadreturns.leadNo + versionId: ~1 MB per 10,000 versions
- auditlogs.caseNo + leadNo: ~2 MB per 100,000 logs

**Total Index Overhead:** Add 15-20% to raw data size

---

## 4. Storage Requirements

### 4.1 File Storage (AWS S3 or Azure Blob Storage)

#### Storage Estimation Per Case

| File Type | Avg Size per File | Quantity per Lead | Total per Lead |
|-----------|------------------|-------------------|----------------|
| **Images** | 2-5 MB | 10 images | 20-50 MB |
| **Documents** | 1-5 MB | 5 documents | 5-25 MB |
| **Audio** | 5-20 MB | 2 files | 10-40 MB |
| **Video** | 50-200 MB | 1-2 files | 50-400 MB |
| **Total per Lead** | - | - | **85-515 MB** |

**Conservative Estimate:** 200 MB per lead
**Aggressive Estimate:** 500 MB per lead (video-heavy investigations)

#### Storage Growth Projections

**Assuming 10 leads per case, 200 MB per lead:**

| Number of Cases | Total Leads | Storage Needed (Conservative) | Storage Needed (Video-Heavy) |
|----------------|-------------|-------------------------------|------------------------------|
| 100 cases | 1,000 leads | 200 GB | 500 GB |
| 500 cases | 5,000 leads | 1 TB | 2.5 TB |
| 1,000 cases | 10,000 leads | 2 TB | 5 TB |
| 5,000 cases | 50,000 leads | 10 TB | 25 TB |
| 10,000 cases | 100,000 leads | 20 TB | 50 TB |

#### AWS S3 Bucket Configuration

**Storage Class Recommendations:**
- **Active Cases (0-6 months):** S3 Standard - $0.023/GB/month
- **Recent Cases (6-12 months):** S3 Standard-IA - $0.0125/GB/month
- **Archived Cases (1+ years):** S3 Glacier Flexible - $0.0036/GB/month

**Example Monthly Costs (S3 Standard):**
- 100 GB: ~$2.30
- 500 GB: ~$11.50
- 1 TB: ~$23
- 5 TB: ~$115
- 10 TB: ~$230

**Lifecycle Policy:** Automatically transition to cheaper tiers after case closure.

#### Azure Blob Storage Configuration

**Storage Tiers:**
- **Hot Tier (Active):** $0.018/GB/month
- **Cool Tier (Archive):** $0.01/GB/month
- **Archive Tier (Long-term):** $0.002/GB/month

**Example Monthly Costs (Hot Tier):**
- 100 GB: ~$1.80
- 500 GB: ~$9
- 1 TB: ~$18
- 5 TB: ~$90
- 10 TB: ~$180

### 4.2 Backup Storage

**Database Backups:**
- Daily automated backups: Same size as database
- Point-in-time restore: 30 days retention
- Storage needed: 1x database size

**File Storage Backups:**
- S3 versioning: +30% storage for version history
- Cross-region replication: 2x storage (for disaster recovery)

---

## 5. Network and Bandwidth

### 5.1 Bandwidth Requirements

#### Inbound Traffic (Upload)

**Per User Session:**
- Login/Authentication: ~10 KB
- Page loads: ~500 KB - 2 MB
- File uploads (images/documents): 5-50 MB
- Video uploads: 50-200 MB
- **Average per active user:** 50-100 MB/day

**Monthly Bandwidth (Uploads):**
- 50 active users: 75-150 GB/month
- 100 active users: 150-300 GB/month
- 200 active users: 300-600 GB/month

#### Outbound Traffic (Download)

**Per User Session:**
- API responses: ~500 KB - 2 MB
- File downloads: 10-100 MB
- PDF report generation: 2-10 MB
- **Average per active user:** 100-200 MB/day

**Monthly Bandwidth (Downloads):**
- 50 active users: 150-300 GB/month
- 100 active users: 300-600 GB/month
- 200 active users: 600-1,200 GB/month

#### Total Bandwidth Estimation

| Concurrent Users | Upload/Month | Download/Month | Total Bandwidth | Azure Cost (First 100GB Free) |
|-----------------|--------------|----------------|-----------------|-------------------------------|
| 50 users | 150 GB | 300 GB | 450 GB | ~$35/month |
| 100 users | 300 GB | 600 GB | 900 GB | ~$80/month |
| 200 users | 600 GB | 1,200 GB | 1,800 GB | ~$180/month |

**Note:** First 100 GB outbound is free on Azure, then $0.05-0.087/GB depending on region.

### 5.2 CDN Recommendations

**Azure CDN (Optional but Recommended):**
- Caches static assets (React build, images)
- Reduces bandwidth costs by 50-70%
- Improves global latency
- **Cost:** ~$0.081/GB + $0.0075 per 10,000 requests
- **Estimated Savings:** $50-150/month for 200+ users

---

## 6. Cost Estimates

### 6.1 Small Agency (50-100 Users, 1,000-5,000 Cases)

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| **Azure Web App** | Standard S3 (4 vCPU, 7 GB RAM) | $200 |
| **Azure Cosmos DB** | 4000 RU/s, 50 GB | $250 |
| **AWS S3 Storage** | 1 TB (Standard) | $23 |
| **Bandwidth** | 450 GB | $35 |
| **Backup Storage** | 50 GB database + 300 GB files | $10 |
| **Monitoring/Logs** | Azure Monitor | $20 |
| **Total** | | **~$538/month** |
| **Annual** | | **~$6,456/year** |

### 6.2 Medium Agency (100-200 Users, 5,000-20,000 Cases)

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| **Azure Web App** | Premium P2V2 (4 vCPU, 14 GB RAM) | $400 |
| **Azure Cosmos DB** | 8000 RU/s, 200 GB | $500 |
| **AWS S3 Storage** | 5 TB (Standard + IA mix) | $80 |
| **Bandwidth** | 900 GB | $80 |
| **Backup Storage** | 200 GB database + 1.5 TB files | $40 |
| **CDN** | Azure CDN | $50 |
| **Monitoring/Logs** | Azure Monitor + Log Analytics | $40 |
| **Total** | | **~$1,190/month** |
| **Annual** | | **~$14,280/year** |

### 6.3 Large Agency (200-500 Users, 20,000-50,000 Cases)

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| **Azure Web App** | Premium P3V2 (8 vCPU, 16 GB RAM) x2 | $1,600 |
| **Azure Cosmos DB** | 15,000 RU/s, 500 GB | $1,000 |
| **AWS S3 Storage** | 10 TB (Standard + IA + Glacier) | $150 |
| **Bandwidth** | 1,800 GB | $180 |
| **Backup Storage** | 500 GB database + 3 TB files | $80 |
| **CDN** | Azure CDN | $100 |
| **Load Balancer** | Azure Load Balancer | $50 |
| **Monitoring/Logs** | Azure Monitor + Log Analytics | $80 |
| **Security** | Azure Firewall + DDoS Protection | $200 |
| **Total** | | **~$3,440/month** |
| **Annual** | | **~$41,280/year** |

### 6.4 Cost Optimization Strategies

1. **Use Azure Reserved Instances:** Save 30-50% on compute by committing 1-3 years
2. **Implement S3 Lifecycle Policies:** Move old files to cheaper storage tiers
3. **Enable Azure Cosmos DB Auto-scale:** Pay only for RU/s you use
4. **Use CDN for Static Assets:** Reduce bandwidth costs by 50-70%
5. **Compress Files Before Upload:** Reduce storage and bandwidth
6. **Implement Data Archival:** Move closed cases to Glacier/Archive tier
7. **Right-size Resources:** Start small and scale based on actual usage

---

## 7. Scaling Recommendations

### 7.1 Horizontal Scaling (More Instances)

**When to Scale Out:**
- CPU consistently > 70%
- Response time > 2 seconds
- Error rate > 1%

**Azure Web App Auto-scaling Rules:**
```yaml
Scale Out Rules:
  - When CPU > 70% for 10 minutes → Add 1 instance
  - When Requests > 1000/min → Add 1 instance
  - Maximum instances: 5

Scale In Rules:
  - When CPU < 40% for 20 minutes → Remove 1 instance
  - Minimum instances: 2 (production)
```

### 7.2 Vertical Scaling (Bigger Instances)

**Upgrade Path:**
1. **Start:** Standard S2 (2 vCPU, 3.5 GB RAM) - 20-50 users
2. **Upgrade 1:** Standard S3 (4 vCPU, 7 GB RAM) - 50-100 users
3. **Upgrade 2:** Premium P1V2 (2 vCPU, 8 GB RAM) - 100-150 users
4. **Upgrade 3:** Premium P2V2 (4 vCPU, 14 GB RAM) - 150-250 users
5. **Upgrade 4:** Premium P3V2 (8 vCPU, 16 GB RAM) - 250-500 users

### 7.3 Database Scaling

**Cosmos DB Scaling:**
- Start: 4000 RU/s
- Medium: 8000 RU/s
- Large: 15,000 RU/s
- Enterprise: Partition data, use multi-region writes

**Connection Pool Scaling:**
- Small: maxPoolSize: 20
- Medium: maxPoolSize: 50
- Large: maxPoolSize: 100

### 7.4 Storage Scaling

**S3 Bucket Scaling:**
- No limits - S3 scales infinitely
- Implement lifecycle policies for cost management
- Use CloudFront CDN for frequently accessed files

**Recommended Lifecycle:**
- 0-6 months: S3 Standard
- 6-24 months: S3 Standard-IA
- 24+ months: S3 Glacier Flexible Retrieval

### 7.5 Performance Optimization

#### Application Level
- Implement Redis caching for frequent queries
- Enable response compression (gzip)
- Use pagination (limit: 50-100 items per page)
- Lazy load images and large files
- Debounce search queries (300ms delay)

#### Database Level
- Add indexes on frequently queried fields
- Use projection to return only needed fields
- Implement database connection pooling
- Use aggregation pipelines instead of multiple queries
- Enable query profiling and optimization

#### Network Level
- Enable Azure CDN for static assets
- Implement browser caching (Cache-Control headers)
- Use WebP/AVIF for images (smaller file sizes)
- Compress API responses
- Use HTTP/2 for multiplexing

---

## 8. Monitoring and Alerts

### 8.1 Key Metrics to Monitor

**Application Metrics:**
- CPU utilization (alert if > 80%)
- Memory utilization (alert if > 85%)
- Response time (alert if > 3 seconds)
- Error rate (alert if > 2%)
- Request rate (track trends)

**Database Metrics:**
- RU/s consumption (alert if > 90%)
- Database storage (alert at 80% capacity)
- Connection pool utilization
- Query performance (slow queries > 1 second)
- Index usage efficiency

**Storage Metrics:**
- S3 bucket size (track growth rate)
- Upload/download bandwidth
- Failed file operations
- Storage costs trending

### 8.2 Recommended Monitoring Tools

**Azure Native:**
- Azure Monitor (included)
- Application Insights ($20-80/month)
- Log Analytics ($2-10/GB ingested)

**Third-Party Options:**
- Datadog ($15-31/host/month)
- New Relic ($25-199/month)
- Grafana + Prometheus (free, self-hosted)

---

## 9. Summary and Recommendations

### 9.1 Recommended Starting Configuration

**For Most Agencies (100-150 Users, 5,000-10,000 Cases):**

| Component | Specification | Monthly Cost |
|-----------|--------------|--------------|
| Azure Web App | Standard S3 (4 vCPU, 7 GB RAM) | $200 |
| Cosmos DB | 6000 RU/s, 100 GB | $350 |
| AWS S3 | 2 TB (with lifecycle) | $40 |
| Bandwidth | 600 GB | $50 |
| Monitoring | Azure Monitor | $30 |
| **Total** | | **~$670/month** |

**This configuration provides:**
- Room for 100-150 concurrent users
- Storage for 5,000-10,000 cases
- Auto-scaling capability
- Good performance (< 2s response time)
- Professional monitoring and alerting

### 9.2 Scaling Timeline

**Month 1-3:** Start with Basic/Standard tier to test and validate
**Month 4-6:** Collect usage metrics, right-size resources
**Month 7-12:** Implement auto-scaling, optimize costs
**Year 2+:** Consider reserved instances for 30-50% savings

### 9.3 Critical Success Factors

1. **Start Small:** Begin with conservative resources and scale up based on real usage
2. **Monitor Actively:** Set up comprehensive monitoring from day 1
3. **Optimize Costs:** Implement lifecycle policies, auto-scaling, and CDN
4. **Plan for Growth:** Document growth patterns and resource utilization
5. **Regular Reviews:** Quarterly review of costs and performance metrics

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-20 | Initial resource requirements document | Development Team |

---

**End of Cloud Resource Requirements Document**
