import * as child from 'child_process';
import * as util from 'util';
import { join } from "path";
const exec = util.promisify(child.exec);
import { DEFAULT_PACKAGE_LOC, DEFAULT_PACKAGE_ORG, MANIFEST_CREATE_CMD, SOURCE_RETRIEVE_CMD } from "../constants/constants_sourcesdownload";
import { DEFAULT_ESCSV_PATH, DEFAULT_SFXML_PATH, SFDX_CMD } from '../constants/constants';
const fs = require('fs');

export async function retrieveAllMetadataPackageOrg(orgname, manifestDir){
	var cmdString = MANIFEST_CREATE_CMD + ' --fromorg ' + orgname + ' --manifestname='+DEFAULT_PACKAGE_ORG+' --outputdir=' + manifestDir + " -c managed";
	console.log(cmdString);
	await exec(cmdString);
}

export async function retrieveAllMetadataPackageLocal(srcDir, manifestDir){
	var cmdString = MANIFEST_CREATE_CMD + ' --sourcepath=' + srcDir + ' --manifestname=' +DEFAULT_PACKAGE_LOC + ' --outputdir=' + manifestDir;
	console.log(cmdString);
	await exec(cmdString);
}

export async function retrievePackage(orgname, baseDir, filename, logdir){
	var cmdString = SFDX_CMD + ' ' + SOURCE_RETRIEVE_CMD + ' --targetusername ' + orgname + ' --manifest '+join(baseDir, filename);
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

// export async function executeCommand(flags, cmd, mdt) {
// 	var cmdString = SFDX_CMD + ' easysources:' + mdt + ':' + cmd + ' --sf-xml ' + (flags['sf-xml'] || DEFAULT_SFXML_PATH) + ' --es-csv ' + (flags['es-csv'] || DEFAULT_ESCSV_PATH);
// 	console.log(cmdString);
// 	await exec(cmdString);
// }

export async function executeCommand(flags, cmd, mdt) {
	var cmdString = SFDX_CMD + ' easysources:' + mdt + ':' + cmd + ' --sf-xml ' + (flags['sf-xml'] || DEFAULT_SFXML_PATH) + ' --es-csv ' + (flags['es-csv'] || DEFAULT_ESCSV_PATH);
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
	if(cmd === 'minify'){
		if(sequencial){
			await executeCommand(flags, cmd, 'profiles');
			await executeCommand(flags, cmd, 'permissionsets');
			await executeCommand(flags, cmd, 'objecttranslations');
			await executeCommand(flags, cmd, 'translations');
		} else {
			await Promise.all([
				executeCommand(flags, cmd, 'profiles'),
				executeCommand(flags, cmd, 'permissionsets'),
				executeCommand(flags, cmd, 'objecttranslations'),
				executeCommand(flags, cmd, 'translations')
			]);
		}
	}
	else {
		if(sequencial){
			await executeCommand(flags, cmd, 'profiles');
			await executeCommand(flags, cmd, 'recordtypes');
			await executeCommand(flags, cmd, 'labels');
			await executeCommand(flags, cmd, 'permissionsets');
			await executeCommand(flags, cmd, 'globalvaluesettranslations');
			await executeCommand(flags, cmd, 'globalvaluesets');
			await executeCommand(flags, cmd, 'applications');
			await executeCommand(flags, cmd, 'objecttranslations');
			await executeCommand(flags, cmd, 'translations');
		} else {
			await Promise.all([
				executeCommand(flags, cmd, 'profiles'),
				executeCommand(flags, cmd, 'recordtypes'),
				executeCommand(flags, cmd, 'labels'),
				executeCommand(flags, cmd, 'permissionsets'),
				executeCommand(flags, cmd, 'globalvaluesettranslations'),
				executeCommand(flags, cmd, 'globalvaluesets'),
				executeCommand(flags, cmd, 'applications'),
				executeCommand(flags, cmd, 'objecttranslations'),
				executeCommand(flags, cmd, 'translations')
			]);
		}
	}
	
}

export async function getDefaultOrgName(){
	var cmdString = SFDX_CMD + ' force:org:display --json';
	console.log(cmdString);
	var res = await exec(cmdString);
	return JSON.parse(res.stdout).result.alias;
}