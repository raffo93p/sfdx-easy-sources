export function generateTagId(myArray, key, headers) {

	if (Array.isArray(key)) {

		for (const i in myArray) {
			var tagids = [];
			for (const k of key) {
				if (myArray[i][k] != undefined && myArray[i][k] != null && myArray[i][k] !== '') tagids.push(myArray[i][k])
			}
			myArray[i] = upsertTagId(myArray[i], headers, tagids.join('/'));

		}
	} else {
		for (const i in myArray) {
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
	for (const tag of headers) {
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
}


export function isBlank(str): boolean{
    return str == undefined || str == null || str === "";
}

export function toArray(arr): string[]{
    if (!Array.isArray(arr)) arr = [arr];
    return arr;
}