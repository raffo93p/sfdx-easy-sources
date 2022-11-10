import { PROFILE_ITEMS } from "./constants";

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