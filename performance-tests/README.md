# PIMS Performance Testing Suite

This directory contains scripts and tools to test and measure resource utilization for the PIMS application.

## Quick Start

### 1. Install Dependencies

```bash
cd performance-tests
npm install

# Install Artillery globally (optional, for easier use)
npm install -g artillery
```

### 2. Run Tests

```bash
# Monitor system resources in real-time
npm run monitor

# Analyze database size
npm run db-analyze

# Analyze storage usage
npm run storage-analyze

# Run load test
npm run load-test

# Run load test with HTML report
npm run load-test-report

# Quick performance test
npm run quick-test
```

## Available Scripts

### Resource Monitoring
```bash
# Monitor every 5 seconds (default)
node monitor-resources.js

# Monitor every 10 seconds
node monitor-resources.js 10

# Save output to file
node monitor-resources.js > monitoring-log.txt
```

**Output:**
- CPU usage (%)
- System memory usage
- Process memory (heap)
- Disk usage
- Active connections
- Performance warnings

### Database Size Analysis
```bash
npm run db-analyze
```

**Analyzes:**
- Total database size
- Per-collection statistics
- Average document sizes
- Index overhead
- Growth projections
- Storage recommendations

### Storage Analysis
```bash
npm run storage-analyze
```

**Analyzes:**
- Application code size
- Dependencies (node_modules)
- Build artifacts
- Upload directories
- File type distribution
- Disk space usage
- Deployment size estimates

### Load Testing
```bash
# Basic load test
npm run load-test

# With HTML report
npm run load-test-report

# Quick test (50 users, 100 requests)
npm run quick-test
```

**Tests:**
- User authentication
- Browse cases/leads
- Search operations
- Heavy queries
- API response times
- Error rates
- Throughput

## Load Test Scenarios

The Artillery load test simulates realistic user behavior:

1. **Warm-up Phase** (1 min): 5 users/sec
2. **Normal Load** (5 min): 20 users/sec
3. **Peak Load** (2 min): 50 users/sec
4. **Cool Down** (1 min): 5 users/sec

### Test Scenarios:
- Public endpoints (20%)
- User authentication (30%)
- Browse cases (25%)
- View leads (20%)
- Heavy operations (5%)

## Performance Targets

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Response Time (p95) | < 200ms | 200-500ms | > 500ms |
| CPU Usage | < 60% | 60-80% | > 80% |
| Memory Usage | < 70% | 70-85% | > 85% |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| Throughput | > 1000 req/s | 500-1000 req/s | < 500 req/s |

## Example Testing Workflow

```bash
# Terminal 1: Start monitoring
node monitor-resources.js > monitor.log

# Terminal 2: Start your application
cd ../backend
npm start

# Terminal 3: Run tests
cd ../performance-tests

# 1. Baseline measurements
npm run storage-analyze > baseline-storage.txt
npm run db-analyze > baseline-db.txt

# 2. Run load test
npm run load-test-report

# 3. Analyze results
cat monitor.log | grep "CPU Usage"
cat monitor.log | grep "Memory:"

# 4. Compare with targets
artillery report report.json
```

## Interpreting Results

### Good Performance ✅
- Response time < 500ms (95th percentile)
- CPU < 80% under load
- Memory < 85%
- Error rate < 1%

### Needs Optimization ⚠️
- Response time 500-1000ms
- CPU 80-90%
- Memory 85-95%
- Error rate 1-5%

### Critical Issues ❌
- Response time > 1000ms
- CPU > 90%
- Memory > 95%
- Error rate > 5%

## Resource Sizing Guide

Based on test results, calculate required resources:

```javascript
// From your load test
const concurrentUsers = 100;
const avgMemoryPerUser = 5; // MB
const baseMemory = 500; // MB

// Required Memory
const requiredMemory = baseMemory + (concurrentUsers * avgMemoryPerUser);
// = 1000 MB (1 GB)

// Recommended (with buffer)
const recommendedMemory = requiredMemory * 1.5;
// = 1.5 GB

// Production (with headroom)
const productionMemory = requiredMemory * 2;
// = 2 GB
```

## Common Issues

### Issue: Artillery not found
```bash
npm install -g artillery
```

### Issue: Cannot connect to database
- Check `.env` file in backend directory
- Ensure MONGO_URI or COSMOS_URI is set
- Database must be running

### Issue: Backend not responding
- Ensure backend server is running on port 5000
- Check firewall settings
- Verify no port conflicts

### Issue: High memory usage
- Close other applications
- Check for memory leaks with `clinic.js`
- Optimize database queries
- Enable caching

## Additional Tools

### Install Autocannon (HTTP benchmarking)
```bash
npm install -g autocannon

# Test endpoint
autocannon -c 100 -d 30 http://localhost:5000/test
```

### Install Clinic.js (Node.js profiling)
```bash
npm install -g clinic

# Profile your application
clinic doctor -- node ../backend/src/server.js
```

## File Structure

```
performance-tests/
├── README.md                    # This file
├── package.json                 # NPM scripts and dependencies
├── monitor-resources.js         # System resource monitor
├── analyze-db-size.js          # Database size analyzer
├── analyze-storage.js          # Storage analyzer
├── artillery-load-test.yml     # Load test configuration
└── test-data.csv               # Test data (optional)
```

## Next Steps

1. Run all baseline tests
2. Document results in spreadsheet
3. Run load tests at different scales
4. Compare against cloud resource estimates
5. Optimize based on findings
6. Re-test and validate improvements

## Support

For detailed instructions, see:
- [PERFORMANCE_TESTING_GUIDE.md](../PERFORMANCE_TESTING_GUIDE.md)
- [CLOUD_RESOURCE_REQUIREMENTS.md](../CLOUD_RESOURCE_REQUIREMENTS.md)

---

**Last Updated:** January 20, 2026
