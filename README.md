sfdx-easy-sources
=================

[BETA]

This plugin provides tools to simplify Salesforce sources

[![Version](https://img.shields.io/npm/v/sfdx-easy-sources.svg)](https://npmjs.org/package/sfdx-easy-sources)
[![CircleCI](https://circleci.com/gh/raffo93p/sfdx-easy-sources/tree/master.svg?style=shield)](https://circleci.com/gh/raffo93p/sfdx-easy-sources/tree/master)
[![Appveyor CI](https://ci.appveyor.com/api/projects/status/github/raffo93p/sfdx-easy-sources?branch=master&svg=true)](https://ci.appveyor.com/project/heroku/sfdx-easy-sources/branch/master)
[![Greenkeeper](https://badges.greenkeeper.io/raffo93p/sfdx-easy-sources.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/raffo93p/sfdx-easy-sources/badge.svg)](https://snyk.io/test/github/raffo93p/sfdx-easy-sources)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-easy-sources.svg)](https://npmjs.org/package/sfdx-easy-sources)
[![License](https://img.shields.io/npm/l/sfdx-easy-sources.svg)](https://github.com/raffo93p/sfdx-easy-sources/blob/master/package.json)

<!-- toc -->

<!-- tocstop -->
<!-- install -->
<!-- usage -->
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
<!-- usagestop -->
<!-- commands -->

<!-- commandsstop -->


This sfdx plugin is intended to simplify the life of salesforce developers, who could have hard time trying to manage some kind of sources that Salesforce has. The main idea behind the plugin is to represent some long files as csv, in order both to have a more efficient way to manage long files and to have a more git-friendly file format. In addition, splitting into csv files doesn't generate a huge number of files, as it would be if we split each single tag into a new file.
Sources that can be split into csv files are:
1 Profiles
2 RecordTypes
3 Labels
4 GlobalValueSets
5 GlobalValueSetTranslations
6 Applications

Based on the source type, this plugin provides the following tools:
1 - Split: Splits the resources into various csv files, and eventually an xml containing all the tags that weren't split
2 - Merge: Merges back all the resources previously split
3 - Upsert: It's like the split, but goes on upsert
4 - Updatekey: Maybe sometimes a developer changes something on the csv file, this command simply updates the key for that record
5 - Delete: Bulk deletes a single permission from all the resources of the same type
