import * as child from 'child_process';
import * as util from 'util';
const exec = util.promisify(child.exec);

import { MANIFEST_CREATE_CMD, DEFAULT_PACKAGE, SOURCE_RETRIEVE_CMD } from "../constants/constants_sourcesdownload";

export async function retrieveAllMetadataPackage(orgname, baseInputDir){
	var cmdString = MANIFEST_CREATE_CMD + ' --fromorg ' + orgname + ' --manifestname='+DEFAULT_PACKAGE+' --outputdir=' + baseInputDir;
	console.log(cmdString);
	await exec(cmdString);
}

export function retrievePackage(orgname, filePathName){
	var cmdString = SOURCE_RETRIEVE_CMD + ' --targetusername ' + orgname + ' --manifest '+filePathName;
	console.log(cmdString);
	exec(cmdString);
}