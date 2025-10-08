# API Documentation

This document describes how to use `sfdx-easy-sources` programmatically in your Node.js applications.

## Installation

```bash
npm install sfdx-easy-sources
# or
yarn add sfdx-easy-sources
```

## Quick Start

### JavaScript

```javascript
const { profiles } = require('sfdx-easy-sources');

async function main() {
    // Split profiles into CSV files
    await profiles.split({
        'sf-xml': './force-app/main/default',
        'es-csv': './easysources'
    });
    
    // Merge CSV files back to XML
    await profiles.merge({
        'es-csv': './easysources',
        'sf-xml': './force-app/main/default'
    });
}

main().catch(console.error);
```

### TypeScript

```typescript
import { profiles, ProfileOptions } from 'sfdx-easy-sources';

async function main() {
    const options: ProfileOptions = {
        'sf-xml': './force-app/main/default',
        'es-csv': './easysources'
    };
    
    await profiles.split(options);
    await profiles.merge(options);
}

main().catch(console.error);
```

## API Reference

### Profile API

The profile API provides programmatic access to all profile-related operations.

#### Import

```typescript
import { profiles } from 'sfdx-easy-sources';
// or
const { profiles } = require('sfdx-easy-sources');

// You can also import individual functions
import { profileSplit, profileMerge } from 'sfdx-easy-sources';
```

#### Common Types

##### ProfileOptions

```typescript
interface ProfileOptions {
    'sf-xml'?: string;        // Path to Salesforce XML metadata folder
    'es-csv'?: string;        // Path to EasySources CSV output folder
    input?: string;           // Comma-separated list of specific profiles
    ignoreuserperm?: string;  // 'true' to ignore user permissions
}
```

#### Methods

All profile API methods now support **automatic path resolution**. You can:
- Use settings file for default paths and specify only what you need
- Override specific paths while using settings for others  
- Pass complete path configurations if preferred

**Automatic Path Resolution:**
1. Uses paths from options if provided
2. Falls back to `easysources-settings.json` file if it exists  
3. Uses default paths as final fallback

**Examples:**
```typescript
// Minimal usage - paths auto-resolved from settings
await profiles.split({ input: 'Admin' });

// Override specific paths
await profiles.split({
    input: 'Admin',
    'sf-xml': './custom-path'  // Other paths from settings
});
```

---

##### profiles.split(options)

Splits profile XML files into manageable CSV files.

**Parameters:**
- `options` (ProfileOptions) - Configuration options

**Returns:** `Promise<{ outputString: string }>`

**Example:**
```typescript
const result = await profiles.split({
    'sf-xml': './force-app/main/default',
    'es-csv': './easysources',
    input: 'Admin,Standard User',
    ignoreuserperm: 'true'
});
console.log(result.outputString); // "OK"
```

**CSV Files Generated:**
Each profile is split into separate CSV files for:
- `applicationVisibilities` - Application permissions
- `classAccesses` - Apex class permissions
- `customMetadataTypeAccesses` - Custom metadata type permissions
- `customPermissions` - Custom permissions
- `customSettingAccesses` - Custom settings permissions
- `fieldPermissions` - Field-level security
- `flowAccesses` - Flow permissions
- `layoutAssignments` - Page layout assignments
- `objectPermissions` - Object-level security
- `pageAccesses` - Visualforce page permissions
- `recordTypeVisibilities` - Record type visibility
- `tabVisibilities` - Tab visibility
- `userPermissions` - User permissions (can be ignored)

---

##### profiles.upsert(options)

Updates or inserts profile data from XML into existing CSV files.

**Parameters:**
- `options` (ProfileOptions) - Configuration options

**Returns:** `Promise<{ outputString: string }>`

**Example:**
```typescript
const result = await profiles.upsert({
    'sf-xml': './force-app/main/default',
    'es-csv': './easysources',
    ignoreuserperm: 'true'
});
console.log(result.outputString); // "OK"
```

**Use Case:**
After retrieving updated metadata from an org, use this to merge new permissions into your existing CSV files without recreating them.

---

##### profiles.merge(options)

Merges CSV files back into profile XML format for deployment.

**Parameters:**
- `options` (ProfileOptions) - Configuration options

**Returns:** `Promise<{ result: string }>`

**Example:**
```typescript
const result = await profiles.merge({
    'es-csv': './easysources',
    'sf-xml': './force-app/main/default',
    input: 'Admin,Standard User'
});
console.log(result.result); // "OK"
```

---

##### profiles.clearEmpty(options)

Removes empty CSV files and folders.

**Parameters:**
- `options` (EmptyClearerOptions) - Configuration options

**Returns:** `Promise<EmptyClearerResult>`

**EmptyClearerResult:**
```typescript
interface EmptyClearerResult {
    outputString: string;
    deletedFiles: number;
    deletedFolders: number;
}
```

**Example:**
```typescript
const result = await profiles.clearEmpty({
    'es-csv': './easysources',
    'sf-xml': './force-app/main/default'
});
console.log(result.outputString); // "Deleted 5 empty CSV files and 2 empty folders"
console.log(`Files: ${result.deletedFiles}, Folders: ${result.deletedFolders}`);
```

---

##### profiles.areAligned(options)

Checks if XML and CSV files are properly aligned (in sync).

**Parameters:**
- `options` (ProfileOptions) - Configuration options

**Returns:** `Promise<ValidationSummary>`

**ValidationSummary:**
```typescript
interface ValidationSummary {
    totalItems: number;
    alignedItems: number;
    misalignedItems: number;
    warningItems: number;
    results: ValidationResult[];
}

interface ValidationResult {
    itemName: string;
    isAligned: boolean;
    differences: string[];
    isWarning?: boolean;
}
```

**Example:**
```typescript
const result = await profiles.areAligned({
    'es-csv': './easysources',
    'sf-xml': './force-app/main/default',
    input: 'Admin'
});

console.log(`Total: ${result.totalItems}`);
console.log(`Aligned: ${result.alignedItems}`);
console.log(`Misaligned: ${result.misalignedItems}`);

if (result.misalignedItems > 0) {
    result.results
        .filter(r => !r.isAligned && !r.isWarning)
        .forEach(r => {
            console.log(`\n${r.itemName}:`);
            r.differences.forEach(d => console.log(`  - ${d}`));
        });
}
```

---

##### profiles.updateKey(options)

Updates keys in CSV files based on a mapping.

**Parameters:**
- `options` (ProfileUpdateKeyOptions) - Configuration options

**Returns:** `Promise<any>`

**Example:**
```typescript
await profiles.updateKey({
    'es-csv': './easysources',
    input: 'Admin'
});
```

**Use Case:**
When renaming metadata (fields, objects, etc.), use this to update references across all profile CSV files.

---

##### profiles.minify(options)

Removes entries from profile CSV files that don't add value (e.g., all false permissions).

**Parameters:**
- `options` (ProfileOptions) - Configuration options

**Returns:** `Promise<{ outputString: string }>`

**Example:**
```typescript
const result = await profiles.minify({
    input: 'Admin,Standard User'
});
console.log(result.outputString); // "OK"
```

**Use Case:**
Keeps CSV files clean by removing rows that contain only false permission values.

---

##### profiles.delete(options)

Deletes specific entries from profile CSV files based on type and identifier.

**Parameters:**
- `options` (ProfileOptions & { type: string; tagid?: string }) - Configuration options

**Returns:** `Promise<{ outputString: string }>`

**Example:**
```typescript
const result = await profiles.delete({
    input: 'Admin',
    type: 'fieldPermissions',
    tagid: 'Account.MyField__c'
});
console.log(result.outputString); // "OK"
```

**Use Case:**
Bulk removal of specific permissions or settings across multiple profiles.

---

##### profiles.clean(options)

Cleans profile CSV files by removing references to non-existent metadata.

**Parameters:**
- `options` (ProfileOptions & { orgname?: string; target?: string; mode?: string }) - Configuration options

**Returns:** `Promise<{ outputString: string }>`

**Example:**
```typescript
// Clean against org metadata
const result = await profiles.clean({
    orgname: 'myorg',
    target: 'org',
    input: 'Admin,Standard User'
});

// Interactive mode for confirmation
const result = await profiles.clean({
    mode: 'interactive',
    target: 'both'
});
```

**Use Case:**
Removes entries that reference metadata components that no longer exist in the target org or local source.

---

## Advanced Usage Examples

### Complete Workflow

```typescript
import { profiles } from 'sfdx-easy-sources';

async function completeWorkflow() {
    // All paths auto-resolved from easysources-settings.json
    console.log('Starting complete profile workflow...');

    // 1. Split profiles into CSV (auto-resolved paths)
    console.log('Splitting profiles...');
    await profiles.split({
        input: 'Admin,Standard User',
        ignoreuserperm: 'true'
    });

    // 2. Clean references to non-existent metadata
    console.log('Cleaning profiles...');
    await profiles.clean({
        orgname: 'production',
        target: 'org'
    });

    // 3. Remove entries with only false permissions
    console.log('Minifying profiles...');
    await profiles.minify();

    // 4. Clean up empty files
    console.log('Removing empty files...');
    const cleanResult = await profiles.clearEmpty();
    console.log(`Cleaned ${cleanResult.deletedFiles} files`);

    // 5. Delete specific unwanted permissions
    console.log('Removing deprecated field permissions...');
    await profiles.delete({
        type: 'fieldPermissions',
        tagid: 'Account.DeprecatedField__c'
    });

    // 6. Merge back to XML
    console.log('Merging to XML...');
    await profiles.merge();

    // 7. Verify alignment
    console.log('Verifying alignment...');
    const aligned = await profiles.areAligned();
    
    if (aligned.misalignedItems === 0) {
        console.log('✓ All profiles aligned successfully!');
    } else {
        console.warn('⚠ Some profiles are misaligned');
        aligned.results
            .filter(r => !r.isAligned)
            .forEach(r => console.warn(`  - ${r.itemName}: ${r.differences.join(', ')}`));
    }
}
```

### Batch Processing

```typescript
async function processMultipleProfiles() {
    const profileNames = ['Admin', 'Standard User', 'Custom Profile'];
    
    for (const profile of profileNames) {
        console.log(`Processing ${profile}...`);
        
        await profiles.split({
            'sf-xml': './force-app/main/default',
            'es-csv': './easysources',
            input: profile
        });
        
        // Custom processing per profile
        
        await profiles.merge({
            'es-csv': './easysources',
            'sf-xml': './force-app/main/default',
            input: profile
        });
    }
}
```

### Error Handling

```typescript
async function safeProfileProcessing() {
    try {
        await profiles.split({
            'sf-xml': './force-app/main/default',
            'es-csv': './easysources'
        });
    } catch (error) {
        if (error.message.includes('does not exist')) {
            console.error('Input folder not found. Please check your paths.');
        } else {
            console.error('Unexpected error:', error);
        }
        process.exit(1);
    }
}
```

## Configuration

### Using Settings File

Instead of passing paths every time, you can create an `easysources-settings.json` file in your project root:

```json
{
  "salesforce-xml-path": "./force-app/main/default",
  "easysources-csv-path": "./easysources",
  "ignore-user-permissions": false,
  "log-path": "./logs"
}
```

Then you can omit the path options:

```typescript
// Settings file will be used automatically
await profiles.split({
    input: 'Admin'
});
```

## Notes

- All paths can be absolute or relative
- The `input` parameter accepts comma-separated profile names without extensions
- User permissions can be ignored with `ignoreuserperm: 'true'`
- CSV files are created with a `_tagid` column for tracking
- Empty CSV files (only headers) can be cleaned up with `clearEmpty()`

## See Also

- [CLI Documentation](../README.md) - Full CLI command reference
- [Examples](../examples/) - Complete usage examples
- [Release Notes](../RELEASE_NOTES.md) - Version history and changes
