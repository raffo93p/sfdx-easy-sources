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

