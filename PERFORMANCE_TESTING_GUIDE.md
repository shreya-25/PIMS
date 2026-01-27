# Performance Testing Guide
## PIMS - Resource Utilization and Load Testing

**Version:** 1.0
**Date:** January 20, 2026
**Purpose:** Test and measure actual resource utilization for deployment planning

---

## Table of Contents

1. [Overview](#1-overview)
2. [Quick Start](#2-quick-start)
3. [Load Testing with Artillery](#3-load-testing-with-artillery)
4. [Resource Monitoring](#4-resource-monitoring)
5. [Database Size Analysis](#5-database-size-analysis)
6. [API Performance Testing](#6-api-performance-testing)
7. [Storage Analysis](#7-storage-analysis)
8. [Interpreting Results](#8-interpreting-results)

---

## 1. Overview

This guide provides tools and scripts to:
- **Load test** your API endpoints (simulate 10-1000 concurrent users)
- **Monitor** CPU, RAM, and disk usage in real-time
- **Analyze** database size and growth patterns
- **Measure** API response times under load
- **Calculate** actual storage requirements

### Testing Tools Used

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Artillery** | Load testing | `npm install -g artillery` |
| **clinic.js** | Node.js profiling | `npm install -g clinic` |
| **autocannon** | HTTP benchmarking | `npm install -g autocannon` |
| **MongoDB Tools** | Database analysis | Built-in with MongoDB |

---

## 2. Quick Start

### Prerequisites

```bash
# Install testing tools globally
npm install -g artillery
npm install -g autocannon
npm install -g clinic

# Install project dependencies (if not already done)
cd backend
npm install
```

### Run Quick Performance Test

```bash
# 1. Start your backend server
npm start

# 2. In another terminal, run quick load test
artillery quick --count 50 --num 100 http://localhost:5000/test

# 3. Monitor resources (see section 4)
node performance-tests/monitor-resources.js
```

---

## 3. Load Testing with Artillery

### 3.1 Installation

```bash
npm install -g artillery
```

### 3.2 Basic Load Tests

#### Test 1: Warm-up Test (10 users)
```bash
artillery quick --count 10 --num 50 http://localhost:5000/test
```

#### Test 2: Normal Load (50 users)
```bash
artillery quick --count 50 --num 200 http://localhost:5000/api/cases
```

#### Test 3: Peak Load (100 users)
```bash
artillery quick --count 100 --num 500 http://localhost:5000/api/lead/assignedTo-leads
```

### 3.3 Advanced Load Test Configuration

The Artillery configuration file tests realistic user scenarios including:
- User authentication
- Case browsing
- Lead creation
- Lead return submission
- File uploads
- Search operations

**Location:** `performance-tests/artillery-load-test.yml`

#### Run Complete Load Test

```bash
# Run the comprehensive load test
artillery run performance-tests/artillery-load-test.yml

# Generate HTML report
artillery run performance-tests/artillery-load-test.yml --output report.json
artillery report report.json
```

### 3.4 Load Test Scenarios

The test simulates 3 phases:

1. **Warm-up Phase** (1 min)
   - 5 users/second ramping up
   - Tests: Login, view cases

2. **Normal Load Phase** (5 min)
   - 20 users/second sustained
   - Tests: All CRUD operations

3. **Peak Load Phase** (2 min)
   - 50 users/second spike
   - Tests: Heavy operations (file uploads, PDF generation)

---

## 4. Resource Monitoring

### 4.1 Real-Time Monitoring Script

**Location:** `performance-tests/monitor-resources.js`

This script monitors:
- CPU usage (%)
- Memory usage (MB and %)
- Disk I/O
- Network traffic
- Process count
- Response times

#### Run Monitor

```bash
node performance-tests/monitor-resources.js
```

**Output Example:**
```
=== PIMS Resource Monitor ===
Timestamp: 2026-01-20T10:30:15.000Z
CPU Usage: 45.2%
Memory: 1245 MB / 8192 MB (15.2%)
Free Memory: 6947 MB
Disk Usage: 12.5 GB / 100 GB (12.5%)
Network: ↓ 2.5 MB/s ↑ 1.2 MB/s
Active Connections: 23
```

### 4.2 Continuous Monitoring

Monitor resources during load test:

```bash
# Terminal 1: Start monitor with 5-second intervals
node performance-tests/monitor-resources.js > monitor-log.txt

# Terminal 2: Run load test
artillery run performance-tests/artillery-load-test.yml

# Monitor logs in real-time in Terminal 3
tail -f monitor-log.txt
```

### 4.3 Windows Performance Monitor

For more detailed Windows metrics:

```powershell
# Monitor CPU and Memory every 5 seconds
while ($true) {
    Get-Counter '\Processor(_Total)\% Processor Time', '\Memory\Available MBytes'
    Start-Sleep -Seconds 5
}
```

### 4.4 Linux/Mac Performance Monitor

```bash
# Install and use htop
sudo apt-get install htop  # Linux
brew install htop           # Mac

htop -d 50  # Update every 5 seconds

# Or use built-in top
top -d 5
```

---

## 5. Database Size Analysis

### 5.1 Database Size Script

**Location:** `performance-tests/analyze-db-size.js`

This script analyzes:
- Total database size
- Collection sizes
- Index sizes
- Document counts
- Average document size
- Growth projections

#### Run Database Analysis

```bash
node performance-tests/analyze-db-size.js
```

**Output Example:**
```
=== PIMS Database Size Analysis ===

Database: pims
Total Size: 2.45 GB
Storage Size: 2.10 GB
Index Size: 350 MB

Collections:
┌─────────────────────────┬────────────┬────────┬─────────────┬──────────────┐
│ Collection              │ Documents  │ Size   │ Avg Doc     │ Index Size   │
├─────────────────────────┼────────────┼────────┼─────────────┼──────────────┤
│ cases                   │ 1,234      │ 15 MB  │ 12.4 KB     │ 2 MB         │
│ leads                   │ 12,340     │ 85 MB  │ 7.1 KB      │ 15 MB        │
│ completeleadreturns     │ 45,678     │ 1.2 GB │ 28.5 KB     │ 180 MB       │
│ auditlogs               │ 234,567    │ 850 MB │ 3.7 KB      │ 120 MB       │
│ lrpersons               │ 34,567     │ 120 MB │ 3.6 KB      │ 8 MB         │
└─────────────────────────┴────────────┴────────┴─────────────┴──────────────┘

Growth Projections:
- Per case: 2.1 MB (average)
- 1,000 more cases: +2.1 GB
- 10,000 more cases: +21 GB
```

### 5.2 MongoDB Compass Analysis

**GUI Tool for Database Analysis:**

1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect using your MONGO_URI
3. View:
   - Real-time performance metrics
   - Collection sizes
   - Index usage
   - Query performance
   - Schema analysis

### 5.3 Manual MongoDB Commands

```bash
# Connect to your database
mongosh "your-connection-string"

# Database size
db.stats(1024*1024)  // Size in MB

# Collection stats
db.cases.stats(1024*1024)
db.leads.stats(1024*1024)
db.completeleadreturns.stats(1024*1024)

# Index sizes
db.cases.totalIndexSize(1024*1024)

# Document counts
db.cases.countDocuments()
db.leads.countDocuments()

# Average document size
db.cases.stats().avgObjSize

# List all collections with sizes
db.stats().dataSize / (1024*1024)
```

---

## 6. API Performance Testing

### 6.1 Individual Endpoint Testing

**Location:** `performance-tests/api-benchmark.js`

Tests specific endpoints for:
- Response time
- Throughput (requests/sec)
- Error rate
- Latency percentiles (p50, p95, p99)

#### Run API Benchmark

```bash
# Test specific endpoint
node performance-tests/api-benchmark.js /api/cases

# Test with authentication
node performance-tests/api-benchmark.js /api/lead/assignedTo-leads --token YOUR_JWT_TOKEN
```

### 6.2 Using Autocannon

```bash
# Install
npm install -g autocannon

# Basic test: 100 connections, 10 seconds
autocannon -c 100 -d 10 http://localhost:5000/test

# Advanced test with headers
autocannon -c 100 -d 30 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/cases

# Test POST endpoint
autocannon -c 50 -d 20 \
  -m POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -b '{"caseNo":"TEST001","caseName":"Test Case"}' \
  http://localhost:5000/api/cases
```

**Output Example:**
```
Running 10s test @ http://localhost:5000/test
100 connections

┌─────────┬───────┬───────┬───────┬───────┬──────────┬─────────┬───────┐
│ Stat    │ 2.5%  │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev   │ Max   │
├─────────┼───────┼───────┼───────┼───────┼──────────┼─────────┼───────┤
│ Latency │ 12 ms │ 45 ms │ 98 ms │ 145ms │ 52.3 ms  │ 28.4 ms │ 320ms │
└─────────┴───────┴───────┴───────┴───────┴──────────┴─────────┴───────┘

Req/Sec: 2,145
Bytes/Sec: 1.2 MB
```

### 6.3 Endpoint Performance Targets

| Endpoint Type | Target Response Time | Acceptable | Poor |
|--------------|---------------------|------------|------|
| Simple GET (list) | < 200ms | 200-500ms | > 500ms |
| Complex GET (with joins) | < 500ms | 500-1000ms | > 1000ms |
| POST/PUT (simple) | < 300ms | 300-700ms | > 700ms |
| File upload | < 2000ms | 2-5s | > 5s |
| PDF generation | < 3000ms | 3-8s | > 8s |
| Version snapshot | < 1000ms | 1-3s | > 3s |

---

## 7. Storage Analysis

### 7.1 Application Disk Usage

**Location:** `performance-tests/analyze-storage.js`

Analyzes:
- node_modules size
- Build artifacts size
- Log file sizes
- Temp upload directory
- Total application footprint

#### Run Storage Analysis

```bash
node performance-tests/analyze-storage.js
```

**Output Example:**
```
=== PIMS Storage Analysis ===

Application Storage:
- Backend source code: 2.5 MB
- Backend node_modules: 487 MB
- Frontend build: 13.2 MB
- Frontend node_modules: 623 MB
- Logs: 125 MB
- Temp uploads: 1.2 GB
- Total: 2.45 GB

File Storage (S3/Azure Blob):
- Total files: 12,345
- Total size: 45.6 GB
- Images: 23.4 GB (51%)
- Videos: 18.2 GB (40%)
- Documents: 3.5 GB (8%)
- Audio: 0.5 GB (1%)

Average per case: 37 MB
Average per lead: 3.7 MB
```

### 7.2 Manual Storage Check

```bash
# Windows
# Check current directory size
dir /s

# Check specific folders
du -sh backend/node_modules
du -sh frontend/build
du -sh backend/logs

# Check disk space
wmic logicaldisk get size,freespace,caption
```

```bash
# Linux/Mac
# Check directory sizes
du -sh backend/node_modules
du -sh frontend/build
du -sh backend/logs
du -sh backend/temp_uploads

# Check disk space
df -h

# Detailed file sizes
du -h --max-depth=1 . | sort -hr
```

### 7.3 S3 Bucket Size

```bash
# Using AWS CLI
aws s3 ls s3://your-bucket-name --recursive --summarize --human-readable

# Output will show:
# Total Objects: 12345
# Total Size: 45.6 GB
```

### 7.4 Azure Blob Storage Size

```powershell
# Using Azure CLI
az storage blob list --account-name YOUR_ACCOUNT --container-name YOUR_CONTAINER --query "[].{Name:name, Size:properties.contentLength}" --output table

# Get total size
az storage blob list --account-name YOUR_ACCOUNT --container-name YOUR_CONTAINER --query "sum([].properties.contentLength)" --output tsv
```

---

## 8. Interpreting Results

### 8.1 Performance Benchmarks

#### Excellent Performance ✅
- Response time < 200ms (95th percentile)
- CPU usage < 60% under load
- Memory usage < 70% of available
- Error rate < 0.1%
- Throughput > 1000 req/sec

#### Good Performance ⚠️
- Response time < 500ms (95th percentile)
- CPU usage < 80% under load
- Memory usage < 85% of available
- Error rate < 1%
- Throughput > 500 req/sec

#### Poor Performance ❌
- Response time > 1000ms (95th percentile)
- CPU usage > 90% under load
- Memory usage > 90% of available
- Error rate > 5%
- Throughput < 200 req/sec

### 8.2 Resource Sizing Guide

Based on your test results:

```javascript
// Calculate required resources
const concurrentUsers = 100;
const avgMemoryPerUser = 5; // MB
const baseMemory = 500; // MB for Node.js + dependencies

// Required Memory
const requiredMemory = baseMemory + (concurrentUsers * avgMemoryPerUser);
console.log(`Required RAM: ${requiredMemory} MB (${Math.ceil(requiredMemory/1024)} GB)`);

// Required CPU (rough estimate)
const avgCpuPerRequest = 0.01; // 1% CPU per request
const requestsPerSecond = 50; // from your load test
const requiredCpuCores = Math.ceil(requestsPerSecond * avgCpuPerRequest);
console.log(`Required CPUs: ${requiredCpuCores} cores`);
```

### 8.3 Database Sizing

```javascript
// From your database analysis
const casesCount = 1000;
const avgSizePerCase = 2.1; // MB from analysis

// Storage needed for target
const targetCases = 10000;
const storageNeeded = (targetCases / casesCount) * avgSizePerCase;
console.log(`Storage for ${targetCases} cases: ${storageNeeded} GB`);

// Add 20% buffer for indexes and growth
const recommendedStorage = storageNeeded * 1.2;
console.log(`Recommended: ${Math.ceil(recommendedStorage)} GB`);
```

### 8.4 Red Flags to Watch For

⚠️ **Memory Leaks:**
- Memory usage continuously increasing without stabilizing
- Memory not freed after load test ends
- `process.memoryUsage().heapUsed` always growing

⚠️ **CPU Bottlenecks:**
- CPU pegged at 100% consistently
- Request queue backing up
- Increasing response times under moderate load

⚠️ **Database Issues:**
- Slow queries (> 1 second)
- Connection pool exhaustion
- Index missing on frequently queried fields

⚠️ **Storage Concerns:**
- Disk usage > 80%
- Temp files not being cleaned up
- Logs consuming excessive space

### 8.5 Optimization Recommendations

Based on test results, apply these optimizations:

| Issue Found | Optimization |
|-------------|--------------|
| High memory usage | Implement Redis caching, optimize large queries |
| High CPU on PDF gen | Queue PDF generation, use worker threads |
| Slow database queries | Add indexes, use aggregation pipelines |
| Large file uploads | Implement chunked uploads, compress files |
| Memory leaks | Profile with clinic.js, fix event listener leaks |
| Slow response times | Enable response compression, use CDN |

---

## 9. Example Testing Session

### Complete Testing Workflow

```bash
# Step 1: Start application with monitoring
node performance-tests/monitor-resources.js > baseline-monitor.txt &
cd backend && npm start

# Step 2: Run database size analysis (baseline)
node performance-tests/analyze-db-size.js > baseline-db.txt

# Step 3: Run storage analysis
node performance-tests/analyze-storage.js > baseline-storage.txt

# Step 4: Run light load test (50 users)
artillery run performance-tests/artillery-load-test.yml --output light-load.json

# Step 5: Generate report
artillery report light-load.json

# Step 6: Check resource usage during test
cat baseline-monitor.txt | grep "CPU Usage"
cat baseline-monitor.txt | grep "Memory:"

# Step 7: Run heavy load test (100 users)
artillery run performance-tests/artillery-heavy-load.yml --output heavy-load.json

# Step 8: Compare results
artillery report heavy-load.json

# Step 9: Database size after load
node performance-tests/analyze-db-size.js > after-load-db.txt

# Step 10: Compare baseline vs after load
diff baseline-db.txt after-load-db.txt
```

### Expected Results Analysis

```
Light Load (50 concurrent users):
- CPU: 40-60%
- Memory: 2-3 GB
- Response time: 100-300ms (p95)
- Throughput: 500-800 req/sec

Heavy Load (100 concurrent users):
- CPU: 70-85%
- Memory: 3-5 GB
- Response time: 200-600ms (p95)
- Throughput: 800-1200 req/sec

If your results are significantly different:
- Lower performance → Need more resources
- Higher performance → Can optimize resource allocation
```

---

## 10. Continuous Performance Testing

### 10.1 Automated Testing Schedule

Add to your CI/CD pipeline:

```yaml
# .github/workflows/performance-test.yml
name: Performance Tests
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install -g artillery
      - name: Run load test
        run: artillery run performance-tests/artillery-load-test.yml --output results.json
      - name: Generate report
        run: artillery report results.json
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: performance-results
          path: results.html
```

### 10.2 Performance Monitoring Dashboard

Consider setting up:
- **Grafana + Prometheus** for real-time metrics
- **Azure Application Insights** for production monitoring
- **DataDog** or **New Relic** for comprehensive monitoring

---

## 11. Troubleshooting

### Common Issues

**Issue: "Cannot find module 'artillery'"**
```bash
Solution: npm install -g artillery
```

**Issue: "Connection refused on port 5000"**
```bash
Solution: Ensure backend server is running
cd backend && npm start
```

**Issue: "Authentication failed" in load tests**
```bash
Solution: Update JWT token in artillery config
1. Login and get fresh token
2. Update artillery-load-test.yml with token
```

**Issue: "Out of memory" during tests**
```bash
Solution: Increase Node.js memory limit
node --max-old-space-size=4096 performance-tests/monitor-resources.js
```

---

## Conclusion

These tools will help you:
1. ✅ Measure actual resource usage under realistic load
2. ✅ Identify performance bottlenecks
3. ✅ Calculate accurate cloud resource requirements
4. ✅ Optimize before production deployment
5. ✅ Make data-driven infrastructure decisions

**Next Steps:**
1. Run baseline tests with current data
2. Record results in a spreadsheet
3. Run load tests with simulated traffic
4. Compare against targets in Section 8.1
5. Size your cloud resources based on Section 8.2
6. Implement optimizations from Section 8.5

---

**Document Version:** 1.0
**Last Updated:** January 20, 2026
