# Release Notes

## Version 0.7.5
- **Enhancement: Refactored `arealigned` command** - Performed comprehensive refactoring of the `arealigned` command to improve code readability and reduce code duplication. The merge logic has been extracted into reusable functions that are shared between the `merge` and `arealigned` commands, ensuring consistency and better maintainability while preserving all existing functionality.
- **Enhancement: Automatic split execution in upsert commands** - Enhanced upsert commands to automatically run the split command when the destination CSV directory or part.xml file doesn't exist. This improvement creates a seamless workflow where users don't need to manually run split before upsert.

## Version 0.7.4
- **Enhancement: Improved merge behavior for empty tags** - Modified the merge operation to handle empty tags more intelligently. When a `part.xml` file contains an empty tag and the corresponding CSV file does not exist, the empty tag will no longer be included in the merged output file. This results in cleaner, more optimized XML files by eliminating unnecessary empty sections.

## Version 0.7.3
- **Bug Fix: Permission Sets minify command configuration** - Fixed a critical bug in the `permissionsets:minify` command where it was incorrectly using Profile constants instead of Permission Set constants. The command now properly uses `PERMSET_ITEMS` and `PERMSET_TAG_BOOL` configurations, ensuring correct handling of Permission Set-specific fields including `viewAllFields` in the minification process.

## Version 0.7.2
- **New Feature: Permission Sets `viewAllFields` support for API version 63+** - Added support for the new `viewAllFields` tag in object permissions section of Permission Sets, introduced in Salesforce API version 63. When splitting or upserting Permission Sets, the `viewAllFields` column will be automatically included in CSV files. For XML files that don't contain this tag, the CSV column will be created with empty values. The merge operation is fully backward compatible: if the tag exists but is empty in the CSV, it will not be included in the generated XML file.
- **Bug Fix: `ignore-user-permissions` setting scope correction** - Fixed a bug where the `ignore-user-permissions` setting in `easysources-settings.json` was incorrectly applied to Permission Sets in addition to Profiles. The setting now correctly works only on Profiles, as intended. Permission Sets maintain their user permissions handling due to their different functionality compared to Profiles.

## Version 0.7.1
- **Enhanced: `ignoreuserperm` flag support for profile splitting** - Extended the `--ignoreuserperm` flag to work with the `profiles:split` command, providing consistent behavior across both split and upsert operations. When enabled, user permissions are excluded from CSV generation during the splitting process.
- **New Feature: Default configuration support** - Added support for default configuration values in the `easysources-settings.json` file. You can now set `"ignore-user-permissions": true` in your settings file to avoid specifying the flag on every command execution.

## Version 0.7.0
- **New Feature: `arealigned` command for all metadata types** - Introduced a new validation command that checks if XML and corresponding CSV files are properly aligned. This command is available for all supported metadata types (profiles, recordtypes, translations, objecttranslations, etc.) and provides two validation modes:
  - `--mode string` (default): Performs exact string comparison by temporarily merging CSV files back to XML and comparing the full file content
  - `--mode logic`: Performs logical comparison at the value level, comparing the actual data structures after parsing
- **New Feature: `clearempty` command for profiles and permissionsets** - Added the clearempty command for `profiles:clearempty` and `permissionsets:clearempty` that removes empty CSV files and folders from the generated CSV files. This command helps clean up the repository by removing unnecessary empty files and directories that may be created during the split process.
- **Bug Fix: Enhanced `recordtypes:delete` command** - Fixed and improved the delete command for record types. Now supports comma-separated notation for both picklist values and picklist entries, providing more flexibility when specifying multiple items to delete.

## Version 0.6.0
- Added `objecttranslations:clearempty` command that removes empty CSV files and folders from the generated CSV files. This command helps clean up the repository by removing unnecessary empty files and directories that may be created during the split process.
- Added `translations:clearempty` command that removes empty CSV files and folders from translations. Similar to the object translations command, it helps maintain a clean repository structure by removing empty CSV files and unused folders.
