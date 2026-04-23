# SFDX Easy Sources - Commands Matrix

This document provides a quick reference matrix of all commands and their available parameters.

## Legend

- ✅ = Parameter available
- 🔥 = Parameter available with special functionality
- ❌ = Parameter not available

---

## Profiles Commands

| Command | `--sf-xml` | `--es-csv` | `--input` | `--sort` | `--type` | `--tagid` | `--content` | `--ignoreuserperm` | `--mode` | Special Params |
|---------|------------|------------|-----------|----------|----------|-----------|-------------|-------------------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | type + tagid (targeted) |
| **customupsert** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | JSON content insert/update |
| **arealigned** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | - |
| **delete** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | wildcard * support for tagid |
| **clean** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | `--orgname`, `--log-dir`, `--target`, `--include-standard-fields`, `--skip-manifest-creation`, `--skip-types`, `--include-types` |
| **clearempty** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | - |
| **minify** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | - |

---

## Permission Sets Commands

| Command | `--sf-xml` | `--es-csv` | `--input` | `--sort` | `--type` | `--tagid` | `--content` | `--mode` | Special Params |
|---------|------------|------------|-----------|----------|----------|-----------|-------------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | type + tagid (targeted) |
| **customupsert** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | JSON content insert/update |
| **arealigned** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | - |
| **delete** | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | wildcard * support for tagid |
| **clean** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | `--orgname`, `--log-dir`, `--target`, `--include-standard-fields`, `--skip-manifest-creation`, `--skip-types`, `--include-types` |
| **clearempty** | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | - |
| **minify** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | - |

---

## Record Types Commands

| Command | `--sf-xml` | `--es-csv` | `--object` | `--recordtype` | `--sort` | `--mode` | Special Params |
|---------|------------|------------|------------|----------------|----------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **arealigned** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **delete** | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | `--picklist` (req), `--apiname` |
| **clean** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | `--orgname`, `--log-dir`, `--target`, `--include-standard-fields`, `--skip-manifest-creation` |

---

## Translations Commands

| Command | `--sf-xml` | `--es-csv` | `--input` | `--sort` | `--mode` | Special Params |
|---------|------------|------------|-----------|----------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **arealigned** | ✅ | ✅ | ✅ | ❌ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ✅ | ❌ | - |
| **clearempty** | ❌ | ✅ | ✅ | ❌ | ❌ | - |
| **minify** | ✅ | ✅ | ✅ | ✅ | ❌ | - |

---

## Object Translations Commands

| Command | `--sf-xml` | `--es-csv` | `--input` | `--sort` | `--mode` | Special Params |
|---------|------------|------------|-----------|----------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **arealigned** | ✅ | ✅ | ✅ | ❌ | ✅ | string/logic mode |
| **clearempty** | ❌ | ✅ | ✅ | ❌ | ❌ | - |
| **minify** | ✅ | ✅ | ✅ | ✅ | ❌ | - |

---

## Applications Commands

| Command | `--sf-xml` | `--es-csv` | `--input` | `--sort` | `--mode` | Special Params |
|---------|------------|------------|-----------|----------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **arealigned** | ✅ | ✅ | ✅ | ❌ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ✅ | ❌ | - |

---

## Labels Commands

| Command | `--sf-xml` | `--es-csv` | `--sort` | `--mode` | Special Params |
|---------|------------|------------|----------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ❌ | - |
| **arealigned** | ✅ | ✅ | ❌ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ❌ | - |

---

## Global Value Sets Commands

| Command | `--sf-xml` | `--es-csv` | `--input` | `--sort` | `--mode` | Special Params |
|---------|------------|------------|-----------|----------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **arealigned** | ✅ | ✅ | ✅ | ❌ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ✅ | ❌ | - |

---

## Global Value Set Translations Commands

| Command | `--sf-xml` | `--es-csv` | `--input` | `--sort` | `--mode` | Special Params |
|---------|------------|------------|-----------|----------|----------|----------------|
| **split** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **merge** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **upsert** | ✅ | ✅ | ✅ | ✅ | ❌ | - |
| **arealigned** | ✅ | ✅ | ✅ | ❌ | ✅ | string/logic mode |
| **updatekey** | ❌ | ✅ | ✅ | ✅ | ❌ | - |

---

## All Metadata Commands

| Command | `--sf-xml` | `--es-csv` | Special Params |
|---------|------------|------------|----------------|
| **retrieve** | ✅ | ✅ | `--orgname` (req), `--manifest`, `--dont-retrieve`, `--resnumb`, `--log-dir`, `--split-merge`, `--clean`, `--sequencial` |
| **split** | ✅ | ✅ | - |
| **merge** | ✅ | ✅ | - |
| **upsert** | ✅ | ✅ | - |
| **minify** | ✅ | ❌ | - |

---

## Settings Commands

| Command | Special Params |
|---------|----------------|
| **init** | None - creates `easysources-settings.json` |

---

## Parameter Details

### Common Parameters
- `--sf-xml, -x`: Salesforce XML directory path
- `--es-csv, -c`: EasySources CSV directory path  
- `--input, -i`: Specific files/objects (comma-separated)
- `--sort, -S`: Sort output (`true`/`false`, default: `true`)

### Special Parameters
- `--type, -t` 🆕: Filter by permission types (comma-separated)
- `--tagid, -k` 🆕: Filter by tag IDs (comma-separated)
- `--mode`: Comparison mode (`string`/`logic`)
- `--ignoreuserperm, -u`: Ignore user permissions (profiles only)

### Record Types Delete Parameters
- `--object, -s`: Object names (comma-separated)
- `--recordtype, -r`: Record type names (comma-separated)
- `--picklist, -p`: Picklist field names (comma-separated) - **Required**
- `--apiname, -k`: API names to delete (comma-separated)

### All Metadata Retrieve Parameters
- `--orgname, -r`: Salesforce org name - **Required**
- `--manifest, -m`: Custom package.xml path
- `--dont-retrieve, -k`: Skip retrieval step
- `--resnumb, -n`: Max resources per package
- `--log-dir, -l`: Log directory path
- `--split-merge, -t`: Auto split/merge after retrieve
- `--clean, -e`: Clean directories before operation
- `--sequencial, -s`: Run operations sequentially

---

## Usage Examples

```bash
# Basic operations
sf easysources profiles:split --input "Admin,Standard User"
sf easysources permissionsets merge

# Targeted upsert (NEW in v0.7.6)
sf easysources profiles:upsert --type "fieldPermissions" --tagid "Account.Name"
sf easysources permissionsets upsert --type "objectPermissions" --tagid "Account,Contact"

# Record types delete
sf easysources recordtypes delete --picklist "Status" --apiname "Inactive"

# All metadata retrieve
sf easysources allmeta retrieve --orgname "myorg" --split-merge --clean
```

---

## Notes

- **New in v0.9.1**: `delete` command now supports wildcard patterns (`*`) in `--tagid` parameter for bulk deletions
- **New in v0.9.2**: `customupsert` command for profiles and permission sets - insert/update entries via JSON content
- **Comma-separated values**: Most parameters support multiple values separated by commas
- **Targeted upsert**: When using `--type` or `--tagid`, the `-part.xml` file is not modified
- **Configuration file**: Use `easysources-settings.json` for default path values
