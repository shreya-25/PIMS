/**
 * PIMS Resource Monitoring Script
 * Monitors CPU, Memory, Disk, and Network usage in real-time
 *
 * Usage: node monitor-resources.js [interval_seconds]
 * Example: node monitor-resources.js 5
 */

const os = require('os');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const INTERVAL_SECONDS = process.argv[2] || 5;
const INTERVAL_MS = INTERVAL_SECONDS * 1000;

// Track previous values for delta calculations
let previousNetworkStats = null;
let previousCpuInfo = null;
let startTime = Date.now();

/**
 * Get CPU usage percentage
 */
function getCPUUsage() {
    const cpus = os.cpus();

    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;

    if (previousCpuInfo) {
        const idleDifference = idle - previousCpuInfo.idle;
        const totalDifference = total - previousCpuInfo.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);

        previousCpuInfo = { idle, total };
        return percentageCPU;
    }

    previousCpuInfo = { idle, total };
    return 0;
}

/**
 * Get memory usage
 */
function getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
        total: (totalMem / 1024 / 1024).toFixed(0), // MB
        used: (usedMem / 1024 / 1024).toFixed(0), // MB
        free: (freeMem / 1024 / 1024).toFixed(0), // MB
        percentage: ((usedMem / totalMem) * 100).toFixed(1)
    };
}

/**
 * Get Node.js process memory
 */
function getProcessMemory() {
    const usage = process.memoryUsage();

    return {
        rss: (usage.rss / 1024 / 1024).toFixed(1), // MB
        heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(1), // MB
        heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(1), // MB
        external: (usage.external / 1024 / 1024).toFixed(1) // MB
    };
}

/**
 * Get disk usage (platform-specific)
 */
async function getDiskUsage() {
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execPromise('wmic logicaldisk get size,freespace,caption');
            const lines = stdout.trim().split('\n').filter(line => line.includes('C:'));

            if (lines.length > 0) {
                const parts = lines[0].trim().split(/\s+/);
                const freespace = parseInt(parts[1]);
                const total = parseInt(parts[2]);
                const used = total - freespace;

                return {
                    total: (total / 1024 / 1024 / 1024).toFixed(1), // GB
                    used: (used / 1024 / 1024 / 1024).toFixed(1), // GB
                    free: (freespace / 1024 / 1024 / 1024).toFixed(1), // GB
                    percentage: ((used / total) * 100).toFixed(1)
                };
            }
        } else {
            // Linux/Mac
            const { stdout } = await execPromise('df -h / | tail -1');
            const parts = stdout.trim().split(/\s+/);

            return {
                total: parts[1],
                used: parts[2],
                free: parts[3],
                percentage: parts[4].replace('%', '')
            };
        }
    } catch (error) {
        return {
            total: 'N/A',
            used: 'N/A',
            free: 'N/A',
            percentage: 'N/A'
        };
    }
}

/**
 * Get network statistics
 */
function getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    let stats = {
        bytesReceived: 0,
        bytesSent: 0
    };

    // Note: os.networkInterfaces() doesn't provide traffic stats
    // For real network monitoring, you'd need platform-specific commands
    // This is a placeholder for structure

    return stats;
}

/**
 * Get active Node.js connections (if running as server)
 */
async function getActiveConnections() {
    try {
        if (process.platform === 'win32') {
            const { stdout } = await execPromise('netstat -an | find "ESTABLISHED" | find ":5000"');
            const connections = stdout.trim().split('\n').filter(line => line).length;
            return connections;
        } else {
            const { stdout } = await execPromise('netstat -an | grep ESTABLISHED | grep :5000 | wc -l');
            return parseInt(stdout.trim());
        }
    } catch (error) {
        return 0;
    }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

/**
 * Print system info header
 */
function printHeader() {
    console.log('\n' + '='.repeat(70));
    console.log('  PIMS RESOURCE MONITOR');
    console.log('='.repeat(70));
    console.log(`  System: ${os.type()} ${os.release()}`);
    console.log(`  Hostname: ${os.hostname()}`);
    console.log(`  CPUs: ${os.cpus().length} x ${os.cpus()[0].model}`);
    console.log(`  Total RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`  Node Version: ${process.version}`);
    console.log(`  Monitoring Interval: ${INTERVAL_SECONDS} seconds`);
    console.log('='.repeat(70));
    console.log('  Press Ctrl+C to stop monitoring\n');
}

/**
 * Main monitoring loop
 */
async function monitor() {
    const cpuUsage = getCPUUsage();
    const memUsage = getMemoryUsage();
    const processMemory = getProcessMemory();
    const diskUsage = await getDiskUsage();
    const activeConnections = await getActiveConnections();
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    console.log(`\n[${new Date().toISOString()}] Uptime: ${uptime}s`);
    console.log('─'.repeat(70));

    // CPU
    console.log(`  CPU Usage:        ${cpuUsage.toFixed(1)}%`);

    // System Memory
    console.log(`  System Memory:    ${memUsage.used} MB / ${memUsage.total} MB (${memUsage.percentage}%)`);
    console.log(`  Free Memory:      ${memUsage.free} MB`);

    // Process Memory
    console.log(`  Process Memory:`);
    console.log(`    RSS:            ${processMemory.rss} MB (Resident Set Size)`);
    console.log(`    Heap Used:      ${processMemory.heapUsed} MB / ${processMemory.heapTotal} MB`);
    console.log(`    External:       ${processMemory.external} MB`);

    // Disk
    console.log(`  Disk Usage:       ${diskUsage.used} GB / ${diskUsage.total} GB (${diskUsage.percentage}%)`);
    console.log(`  Free Disk:        ${diskUsage.free} GB`);

    // Network
    console.log(`  Active Connections: ${activeConnections} (on port 5000)`);

    // Load average (not available on Windows)
    if (process.platform !== 'win32') {
        const loadavg = os.loadavg();
        console.log(`  Load Average:     ${loadavg[0].toFixed(2)}, ${loadavg[1].toFixed(2)}, ${loadavg[2].toFixed(2)}`);
    }

    // Warning indicators
    if (cpuUsage > 80) {
        console.log(`  ⚠️  WARNING: High CPU usage (${cpuUsage.toFixed(1)}%)`);
    }
    if (parseFloat(memUsage.percentage) > 85) {
        console.log(`  ⚠️  WARNING: High memory usage (${memUsage.percentage}%)`);
    }
    if (diskUsage.percentage !== 'N/A' && parseFloat(diskUsage.percentage) > 80) {
        console.log(`  ⚠️  WARNING: High disk usage (${diskUsage.percentage}%)`);
    }

    console.log('─'.repeat(70));
}

/**
 * Start monitoring
 */
async function startMonitoring() {
    printHeader();

    // Initial CPU measurement
    getCPUUsage();

    // Wait a bit for first accurate reading
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run first monitor
    await monitor();

    // Set interval for continuous monitoring
    setInterval(async () => {
        await monitor();
    }, INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n' + '='.repeat(70));
    console.log('  Monitoring stopped');
    console.log('='.repeat(70) + '\n');
    process.exit(0);
});

// Start the monitor
startMonitoring().catch(error => {
    console.error('Error starting monitor:', error);
    process.exit(1);
});
