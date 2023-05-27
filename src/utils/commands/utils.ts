import * as child from 'child_process';
import * as util from 'util';
import { join } from "path";
const exec = util.promisify(child.exec);


import { MANIFEST_CREATE_CMD, DEFAULT_PACKAGE, SOURCE_RETRIEVE_CMD } from "../constants/constants_sourcesdownload";
import { SFDX_CMD } from '../constants/constants';
const fs = require('fs');

export async function retrieveAllMetadataPackage(orgname, baseInputDir){
	var cmdString = MANIFEST_CREATE_CMD + ' --fromorg ' + orgname + ' --manifestname='+DEFAULT_PACKAGE+' --outputdir=' + baseInputDir;
	console.log(cmdString);
	await exec(cmdString);
}

export async function retrievePackage(orgname, baseDir, filename){
	var cmdString = SFDX_CMD + ' ' + SOURCE_RETRIEVE_CMD + ' --targetusername ' + orgname + ' --manifest '+join(baseDir, filename);
	console.log(cmdString+'...');
	
	const logFilename = 'retrieve_' + filename.substring(0, filename.indexOf('.')) + '.log';
	const logFilenameErr = 'retrieve_' + filename.substring(0, filename.indexOf('.')) + '.err.log';

	const stdio = [
		0,
		fs.openSync(logFilename, 'w'),
		fs.openSync(logFilenameErr, 'w')
	  ];	
	let p = child.spawn(cmdString, { shell: true, stdio});

	return new Promise((resolveFunc) => {
		// p.stdout.on("data", (x) => {
		//   process.stdout.write(x.toString());
		// });
		// p.stderr.on("data", (x) => {
		//   process.stderr.write(x.toString());
		// });
		p.on("exit", (code) => {
			console.log(cmdString+'...done '+ code);
			var fileToRemove;
			if(code > 0){
				fileToRemove = logFilename;
			} else {
				fileToRemove = logFilenameErr;
			}

				fs.unlink(fileToRemove, (err) => {
					if (err) {
					  console.error(err)
					  return
					}
				}
				);
			
			resolveFunc(code);
		});
	  });
	// const result = child.spawnSync(cmdString, { shell: true });
	
	// result.stdout.on('data', (data) => {
	// 	fs.writeFileSync(logFilename, result.stderr.toString());
	// 	console.log(logFilename + ' has been created');
	// });

	// result.stderr.on('data', (data) => {
	// 	fs.writeFileSync(logFilename, result.stderr.toString());
	// 	console.log(logFilename + ' has errors');
	// });

	// if(result.status > 0){
	// 	console.log(logFilename + ' has errors');
	// 	fs.writeFileSync(logFilename, result.stderr.toString());

	// } else {
	// 	fs.writeFileSync(logFilename, result.stdout.toString());
	// 	console.log(logFilename + ' has been created');

	// }
}