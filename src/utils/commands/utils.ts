import * as child from 'child_process';
import * as util from 'util';
import { join } from "path";
const exec = util.promisify(child.exec);
import { DEFAULT_PACKAGE_LOC, DEFAULT_PACKAGE_ORG, MANIFEST_CREATE_CMD, ORG_DISPLAY_CMD, SOURCE_RETRIEVE_CMD } from "../constants/constants_sourcesdownload";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, SF_CMD } from '../constants/constants';
const fs = require('fs');

import { profiles } from '../../api/profiles';
import { permissionSets } from '../../api/permissionsets';
import { objectTranslations } from '../../api/objecttranslations';
import { translations } from '../../api/translations';
import { recordTypes } from '../../api/recordtypes';
import { labels } from '../../api/labels';
import { globalValueSetTranslations } from '../../api/globalvaluesettranslations';
import { globalValueSets } from '../../api/globalvaluesets';
import { applications } from '../../api/applications';

export async function retrieveAllMetadataPackageOrg(orgname, manifestDir){
	var cmdString = SF_CMD + ' ' + MANIFEST_CREATE_CMD + ' --fromorg ' + orgname + ' --manifestname='+DEFAULT_PACKAGE_ORG+' --outputdir=' + manifestDir + " -c unlocked managed";
	console.log(cmdString);
	await exec(cmdString);
}

export async function retrieveAllMetadataPackageLocal(srcDir, manifestDir){
	var cmdString = SF_CMD + ' ' + MANIFEST_CREATE_CMD + ' --sourcepath=' + srcDir + ' --manifestname=' +DEFAULT_PACKAGE_LOC + ' --outputdir=' + manifestDir;
	console.log(cmdString);
	await exec(cmdString);
}

export async function retrievePackage(orgname, baseDir, filename, logdir){
	var cmdString = SF_CMD + ' ' + SOURCE_RETRIEVE_CMD + ' --targetusername ' + orgname + ' --manifest '+join(baseDir, filename);
	console.log(cmdString+'...');
	
	const logFilename = 'retrieve_' + filename.substring(0, filename.indexOf('.')) + '.log';
	const logFilenameErr = 'retrieve_' + filename.substring(0, filename.indexOf('.')) + '.err.log';

	const stdio = [
		0,
		fs.openSync(join(logdir, logFilename), 'w'),
		fs.openSync(join(logdir, logFilenameErr), 'w')
	  ];	
	let p = child.spawn(cmdString, { shell: true, stdio});

	return new Promise((resolve) => {
		p.on("exit", (code) => {
			console.log(cmdString+'...done '+ code);
			var fileToRemove;
			if(code > 0){
				fileToRemove = logFilename;
			} else {
				fileToRemove = logFilenameErr;
			}

				fs.unlink(join(logdir, fileToRemove), (err) => {
					if (err) {
					  console.error(err)
					  return
					}
				}
				);
			
			resolve(code);
		});
	  });
}

export async function executeCommand(flags, cmd, mdt) {
	var cmdString = SF_CMD + ' easysources:' + mdt + ':' + cmd + ' --sf-xml ' + (flags['sf-xml'] || DEFAULT_SFXML_PATH) + ' --es-csv ' + (flags['es-csv'] || DEFAULT_ESCSV_PATH);
	console.log(cmdString+'...');

	let p = child.spawn(cmdString, { shell: true});

	return new Promise((resolve) => {
		p.on("exit", (code) => {
			console.log(cmdString+'...done '+ code);
			resolve(code);
		});
	});
}

export async function bulkExecuteCommands(flags, cmd, sequencial) {
	// Mappa i metadata alle rispettive API e funzioni
	const apiMap = {
		profiles,
		permissionsets: permissionSets,
		objecttranslations: objectTranslations,
		translations,
		recordtypes: recordTypes,
		labels,
		globalvaluesettranslations: globalValueSetTranslations,
		globalvaluesets: globalValueSets,
		applications
	};

	// Mappa i metadata da processare per ogni tipo di comando
	let metadataList;
	if (cmd === 'minify') {
		metadataList = ['profiles', 'permissionsets', 'objecttranslations', 'translations'];
	} else {
		metadataList = [
			'profiles',
			'recordtypes',
			'labels',
			'permissionsets',
			'globalvaluesettranslations',
			'globalvaluesets',
			'applications',
			'objecttranslations',
			'translations'
		];
	}

	// Prepara le chiamate alle API
	const calls = metadataList.map(mdt => {
		const api = apiMap[mdt];
		if (!api || typeof api[cmd] !== 'function') {
			return async () => {
				console.warn(`API function for ${mdt}.${cmd} not found`);
			};
		}
		return async () => {
			try {
				await api[cmd](flags);
			} catch (err) {
				const msg = err && err.message ? err.message : String(err);
				console.error(`Errore in ${mdt}.${cmd}: ${msg}`);
			}
		};
	});

	if (sequencial) {
		for (const call of calls) {
			await call();
		}
	} else {
		await Promise.all(calls.map(fn => fn()));
	}
}

export async function getDefaultOrgName(){
	var cmdString = SF_CMD + ORG_DISPLAY_CMD + ' --json';
	console.log(cmdString);
	var res = await exec(cmdString);
	return JSON.parse(res.stdout).result.alias;
}