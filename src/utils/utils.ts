import { loadSettings } from "./localSettings";

export function generateTagId(myArray, key, headers) {

	if (Array.isArray(key)) {

		for (var i in myArray) {
			var tagids = [];
			for (var k of key) {
				if (myArray[i][k] != undefined && myArray[i][k] != null && myArray[i][k] !== '') tagids.push(myArray[i][k])
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
	const settings = loadSettings();
	if (settings['csv-engine'] === 'json2csv')
		return { value: header, default: '' };
	return header;
	
	// var newHeaders = [];
	// for (var field of headers) {
	// 	newHeaders.push({ value: field, default: 'a' });
	// }
	// return newHeaders;
}

export function isBlank(str): boolean{
    return str == undefined || str == null || str === "";
}

export function toArray(arr): string[]{
    if (!Array.isArray(arr)) arr = [arr];
    return arr;
}


/*

// this function creates a flat array when objects have a list attribute with other subrecords.
export function arrayToFlat(inputArray, prefix = "") {
	let result = [];

	for (const currentItem of inputArray) {
		let flattenedItem = {};
		let flattenedItems = [];

		var flattenedNested = [];
		for (const key in currentItem) {
			if(typeof currentItem[key] !== 'string'){
				if (!Array.isArray(currentItem[key])) currentItem[key] = [currentItem[key]];

				const nestedArray = currentItem[key];
				const newPrefix = prefix ? `${prefix}_${key}` : key;
				flattenedNested = arrayToFlat(nestedArray, newPrefix);

			} else {
				const newKey = prefix ? `${prefix}_${key}` : key;
				flattenedItem[newKey] = currentItem[key];
			}
		}

		for(var flatNest of flattenedNested){
			flattenedItems.push({...flattenedItem, ...flatNest});
		}

		if(flattenedItems.length ==0){
			result.push(flattenedItem);
		} else {
			result.push(...flattenedItems);
		}
	}

	return result;
}



export function flatToArray(list) {
	const groupedObjects = {};
  
	list.forEach((obj) => {
	  const keys = Object.keys(obj);
	  const stringAttributes = keys.filter((key) => !key.includes("_"));
	  const identifier = stringAttributes.map((key) => obj[key]).join("_");
  
	  if (!groupedObjects[identifier]) {
		groupedObjects[identifier] = {};
		stringAttributes.forEach((key) => {
		  groupedObjects[identifier][key] = obj[key];
		});
	  }
  
	  keys.forEach((key) => {
		const split = key.split("_");
		if (split.length === 2) {
		  const listAttr = split[0];
		  const childAttr = split[1];
  
		  if (!groupedObjects[identifier][listAttr]) {
			groupedObjects[identifier][listAttr] = [];
		  }
  
		  groupedObjects[identifier][listAttr].push({ [childAttr]: obj[key] });
		}
	  });
	});
  
	const result = Object.values(groupedObjects);
	return result;
  }

  */