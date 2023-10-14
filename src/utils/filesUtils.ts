import { promises } from "fs";
import { join } from "path";
import { Parser } from "xml2js";
import { SfdxProject } from "@salesforce/core";
import XmlFormatter from "./xmlFormatter";
import { CSV_EXTENSION } from "./constants/constants";
const fs = require('fs-extra');

const csvparser = require("csvtojson");

export async function readXmlFromFile(file: string): Promise<any> {
	return promises
		.readFile(file)
		.then((fileContent) => new Parser({ explicitArray: false }).parseStringPromise(fileContent));
}

export async function readStringFromFile(file: string): Promise<any> {
	return promises
		.readFile(file).then((fileContent)=> fileContent.toString());
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
export function jsonArrayToMap(jsonArray) {
	if (!Array.isArray(jsonArray)) jsonArray = [jsonArray]

	const myMap = new Map(
		jsonArray.map(object => {
			return [object['_tagid'], object];
		}),
	);

	return myMap;
}

export async function readCsvToJsonMap(csvFilePath: string) {
	var jsonArray = await readCsvToJsonArray(csvFilePath);
	return jsonArrayToMap(jsonArray) as Map<string, any>;
}

export function removeExtension(inputFile: string) {
	if (inputFile == null || inputFile == undefined) return inputFile;
	const fileName = inputFile; //basename(inputFile);
	let dotsCount = 0;
	for (let i = fileName.length - 1; i > 0; i--) {
		if (fileName[i] === ".") {
			dotsCount++;
		}
		if (dotsCount == 2) {
			return fileName.substring(0, i);
		}
	}
}

export function calcCsvFilename(filename, tag_section) {
	return filename + '-' + tag_section + CSV_EXTENSION;
}

export async function cleanDir(dir){
	await fs.rm(dir, { recursive: true }, (err) => {
		if(err){
			// File deletion failed
			console.error(err.message);
			return;
		}
		fs.mkdirSync(dir, { recursive: true } );
	});
}

export async function areFilesEqual(filea, fileb) {
	const fileAContent = await readStringFromFile(filea);
	// console.log(fileAContent);
	const fileBContent = await readStringFromFile(fileb);
	// console.log(fileBContent);
	return fileAContent ===  fileBContent;
}
