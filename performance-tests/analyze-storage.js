/**
 * PIMS Storage Analysis Script
 * Analyzes disk space usage for application, dependencies, and files
 *
 * Usage: node analyze-storage.js
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Format bytes to human readable
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    if (bytes === null || bytes === undefined) return 'N/A';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dirPath) {
    let size = 0;

    try {
        if (!fs.existsSync(dirPath)) {
            return 0;
        }

        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                size += getDirectorySize(filePath);
            } else {
                size += stats.size;
            }
        });
    } catch (error) {
        console.error(`  Error reading ${dirPath}: ${error.message}`);
    }

    return size;
}

/**
 * Count files in directory
 */
function countFiles(dirPath) {
    let count = 0;

    try {
        if (!fs.existsSync(dirPath)) {
            return 0;
        }

        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                count += countFiles(filePath);
            } else {
                count++;
            }
        });
    } catch (error) {
        // Ignore errors for inaccessible directories
    }

    return count;
}

/**
 * Get file type distribution in directory
 */
function getFileTypeDistribution(dirPath) {
    const distribution = {};

    try {
        if (!fs.existsSync(dirPath)) {
            return distribution;
        }

        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                const subDist = getFileTypeDistribution(filePath);
                Object.keys(subDist).forEach(ext => {
                    distribution[ext] = (distribution[ext] || 0) + subDist[ext];
                });
            } else {
                const ext = path.extname(file).toLowerCase() || 'no-extension';
                distribution[ext] = (distribution[ext] || 0) + stats.size;
            }
        });
    } catch (error) {
        // Ignore errors
    }

    return distribution;
}

/**
 * Main analysis function
 */
async function analyzeStorage() {
    console.log('\n' + '='.repeat(70));
    console.log('  PIMS STORAGE ANALYSIS');
    console.log('='.repeat(70) + '\n');

    const rootDir = path.join(__dirname, '..');

    // Directories to analyze
    const directories = [
        { name: 'Backend Source', path: path.join(rootDir, 'backend', 'src') },
        { name: 'Backend node_modules', path: path.join(rootDir, 'backend', 'node_modules') },
        { name: 'Frontend Source', path: path.join(rootDir, 'frontend', 'src') },
        { name: 'Frontend Build', path: path.join(rootDir, 'frontend', 'build') },
        { name: 'Frontend node_modules', path: path.join(rootDir, 'frontend', 'node_modules') },
        { name: 'Backend Logs', path: path.join(rootDir, 'backend', 'logs') },
        { name: 'Temp Uploads', path: path.join(rootDir, 'backend', 'temp_uploads') },
        { name: 'Uploads', path: path.join(rootDir, 'backend', 'uploads') },
    ];

    console.log('─'.repeat(70));
    console.log('  APPLICATION STORAGE');
    console.log('─'.repeat(70));

    let totalSize = 0;
    const results = [];

    for (const dir of directories) {
        const size = getDirectorySize(dir.path);
        const fileCount = countFiles(dir.path);

        totalSize += size;

        results.push({
            name: dir.name,
            size: size,
            files: fileCount
        });

        console.log(`  ${dir.name.padEnd(25)} ${formatBytes(size).padStart(12)}  (${fileCount.toLocaleString()} files)`);
    }

    console.log('─'.repeat(70));
    console.log(`  Total Application Size:    ${formatBytes(totalSize)}`);
    console.log('─'.repeat(70));

    // Analyze uploads directory file types
    const uploadsPath = path.join(rootDir, 'backend', 'uploads');
    if (fs.existsSync(uploadsPath)) {
        console.log('\n─'.repeat(70));
        console.log('  FILE TYPE DISTRIBUTION (Uploads)');
        console.log('─'.repeat(70));

        const distribution = getFileTypeDistribution(uploadsPath);
        const sortedTypes = Object.entries(distribution).sort((a, b) => b[1] - a[1]);

        let totalUploadSize = 0;
        sortedTypes.forEach(([ext, size]) => {
            totalUploadSize += size;
        });

        sortedTypes.slice(0, 10).forEach(([ext, size]) => {
            const percentage = ((size / totalUploadSize) * 100).toFixed(1);
            console.log(`  ${ext.padEnd(15)} ${formatBytes(size).padStart(12)}  (${percentage}%)`);
        });

        console.log('─'.repeat(70));
    }

    // Disk space analysis
    console.log('\n─'.repeat(70));
    console.log('  DISK SPACE ANALYSIS');
    console.log('─'.repeat(70));

    try {
        if (process.platform === 'win32') {
            const { stdout } = await execPromise('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace,DeviceID');
            const lines = stdout.trim().split('\n');
            if (lines.length > 1) {
                const data = lines[1].trim().split(/\s+/);
                const deviceId = data[0];
                const freeSpace = parseInt(data[1]);
                const totalSpace = parseInt(data[2]);
                const usedSpace = totalSpace - freeSpace;

                console.log(`  Drive:          ${deviceId}`);
                console.log(`  Total:          ${formatBytes(totalSpace)}`);
                console.log(`  Used:           ${formatBytes(usedSpace)} (${((usedSpace / totalSpace) * 100).toFixed(1)}%)`);
                console.log(`  Free:           ${formatBytes(freeSpace)} (${((freeSpace / totalSpace) * 100).toFixed(1)}%)`);
            }
        } else {
            const { stdout } = await execPromise('df -h / | tail -1');
            const parts = stdout.trim().split(/\s+/);
            console.log(`  Total:          ${parts[1]}`);
            console.log(`  Used:           ${parts[2]} (${parts[4]})`);
            console.log(`  Free:           ${parts[3]}`);
        }
    } catch (error) {
        console.log(`  Could not retrieve disk space: ${error.message}`);
    }

    console.log('─'.repeat(70));

    // Size breakdown by category
    console.log('\n─'.repeat(70));
    console.log('  SIZE BREAKDOWN');
    console.log('─'.repeat(70));

    const sourceSize = results.find(r => r.name === 'Backend Source')?.size || 0 +
                       results.find(r => r.name === 'Frontend Source')?.size || 0;
    const dependenciesSize = results.find(r => r.name === 'Backend node_modules')?.size || 0 +
                            results.find(r => r.name === 'Frontend node_modules')?.size || 0;
    const buildSize = results.find(r => r.name === 'Frontend Build')?.size || 0;
    const dataSize = results.find(r => r.name === 'Temp Uploads')?.size || 0 +
                     results.find(r => r.name === 'Uploads')?.size || 0 +
                     results.find(r => r.name === 'Backend Logs')?.size || 0;

    console.log(`  Source Code:         ${formatBytes(sourceSize).padStart(12)}  (${((sourceSize / totalSize) * 100).toFixed(1)}%)`);
    console.log(`  Dependencies:        ${formatBytes(dependenciesSize).padStart(12)}  (${((dependenciesSize / totalSize) * 100).toFixed(1)}%)`);
    console.log(`  Build Artifacts:     ${formatBytes(buildSize).padStart(12)}  (${((buildSize / totalSize) * 100).toFixed(1)}%)`);
    console.log(`  Data & Logs:         ${formatBytes(dataSize).padStart(12)}  (${((dataSize / totalSize) * 100).toFixed(1)}%)`);
    console.log('─'.repeat(70));

    // Deployment size estimate
    console.log('\n─'.repeat(70));
    console.log('  DEPLOYMENT SIZE ESTIMATES');
    console.log('─'.repeat(70));

    const backendDeploy = (results.find(r => r.name === 'Backend Source')?.size || 0) +
                          (results.find(r => r.name === 'Backend node_modules')?.size || 0);
    const frontendDeploy = results.find(r => r.name === 'Frontend Build')?.size || 0;

    console.log(`  Backend Deployment:  ${formatBytes(backendDeploy)}`);
    console.log(`  Frontend Deployment: ${formatBytes(frontendDeploy)}`);
    console.log(`  Total Deployment:    ${formatBytes(backendDeploy + frontendDeploy)}`);
    console.log('─'.repeat(70));

    // Recommendations
    console.log('\n─'.repeat(70));
    console.log('  STORAGE RECOMMENDATIONS');
    console.log('─'.repeat(70));

    const minDisk = Math.ceil((totalSize * 2) / (1024 * 1024 * 1024)); // 2x current, in GB
    const recDisk = Math.ceil((totalSize * 5) / (1024 * 1024 * 1024)); // 5x current, in GB
    const prodDisk = Math.ceil((totalSize * 10) / (1024 * 1024 * 1024)); // 10x current, in GB

    console.log(`  Current Usage:       ${formatBytes(totalSize)}`);
    console.log(`  Minimum Disk:        ${minDisk} GB (2x current usage)`);
    console.log(`  Recommended Disk:    ${recDisk} GB (5x current usage)`);
    console.log(`  Production Disk:     ${prodDisk} GB (10x current usage)`);
    console.log('─'.repeat(70));

    // Optimization tips
    console.log('\n─'.repeat(70));
    console.log('  OPTIMIZATION TIPS');
    console.log('─'.repeat(70));

    if (dependenciesSize > 500 * 1024 * 1024) {
        console.log('  ⚠️  Large node_modules detected. Consider:');
        console.log('      - Removing unused dependencies');
        console.log('      - Using production builds (npm prune --production)');
    }

    if (dataSize > 1024 * 1024 * 1024) {
        console.log('  ⚠️  Large data/logs detected. Consider:');
        console.log('      - Implementing log rotation');
        console.log('      - Cleaning temp upload directories regularly');
        console.log('      - Moving uploads to S3/Azure Blob Storage');
    }

    if (buildSize > 50 * 1024 * 1024) {
        console.log('  ⚠️  Large frontend build. Consider:');
        console.log('      - Code splitting');
        console.log('      - Tree shaking unused imports');
        console.log('      - Compressing assets');
    }

    console.log('─'.repeat(70));

    console.log('\n' + '='.repeat(70));
    console.log('  Analysis Complete');
    console.log('='.repeat(70) + '\n');
}

// Run analysis
analyzeStorage().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
});
