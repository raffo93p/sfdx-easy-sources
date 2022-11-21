sfdx-easy-sources
=================

# [BETA]


[![Version](https://img.shields.io/npm/v/sfdx-easy-sources.svg)](https://npmjs.org/package/sfdx-easy-sources)
[![CircleCI](https://circleci.com/gh/raffo93p/sfdx-easy-sources/tree/master.svg?style=shield)](https://circleci.com/gh/raffo93p/sfdx-easy-sources/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/raffo93p/sfdx-easy-sources?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sfdx-easy-sources/branch/master)
[![Greenkeeper](https://badges.greenkeeper.io/raffo93p/sfdx-easy-sources.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/raffo93p/sfdx-easy-sources/badge.svg)](https://snyk.io/test/github/raffo93p/sfdx-easy-sources)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-easy-sources.svg)](https://npmjs.org/package/sfdx-easy-sources)
[![License](https://img.shields.io/npm/l/sfdx-easy-sources.svg)](https://github.com/raffo93p/sfdx-easy-sources/blob/master/package.json)

# Note: There might be bugs or errors since this plugin is still in BETA version


This unofficial plugin provides tools to simplify Salesforce sources, by splitting files into smaller ones and in csv format.


## Supported metadata types

- [Profiles]
- [RecordTypes]
- [Labels]
- [GlobalValueSets]
- [GlobalValueSetTranslations]
- [Applications]


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



This sfdx plugin is intended to simplify the life of salesforce developers, who could have hard time trying to manage some kind of sources that Salesforce has.
The main idea behind the plugin is to represent some long files as csv, in order both to have a more efficient way to manage long files and to have a more git-friendly file format.
In addition, splitting into csv files doesn't generate a huge number of files.


Based on the source type, this plugin provides the following tools:
- Split: Splits the resources into various csv files, and eventually an xml containing all the tags that weren't split
- Merge: Merges back all the resources previously split
- Upsert: It's like the split, but goes on upsert.
- Updatekey: Maybe sometimes a developer changes something on the csv file, this command simply updates the key for that record
- Delete: Bulk deletes a single permission from all the resources of the same type (only applies to Profiles, PermissionSets and Record Types)

## Scenarios
A prerequisite on the usage of this plugin is that the release manager or the architect should have downloaded all the source code from the org.

### Split

At the beginning of the usage of this plugin, the release manager splits the metadata he thinks generate more problems to developers when they have to modify them or deploy from one org to another.
Supported metadata types are listed above.
The split command creates a folder at the same level of the file that it is splitting, and inside the folder it creates various csv files and a part.xml file.
Csv files are generated starting from the tags that are mapped inside the code. In the part.xml file all other tags can be found.

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

Suppose the developer makes some modification directly on the csv. WIth the updatekey command, he can update the tagid column if needed.

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
