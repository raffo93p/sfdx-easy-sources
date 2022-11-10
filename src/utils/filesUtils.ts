import { promises, lstatSync } from "fs";
import { join } from "path";
import { Parser } from "xml2js";
import { SfdxProject } from "@salesforce/core";
import XmlFormatter from "./xmlFormatter";
import { PROFILE_ITEMS } from "./constants";

const csvparser = require("csvtojson");

const SKIPPED_FOLDERS = ["node_modules", ".git", ".github"];

export async function findAllFilesWithExtension(
	basePath: string,
	fileExtension: string
): Promise<string[]> {
	const allFiles = await findAllFiles(basePath);
	const filesWithExtension = [];
	for (const file of allFiles) {
		if (file.endsWith(fileExtension)) {
			filesWithExtension.push(file);
		}
	}
	return filesWithExtension;
}

export async function findAllFiles(basePath: string) {
	const dirs = [];
	const files = [];
	for (const fileOrDir of await promises.readdir(basePath)) {
		const fullFileOrDirPath = join(basePath, fileOrDir);
		const fileOrDirStats = lstatSync(fullFileOrDirPath);
		if (fileOrDirStats.isFile()) {
			files.push(fullFileOrDirPath);
		} else if (
			fileOrDirStats.isDirectory() &&
			!SKIPPED_FOLDERS.includes(fileOrDir)
		) {
			dirs.push(fullFileOrDirPath);
		}
	}
	const filesInSubFolders = await Promise.all(
		dirs.map((dir) => findAllFiles(dir))
	).then((results) => results.flat());

	for (const fileInSubFolder of filesInSubFolders) {
		files.push(fileInSubFolder);
	}

	return files;
}

export async function getAllDirs(path: string): Promise<string[]> {
	const dirs = [];
	for (const fileOrDir of await promises.readdir(path)) {
		const fullPath = join(path, fileOrDir);
		const fileOrDirStats = lstatSync(fullPath);
		if (fileOrDirStats.isDirectory()) {
			dirs.push(fullPath);
		}
	}
	return dirs;
}

export async function readXmlFromFile(file: string): Promise<any> {
	return promises
		.readFile(file)
		.then((fileContent) => new Parser({ explicitArray: false }).parseStringPromise(fileContent));
}

export async function writeXmlToFile(
	file: string,
	xml: object
) {
	return promises.writeFile(file, new XmlFormatter().formatXml(xml));
}

export function getDefaultFolder(project: SfdxProject): string {
	const allPossibleDirectories = project.getPackageDirectories();
	let defaultFolder;
	if (allPossibleDirectories.length == 0) {
		defaultFolder = allPossibleDirectories[0].path;
	} else {
		defaultFolder = allPossibleDirectories.find((path) => path.default).path;
	}
	return join(project.getPath(), defaultFolder);
}

export async function readCsvToJsonArray(csvFilePath: string) {
	var jsonArray = await csvparser().fromFile(csvFilePath);

	// filter null values
	jsonArray = JSON.parse(JSON.stringify(jsonArray), (key, value) => value === null || value === '' ? undefined : value);
	if (!Array.isArray(jsonArray)) jsonArray = [jsonArray]

	return jsonArray;
}
export function jsonArrayToMap(jsonArray: [{}]) {
	if (!Array.isArray(jsonArray)) jsonArray = [jsonArray]

	var aMap = jsonArray.reduce(function (map, obj) {
		map[obj['_tagid']] = obj;
		return map;
	}, {});
	return aMap;
}

export async function readCsvToJsonMap(csvFilePath: string) {
	var jsonArray = await readCsvToJsonArray(csvFilePath);
	return jsonArrayToMap(jsonArray);
}

export function sortByKey(myArray: [{}]) {
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
}

export function generateTagId(myArray: [{}], type: string) {
	var key = PROFILE_ITEMS[type].key;

	if (Array.isArray(key)) {

		for (var i in myArray) {
			var tagids = [];
			for (var k of key) {
				if (myArray[i][k] != undefined) tagids.push(myArray[i][k])
			}
			myArray[i] = upsertTagId(myArray[i], type, tagids.join('/'));
			
		}
	} else {
		for (var i in myArray) {
			myArray[i] = upsertTagId(myArray[i], type, myArray[i][key]);
		}
	}
}

function upsertTagId(item: {}, type, value: string) : {} {
	if (item['_tagid'] === undefined) {
		item = {...emptyItem(type), ...item , _tagid: value};
	} else {
		item['_tagid'] = value;
	}
	return item;
}

function emptyItem(type: string){
	var item = {};
	for(var tag of PROFILE_ITEMS[type].headers){
		item[tag] = null;
	}
	return item;
}