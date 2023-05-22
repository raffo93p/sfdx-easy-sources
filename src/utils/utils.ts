import * as child from 'child_process';
import * as util from 'util';
const exec = util.promisify(child.exec);

import { DEFAULT_SFXML_PATH, SFDX_CMD } from "./constants/constants";

export function generateTagId(myArray, key, headers) {

	if (Array.isArray(key)) {

		for (var i in myArray) {
			var tagids = [];
			for (var k of key) {
				if (myArray[i][k] != undefined) tagids.push(myArray[i][k])
			}
			myArray[i] = upsertTagId(myArray[i], headers, tagids.join('/'));

		}
	} else {
		for (var i in myArray) {
			myArray[i] = upsertTagId(myArray[i], headers, myArray[i][key]);
		}
	}
}

function upsertTagId(item: {}, headers, value: string): {} {
	if (item['_tagid'] === undefined) {
		item = { ...emptyItem(headers), ...item, _tagid: value };
	} else {
		item['_tagid'] = value;
	}
	return item;
}

function emptyItem(headers: [string]) {
	var item = {};
	for (var tag of headers) {
		item[tag] = null;
	}
	return item;
}

export function sortByKey(myArray) {
	if (myArray == null || myArray == undefined || !Array.isArray(myArray)) return myArray;

	var key = '_tagid';
	function compare(a, b) {
		if (a[key] < b[key]) {
			return -1;
		}
		if (a[key] > b[key]) {
			return 1;
		}
		return 0;
	}
	return myArray.sort(compare);

	// var collator = new Intl.Collator([], {numeric: true});
	// return myArray.sort((a, b) => collator.compare(a[key], b[key]));


}

export function setDefault(header) {
	return {value: header, default: ''};
	// var newHeaders = [];
	// for (var field of headers) {
	// 	newHeaders.push({ value: field, default: 'a' });
	// }
	// return newHeaders;
}

export async function executeCommand(flags, cmd, mdt) {
	var cmdString = SFDX_CMD + ' easysources:' + mdt + ':' + cmd + ' -d ' + (flags.dir || DEFAULT_SFXML_PATH) + ' -o ' + (flags.output || flags.dir || DEFAULT_SFXML_PATH);
	console.log(cmdString);
	await exec(cmdString);
}

export async function bulkExecuteCommands(flags, cmd) {
	await executeCommand(flags, cmd, 'profiles');
	await executeCommand(flags, cmd, 'recordtypes');
	await executeCommand(flags, cmd, 'labels');
	await executeCommand(flags, cmd, 'permissionsets');
	await executeCommand(flags, cmd, 'globalvaluesettranslations');
	await executeCommand(flags, cmd, 'globalvaluesets');
	await executeCommand(flags, cmd, 'applications');
}

