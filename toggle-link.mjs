#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the vibe package directory
const vibeDir = resolve(__dirname);
const vibePackageJson = JSON.parse(readFileSync(resolve(vibeDir, 'package.json'), 'utf-8'));
const vibeVersion = vibePackageJson.version;

// Get the current working directory (where the script is run from)
const cwd = process.cwd();
const targetPackageJsonPath = resolve(cwd, 'package.json');

try {
    const targetPackageJson = JSON.parse(readFileSync(targetPackageJsonPath, 'utf-8'));

    // Check if @wyxos/vibe exists in dependencies or devDependencies
    const deps = { ...targetPackageJson.dependencies, ...targetPackageJson.devDependencies };
    const currentVibeRef = deps['@wyxos/vibe'];

    if (!currentVibeRef) {
        console.error('❌ @wyxos/vibe not found in package.json dependencies or devDependencies');
        process.exit(1);
    }

    // Determine if it's a local path or version reference
    const isLocalPath = currentVibeRef.startsWith('file:') || currentVibeRef.startsWith('../') || currentVibeRef.startsWith('./');

    let newRef;
    let action;

    if (isLocalPath) {
        // Switch to published version
        newRef = `^${vibeVersion}`;
        action = 'published version';
    } else {
        // Switch to local path
        // Calculate relative path from target to vibe
        const relativePath = relative(cwd, vibeDir).replace(/\\/g, '/');
        newRef = `file:${relativePath}`;
        action = 'local path';
    }

    // Update package.json
    if (targetPackageJson.dependencies && targetPackageJson.dependencies['@wyxos/vibe']) {
        targetPackageJson.dependencies['@wyxos/vibe'] = newRef;
    }
    if (targetPackageJson.devDependencies && targetPackageJson.devDependencies['@wyxos/vibe']) {
        targetPackageJson.devDependencies['@wyxos/vibe'] = newRef;
    }

    // Write updated package.json
    writeFileSync(
        targetPackageJsonPath,
        JSON.stringify(targetPackageJson, null, 2) + '\n',
        'utf-8'
    );

    console.log(`✅ Switched @wyxos/vibe to ${action}: ${newRef}`);

    // If switching to local path, ensure the library is built before installation
    if (action === 'local path') {
        try {
            console.log('🔧 Building local @wyxos/vibe (build:lib)...');
            execSync('npm run build:lib', { cwd: vibeDir, stdio: 'inherit' });
        } catch (e) {
            console.warn('⚠️ Failed to build local @wyxos/vibe. Attempting install anyway.');
        }
    }

    // Run npm install
    console.log('📦 Running npm install...');
    execSync('npm install', { cwd, stdio: 'inherit' });

    console.log('✨ Done!');

} catch (error) {
    if (error.code === 'ENOENT') {
        console.error(`❌ package.json not found in ${cwd}`);
        console.error('   Make sure you run this script from a project directory that uses @wyxos/vibe');
    } else {
        console.error('❌ Error:', error.message);
    }
    process.exit(1);
}

