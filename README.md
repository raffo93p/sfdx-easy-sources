sfdx-easy-sources
=================
SFDX plugin to simplify the management of Salesforce sources, splitting some long xml files into smaller csv ones.

# [BETA]


[![Version](https://img.shields.io/npm/v/sfdx-easy-sources.svg)](https://npmjs.org/package/sfdx-easy-sources)
[![Known Vulnerabilities](https://snyk.io/test/github/raffo93p/sfdx-easy-sources/badge.svg)](https://snyk.io/test/github/raffo93p/sfdx-easy-sources)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-easy-sources.svg)](https://npmjs.org/package/sfdx-easy-sources)
[![License](https://img.shields.io/npm/l/sfdx-easy-sources.svg)](https://github.com/raffo93p/sfdx-easy-sources/blob/master/package.json)

# What is sfdx-easy-sources?
This plugin helps salesforce developers, architects and release managers with the management of some Salesforce xml sources, expecially those which become easily very long and difficult to be handled with git version history.

With this plugin you can:
- Split those long xml files into some smaller csv
- Have a better look and comprehension of what is written in those files, thanks to all the VSCode extensions that can be used to manage csv
- Upsert the csv files after retrieving a package with some resources that are built based on what you put inside the package
- Merge the csv files into the original xml ones
- Delete some reference or permission from all the csv of a given metadata type
- Minify the csv by removing all the rows that don't increase the value of the file
- Clean the csv references to some resources that doesn't exist in the target org

## Supported metadata types

| Metadata | Action | Available commands    |
| :---:    | :---:  | :---: | 
| All Meta | allmeta   | split, upsert, merge, minify, retrieve   |
| Profiles | profiles | split, upsert, merge, minify, updatekey, delete, clean |
| Record Types | recordtypes | split, upsert, merge, updatekey, delete, clean |
| Labels | labels | split, upsert, merge, updatekey |
| Global Value Sets | globalvaluesets | split, upsert, merge, updatekey |
| Global Value Set Translations | globalvaluesettranslations | split, upsert, merge, updatekey |
| Applications | applications | split, upsert, merge, updatekey |
| Object Translations | objecttranslations | split, upsert, merge, updatekey |
| Translations | translations | split, upsert, merge, updatekey |



```sh-session
$ npm install -g sfdx-easy-sources
$ sfdx COMMAND
running command...
$ sfdx (--version)
sfdx-easy-sources/0.0.1 darwin-arm64 node-v18.11.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```


Based on the source type, this plugin provides the following commands:
- Split: Splits the resources into various csv files, and eventually an xml containing all the tags that weren't split
- Merge: Merges back all the resources previously split
- Upsert: It's like the split, but goes on upsert.
- Updatekey: Maybe sometimes a developer changes something on the csv file, this command simply updates the key for that record
- Delete: Bulk deletes a single permission from all the resources of the same type (only applies to Profiles, PermissionSets and Record Types)
- Minify: Bulk deletes each entry that doesn't add value to the file (example: a permission in a profile xml which has all permissions set to false)
- Clean: Bulk deletes all the references that are not present in the target org or in the repository

# Let's start!
## Prerequisites
### Prerequisite 1 - Initialize the settings
This should be done once you have your sfdx project (for example after "Creating a new project with manifest").
To better instruct the plugin with the directories of the project, you can run the command
```sh-session
$ sfdx easysources:settings:init
```
and a file _easysources-settings.json_ will appear.
This file contains the directory of:
- the Salesforce sources (by default ./force-app/main/default)
- the csv files (by default the same of the salesforce sources)
- the log files.


### Prerequisite 2 - Retrieve all metadata
To deal with Salesforce files all the source code from the org must be downloaded in the repository.
One can perform this task in various ways, but this plugin also offers a simply way to download everything from the org.

```sh-session
$ sfdx easysources:allmeta:retrieve --orgname="orgname"
```


Some useful parameters are:
- --clean: if set to true, automatically deletes al the source folder before performing the retrieve
- --split-merge: if set to true, automatically performes a split and then a merge of all the sources, after they are retrieved

### Prerequisite 3 - Create the csv files for the first time
Once all the metadata have been downloaded, before to start dealing with the csv files, you should create them the first time.
To do this run these commands (but first, please, understand the meaning of each command reading this guide)

```sh-session
$ sfdx easysources:allmeta:split
$ sfdx easysources:allmeta:minify
$ sfdx easysources:allmeta:merge
```


## Description of each command


### Split


The split command creates a folder at the same level of the file that it is splitting, containing various csv files and a part.xml file.
Inside the csv files you can find all the rows of a given type: each tag attribute becomes a column; the tags that are not mapped are copied in the part.xml file.
[TODO] This is an example of an admin xml profile splitted in csv.

```sh-session

For help
  $ sfdx easysources:profiles:split -h
  $ sfdx easysources:recordtypes:split -h
  $ sfdx easysources:labels:split -h
  $ sfdx easysources:permissionsets:split -h
  $ sfdx easysources:globalvaluesettranslations:split -h
  $ sfdx easysources:globalvaluesets:split -h
  $ sfdx easysources:applications:split -h
  
  $ sfdx easysources:allmeta:split -h

```

### Upsert
Suppose the developer cretes a new object, he creates some fields, he assigns the fields, the layouts and the object permissions to the various profiles.
To update the profiles on the repository, he can:
1. Make the changes on Salesforce org
2. Create a package xml with the object, layout, fields and all profiles
3. Retrieve the package. All profiles will now contain only the tags related to the new object, layout and fields
4. *Execute the upsert command for profiles. The upsert command will insert the new tags into the csv*
5. Then he can merge back to have the profiles to be deployed elsewhere

```sh-session

For help
  $ sfdx easysources:profiles:upsert -h
  $ sfdx easysources:recordtypes:upsert -h
  $ sfdx easysources:labels:upsert -h
  $ sfdx easysources:permissionsets:upsert -h
  $ sfdx easysources:globalvaluesettranslations:upsert -h
  $ sfdx easysources:globalvaluesets:upsert -h
  $ sfdx easysources:applications:upsert -h
  
  $ sfdx easysources:allmeta:upsert -h

```
**NOTE: the upsert doesn't delete any unused reference. If the user deletes a field, he should run the delete command**


### UpdateKey

Suppose the developer makes some modification directly on the csv. With the updatekey command, he can update the tagid column if needed.

```sh-session

For help
  $ sfdx easysources:profiles:updatekey -h
  $ sfdx easysources:recordtypes:updatekey -h
  $ sfdx easysources:labels:updatekey -h
  $ sfdx easysources:permissionsets:updatekey -h
  $ sfdx easysources:globalvaluesettranslations:updatekey -h
  $ sfdx easysources:globalvaluesets:updatekey -h
  $ sfdx easysources:applications:updatekey -h
  
```

### Merge

When the user needs to deploy the code, he needs to merge back the csv files to restore and update the original xml file.

```sh-session

For help
  $ sfdx easysources:profiles:merge -h
  $ sfdx easysources:recordtypes:merge -h
  $ sfdx easysources:labels:merge -h
  $ sfdx easysources:permissionsets:merge -h
  $ sfdx easysources:globalvaluesettranslations:merge -h
  $ sfdx easysources:globalvaluesets:merge -h
  $ sfdx easysources:applications:merge -h
  
  $ sfdx easysources:allmeta:merge -h

```

### Delete
**Note: only applies to Profiles, PermissionSets and RecordTypes**

Suppose the developer deletes a field on the org, he needs to delete all the references for that field for all Profiles, PermissionSets and RecordTypes.
This command is intended to delete references, and it has flags to specify the name of the field. Run with -h flag to get a better description of the possible flags for each metadata type.

```sh-session

For help
  $ sfdx easysources:profiles:delete -h
  $ sfdx easysources:recordtypes:delete -h
  $ sfdx easysources:permissionsets:delete -h

```
