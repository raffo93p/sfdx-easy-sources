# SFDX Easy Sources - Commands Reference

This document provides a comprehensive reference of all available commands, organized by metadata type and action.

## Global Flags

The following flags are available across most commands:

### Path Configuration
- `--sf-xml, -x`: Specify custom directory for input XML files (default: `./force-app/main/default`)
- `--es-csv, -c`: Specify custom directory for output CSV files (default: `./easysources`)

### General Options
- `--input, -i`: Specify specific files/objects to process (comma-separated)
- `--sort, -S`: Sort results (options: `true`, `false`, default: `true`)

---

## Profiles Commands

### `sf easysources profiles split`
**Description**: Split Profile XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input profiles directory
- `--es-csv, -c`: Output CSV directory  
- `--input, -i`: Specific profile names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)
- `--ignoreuserperm, -u`: Ignore user permissions (default: `false`)

**Examples**:
```bash
sf easysources profiles split
sf easysources profiles split --input "Admin,Standard User"
```

### `sf easysources profiles merge`
**Description**: Merge CSV files back to Profile XML format

**Flags**:
- `--sf-xml, -x`: Output profiles directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific profile names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources profiles upsert`
**Description**: Update Profile XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input profiles directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific profile names (comma-separated)
- `--type, -t`: Specific permission types (e.g., `fieldPermissions,classAccesses`)
- `--tagid, -k`: Specific tag IDs (comma-separated)
- `--sort, -S`: Sort results (default: `true`)
- `--ignoreuserperm, -u`: Ignore user permissions (default: `false`)

**Examples**:
```bash
sf easysources profiles upsert
sf easysources profiles upsert --type "fieldPermissions" --tagid "Account.Name"
sf easysources profiles upsert --type "fieldPermissions,classAccesses" --tagid "ABC123,DEF456"
```

### `sf easysources profiles arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Profiles directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific profile names (comma-separated)
- `--mode`: Comparison mode (`string` for exact match, `logic` for logical comparison, default: `string`)

### `sf easysources profiles updatekey`
**Description**: Update key fields in Profile CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific profile names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources profiles delete`
**Description**: Delete specific entries from Profile CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific profile names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources profiles clean`
**Description**: Clean Profile CSV files

**Flags**:
- `--sf-xml, -x`: Salesforce XML directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific profile names (comma-separated)
- `--orgname, -u`: Target org username or alias
- `--log-dir, -l`: Log directory path
- `--mode, -m`: Cleaning mode (`clean`, `interactive`, `log`, default: `clean`)
- `--target, -g`: Target to compare against (`org`, `local`, `both`, default: `both`)
- `--include-standard-fields, -F`: Include standard fields in cleaning (default: `false`)
- `--skip-manifest-creation, -M`: Skip manifest file creation (default: `false`)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources profiles clearempty`
**Description**: Remove empty CSV files and folders

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific profile names (comma-separated)

### `sf easysources profiles minify`
**Description**: Minify Profile CSV files by removing entries with all false permissions

**Flags**:
- `--sf-xml, -x`: Profiles directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific profile names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## Permission Sets Commands

### `sf easysources permissionsets split`
**Description**: Split Permission Set XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input permission sets directory
- `--es-csv, -c`: Output CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources permissionsets merge`
**Description**: Merge CSV files back to Permission Set XML format

**Flags**:
- `--sf-xml, -x`: Output permission sets directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources permissionsets upsert`
**Description**: Update Permission Set XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input permission sets directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--type, -t`: Specific permission types (e.g., `fieldPermissions,objectPermissions`)
- `--tagid, -k`: Specific tag IDs (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

**Examples**:
```bash
sf easysources permissionsets upsert
sf easysources permissionsets upsert --type "fieldPermissions" --tagid "Account.Name"
```

### `sf easysources permissionsets arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Permission sets directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)

### `sf easysources permissionsets updatekey`
**Description**: Update key fields in Permission Set CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources permissionsets delete`
**Description**: Delete specific entries from Permission Set CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources permissionsets clean`
**Description**: Clean Permission Set CSV files

**Flags**:
- `--sf-xml, -x`: Salesforce XML directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--orgname, -u`: Target org username or alias
- `--log-dir, -l`: Log directory path
- `--mode, -m`: Cleaning mode (`clean`, `interactive`, `log`, default: `clean`)
- `--target, -g`: Target to compare against (`org`, `local`, `both`, default: `both`)
- `--include-standard-fields, -F`: Include standard fields in cleaning (default: `false`)
- `--skip-manifest-creation, -M`: Skip manifest file creation (default: `false`)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources permissionsets clearempty`
**Description**: Remove empty CSV files and folders

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific permission set names (comma-separated)

### `sf easysources permissionsets minify`
**Description**: Minify Permission Set CSV files by removing entries with all false permissions

**Flags**:
- `--sf-xml, -x`: Permission sets directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific permission set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## Record Types Commands

### `sf easysources recordtypes split`
**Description**: Split Record Type XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input record types directory
- `--es-csv, -c`: Output CSV directory
- `--object, -s`: Specific object names (comma-separated)
- `--recordtype, -r`: Specific record type names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources recordtypes merge`
**Description**: Merge CSV files back to Record Type XML format

**Flags**:
- `--sf-xml, -x`: Output record types directory
- `--es-csv, -c`: Input CSV directory
- `--object, -s`: Specific object names (comma-separated)
- `--recordtype, -r`: Specific record type names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources recordtypes upsert`
**Description**: Update Record Type XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input record types directory
- `--es-csv, -c`: Input CSV directory
- `--object, -s`: Specific object names (comma-separated)
- `--recordtype, -r`: Specific record type names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources recordtypes arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Record types directory
- `--es-csv, -c`: CSV directory
- `--object, -s`: Specific object names (comma-separated)
- `--recordtype, -r`: Specific record type names (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources recordtypes updatekey`
**Description**: Update key fields in Record Type CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--object, -s`: Specific object names (comma-separated)
- `--recordtype, -r`: Specific record type names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources recordtypes delete`
**Description**: Delete specific picklist values from Record Type CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--object, -s`: Object names (comma-separated)
- `--recordtype, -r`: Record type names (comma-separated)
- `--picklist, -p`: Picklist field names (comma-separated) - **Required**
- `--apiname, -k`: Specific API names to delete (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

**Examples**:
```bash
sf easysources recordtypes delete --object "Account" --picklist "Status"
sf easysources recordtypes delete --picklist "Status" --apiname "Active,Inactive"
```

### `sf easysources recordtypes clean`
**Description**: Clean Record Type CSV files

**Flags**:
- `--sf-xml, -x`: Salesforce XML directory
- `--es-csv, -c`: CSV directory
- `--orgname, -u`: Target org username or alias
- `--object, -s`: Specific object names (comma-separated)
- `--recordtype, -r`: Specific record type names (comma-separated)
- `--log-dir, -l`: Log directory path
- `--mode, -m`: Cleaning mode (`clean`, `interactive`, `log`, default: `clean`)
- `--target, -g`: Target to compare against (`org`, `local`, `both`, default: `both`)
- `--include-standard-fields, -F`: Include standard fields in cleaning (default: `false`)
- `--skip-manifest-creation, -M`: Skip manifest file creation (default: `false`)
- `--sort, -S`: Sort results (default: `true`)

---

## Translations Commands

### `sf easysources translations split`
**Description**: Split Translation XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input translations directory
- `--es-csv, -c`: Output CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources translations merge`
**Description**: Merge CSV files back to Translation XML format

**Flags**:
- `--sf-xml, -x`: Output translations directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources translations upsert`
**Description**: Update Translation XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input translations directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources translations arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Translations directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)

### `sf easysources translations clearempty`
**Description**: Remove empty CSV files and folders

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific translation files (comma-separated)

### `sf easysources translations minify`
**Description**: Minify Translation CSV files by removing entries with all false values

**Flags**:
- `--sf-xml, -x`: Translations directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## Object Translations Commands

### `sf easysources objecttranslations split`
**Description**: Split Object Translation XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input object translations directory
- `--es-csv, -c`: Output CSV directory
- `--input, -i`: Specific object translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources objecttranslations merge`
**Description**: Merge CSV files back to Object Translation XML format

**Flags**:
- `--sf-xml, -x`: Output object translations directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific object translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources objecttranslations upsert`
**Description**: Update Object Translation XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input object translations directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific object translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources objecttranslations arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Object translations directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific object translation files (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)

### `sf easysources objecttranslations clearempty`
**Description**: Remove empty CSV files and folders

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific object translation files (comma-separated)

### `sf easysources objecttranslations minify`
**Description**: Minify Object Translation CSV files by removing entries with all false values

**Flags**:
- `--sf-xml, -x`: Object translations directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific object translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## Applications Commands

### `sf easysources applications split`
**Description**: Split Application XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input applications directory
- `--es-csv, -c`: Output CSV directory
- `--input, -i`: Specific application names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources applications merge`
**Description**: Merge CSV files back to Application XML format

**Flags**:
- `--sf-xml, -x`: Output applications directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific application names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources applications upsert`
**Description**: Update Application XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input applications directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific application names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources applications arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Applications directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific application names (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)

### `sf easysources applications updatekey`
**Description**: Update key fields in Application CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific application names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## Labels Commands

### `sf easysources labels split`
**Description**: Split Custom Label XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input labels directory
- `--es-csv, -c`: Output CSV directory
- `--input, -i`: Specific label files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources labels merge`
**Description**: Merge CSV files back to Custom Label XML format

**Flags**:
- `--sf-xml, -x`: Output labels directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific label files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources labels upsert`
**Description**: Update Custom Label XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input labels directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific label files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources labels arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Labels directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific label files (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)

### `sf easysources labels updatekey`
**Description**: Update key fields in Custom Label CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific label files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## Global Value Sets Commands

### `sf easysources globalvaluesets split`
**Description**: Split Global Value Set XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input global value sets directory
- `--es-csv, -c`: Output CSV directory
- `--input, -i`: Specific global value set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources globalvaluesets merge`
**Description**: Merge CSV files back to Global Value Set XML format

**Flags**:
- `--sf-xml, -x`: Output global value sets directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific global value set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources globalvaluesets upsert`
**Description**: Update Global Value Set XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input global value sets directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific global value set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources globalvaluesets arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Global value sets directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific global value set names (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)

### `sf easysources globalvaluesets updatekey`
**Description**: Update key fields in Global Value Set CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific global value set names (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## Global Value Set Translations Commands

### `sf easysources globalvaluesettranslations split`
**Description**: Split Global Value Set Translation XML files into CSV format

**Flags**:
- `--sf-xml, -x`: Input global value set translations directory
- `--es-csv, -c`: Output CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources globalvaluesettranslations merge`
**Description**: Merge CSV files back to Global Value Set Translation XML format

**Flags**:
- `--sf-xml, -x`: Output global value set translations directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources globalvaluesettranslations upsert`
**Description**: Update Global Value Set Translation XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input global value set translations directory
- `--es-csv, -c`: Input CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

### `sf easysources globalvaluesettranslations arealigned`
**Description**: Validate alignment between XML and CSV files

**Flags**:
- `--sf-xml, -x`: Global value set translations directory
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--mode`: Comparison mode (`string` or `logic`, default: `string`)

### `sf easysources globalvaluesettranslations updatekey`
**Description**: Update key fields in Global Value Set Translation CSV files

**Flags**:
- `--es-csv, -c`: CSV directory
- `--input, -i`: Specific translation files (comma-separated)
- `--sort, -S`: Sort results (default: `true`)

---

## All Metadata Commands

### `sf easysources allmeta retrieve`
**Description**: Retrieve all metadata types from a Salesforce org and automatically split/merge

**Flags**:
- `--manifest, -m`: Path to package.xml manifest file
- `--sf-xml, -x`: Output directory for XML files
- `--es-csv, -c`: Output directory for CSV files
- `--orgname, -r`: Salesforce org name - **Required**
- `--dont-retrieve, -k`: Skip retrieval step (default: `false`)
- `--resnumb, -n`: Maximum resources per package (default: from constants)
- `--log-dir, -l`: Log directory path
- `--split-merge, -t`: Automatically run split and merge after retrieve (default: `false`)
- `--clean, -e`: Clean directories before operation (default: `false`)
- `--sequencial, -s`: Run operations sequentially (default: `false`)

**Examples**:
```bash
sf easysources allmeta retrieve --orgname "myorg" --split-merge
sf easysources allmeta retrieve --orgname "myorg" --manifest "./manifest/package.xml"
```

### `sf easysources allmeta split`
**Description**: Split all metadata types from XML to CSV format

**Flags**:
- `--sf-xml, -x`: Input XML directory
- `--es-csv, -c`: Output CSV directory

### `sf easysources allmeta merge`
**Description**: Merge all CSV files back to XML format

**Flags**:
- `--sf-xml, -x`: Output XML directory
- `--es-csv, -c`: Input CSV directory

### `sf easysources allmeta upsert`
**Description**: Update all XML files with CSV data

**Flags**:
- `--sf-xml, -x`: Input XML directory
- `--es-csv, -c`: Input CSV directory

### `sf easysources allmeta minify`
**Description**: Minify all XML files

**Flags**:
- `--sf-xml, -x`: XML directory to minify

---

## Settings Commands

### `sf easysources settings init`
**Description**: Initialize easysources-settings.json configuration file

**Examples**:
```bash
sf easysources settings init
```

---

## Configuration File

You can create an `easysources-settings.json` file in your project root to set default values:

```json
{
  "salesforce-xml-path": "./force-app/main/default",
  "easysources-csv-path": "./easysources",
  "easysources-log-path": "./easysources/log",
  "ignore-user-permissions": false
}
```

## Common Usage Patterns

### 1. Basic Workflow
```bash
# Split XML to CSV for editing
sf easysources profiles split

# Edit CSV files as needed

# Merge back to XML
sf easysources profiles merge
```

### 2. Targeted Updates
```bash
# Update only specific permission types
sf easysources profiles upsert --type "fieldPermissions" --tagid "Account.Name,Contact.Email"

# Update specific permission sets
sf easysources permissionsets upsert --input "MyPermSet" --type "objectPermissions"
```

### 3. Bulk Operations
```bash
# Retrieve and process all metadata
sf easysources allmeta retrieve --orgname "myorg" --split-merge --clean

# Split all metadata types
sf easysources allmeta split
```

### 4. Validation
```bash
# Check if XML and CSV are aligned
sf easysources profiles arealigned --mode "logic"

# Clean up empty files
sf easysources profiles clearempty
```

---

## Notes

- **Comma-separated values**: Most `--input` flags accept comma-separated values for processing multiple items
- **Type and TagID filtering**: Available in upsert commands for profiles and permission sets for precise control
- **Sorting**: Most commands include a `--sort` flag to control output ordering
- **Path flexibility**: All commands respect custom paths via flags or configuration file
- **Background operations**: Long-running commands like `allmeta retrieve` support background processing options
