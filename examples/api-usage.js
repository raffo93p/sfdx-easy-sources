/**
 * Example: Using sfdx-easy-sources API in a Node.js script
 * 
 * This demonstrates how to use the complete profiles API programmatically
 * with automatic path resolution from easysources-settings.json.
 */

// Import the profiles API namespace and individual functions
// When using as an installed package, use: require('sfdx-easy-sources')
// When running from the project directory, use the relative path:
const { profiles } = require('../lib/index.js');

// You can also import individual functions directly for more flexibility:
const { 
    profileSplit, 
    profileUpsert, 
    profileMerge, 
    profileMinify,
    profileDelete,
    profileClean,
    profileClearEmpty,
    profileAreAligned,
    profileUpdateKey 
} = require('../lib/index.js');

async function main() {
    try {
        console.log('=== Testing sfdx-easy-sources Complete Profile API ===\n');
        
        // Note: All methods use automatic path resolution from easysources-settings.json
        // You only need to specify what you want to override!

        // === Core Operations ===
        
        // Example 1: Split profiles using namespace API
        console.log('1. Splitting Admin profile with namespace API...');
        try {
            // Minimal options - paths auto-resolved from settings file
            const splitResult = await profiles.split({
                input: 'Admin',
                ignoreuserperm: 'true'
            });
            console.log('✓ Result:', splitResult.outputString);
        } catch (error) {
            console.log('⚠ Expected error (no profiles directory):', error.message || 'Input folder does not exist');
            console.log('  → In a real project, this would split your profile XML files into CSV files');
        }

        // Example 2: Upsert using direct function import
        console.log('\n2. Upserting profile changes using direct function...');
        try {
            // Override specific path while using settings for others
            const upsertResult = await profileUpsert({
                'sf-xml': './custom-source-path', // Override this path
                ignoreuserperm: 'false'          // Use settings for 'es-csv' path
            });
            console.log('✓ Result:', upsertResult.outputString);
        } catch (error) {
            console.log('⚠ Expected error (no profiles directory):', error.message || 'Input folder does not exist');
            console.log('  → Upserts new XML data into existing CSV files');
        }

        // Example 3: Merge back to XML
        console.log('\n3. Merging CSV files back to XML format...');
        try {
            const mergeResult = await profiles.merge({
                input: 'Admin,Standard User'
            });
            console.log('✓ Result:', mergeResult.result);
        } catch (error) {
            console.log('⚠ Expected error (no CSV directory):', error.message || 'Input folder does not exist');
            console.log('  → Merges CSV files back to deployable XML format');
        }

        // === Maintenance Operations ===

        // Example 4: Minify profiles (remove false-only permissions)
        console.log('\n4. Minifying profiles to remove unnecessary entries...');
        try {
            const minifyResult = await profiles.minify({
                input: 'Admin'
            });
            console.log('✓ Result:', minifyResult.outputString);
        } catch (error) {
            console.log('⚠ Expected error:', error.message || 'Input folder does not exist');
            console.log('  → Removes CSV entries with only false permission values');
        }

        // Example 5: Clean profiles (remove non-existent metadata references)
        console.log('\n5. Cleaning profiles against org metadata...');
        try {
            const cleanResult = await profileClean({
                orgname: 'myorg',
                target: 'org',
                mode: 'log' // Options: 'interactive', 'log', 'clean'
            });
            console.log('✓ Result:', cleanResult.outputString);
        } catch (error) {
            console.log('⚠ Expected error:', error.message || 'Org connection or input folder issue');
            console.log('  → Removes references to metadata that no longer exists in target org');
        }

        // Example 6: Delete specific permissions
        console.log('\n6. Deleting specific field permissions...');
        try {
            const deleteResult = await profiles.delete({
                input: 'Admin,Standard User',
                type: 'fieldPermissions',
                tagid: 'Account.DeprecatedField__c'
            });
            console.log('✓ Result:', deleteResult.outputString);
        } catch (error) {
            console.log('⚠ Expected error:', error.message || 'Input folder does not exist');
            console.log('  → Bulk deletes specific permissions across multiple profiles');
        }

        // Example 7: Clear empty CSV files
        console.log('\n7. Clearing empty CSV files and folders...');
        try {
            const clearResult = await profiles.clearEmpty();
            console.log('✓ Result:', clearResult.outputString);
            console.log(`  Files deleted: ${clearResult.deletedFiles}, Folders deleted: ${clearResult.deletedFolders}`);
        } catch (error) {
            console.log('⚠ Expected error:', error.message || 'Input folder does not exist');
            console.log('  → Removes empty CSV files and directories to keep repository clean');
        }

        // === Advanced Operations ===

        // Example 8: Check alignment between XML and CSV
        console.log('\n8. Checking alignment between XML and CSV files...');
        try {
            const alignedResult = await profiles.areAligned({
                input: 'Admin'
            });
            console.log(`✓ Alignment check: ${alignedResult.alignedItems}/${alignedResult.totalItems} items aligned`);
            if (alignedResult.misalignedItems > 0) {
                console.log('  ⚠ Some items are misaligned - check the results for details');
            }
        } catch (error) {
            console.log('⚠ Expected error:', error.message || 'Input folder does not exist');
            console.log('  → Verifies that XML and CSV files are properly synchronized');
        }

        // Example 9: Update keys across CSV files
        console.log('\n9. Updating field reference keys...');
        try {
            const updateResult = await profileUpdateKey({
                input: 'Admin'
            });
            console.log('✓ Key update completed');
        } catch (error) {
            console.log('⚠ Expected error:', error.message || 'Input folder does not exist');
            console.log('  → Updates metadata references when fields/objects are renamed');
        }

        // === Complete Workflow Example ===
        console.log('\n=== Complete Workflow Demonstration ===');
        console.log('This is how you might use the API in a real automation script:');
        
        console.log(`
// Complete profile management workflow
async function automateProfileManagement() {
    // 1. Split profiles for editing
    await profiles.split({ input: 'Admin,Standard User', ignoreuserperm: 'true' });
    
    // 2. Clean against org metadata
    await profiles.clean({ orgname: 'production', target: 'org' });
    
    // 3. Remove unnecessary entries
    await profiles.minify();
    
    // 4. Clean up empty files
    await profiles.clearEmpty();
    
    // 5. Merge back to XML for deployment
    await profiles.merge();
    
    // 6. Verify everything is aligned
    const aligned = await profiles.areAligned();
    console.log(\`\${aligned.alignedItems}/\${aligned.totalItems} profiles aligned\`);
}
        `);

        console.log('\n=== All API demonstrations completed ===');
        console.log('\n💡 Key Benefits:');
        console.log('  • Automatic path resolution from easysources-settings.json');
        console.log('  • Complete profile lifecycle management');
        console.log('  • Both namespace (profiles.method) and direct function imports');
        console.log('  • Minimal configuration required');
        console.log('  • Full TypeScript support available');
        
    } catch (error) {
        console.error('Unexpected error:', error.message);
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    main();
}

module.exports = { main };
