
export function arrayToFlat(inputArray) {
	return arrayToFlatInner(inputArray);
}

export function flatToArray(inputArray){
    return joinArray(flatToArraySingle(inputArray));
}

// UTILS METHODS

function arrayToFlatInner(inputArray, prefix=""){
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
				flattenedNested = arrayToFlatInner(nestedArray, newPrefix);

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

function hasUnderscoreAttribute(obj) {
    for (const key in obj) {
      if (key.includes('_')) {
        return true;
      }
  
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          for (const item of obj[key]) {
            if (hasUnderscoreAttribute(item)) {
              return true;
            }
          }
        } else {
          if (hasUnderscoreAttribute(obj[key])) {
            return true;
          }
        }
      }
    }
  
    return false;
  }
    

function flatToArraySingle(inputArray){
  var result = [];
  for (var currentItem of inputArray) {
    while(hasUnderscoreAttribute(currentItem)){
        currentItem = flatToArrayInner(currentItem);
    }
    // item = flatToArrayInner(item)
    result.push(currentItem)
  }
  return result
}

function flatToArrayInner(currentItem){
  var item = {}
  for (const key in currentItem) {
      if(key.includes('_')){
        const [listAttr, strAttr] = splitStringByUnderscore(key);
        if(!item[listAttr]) item[listAttr] = [{}];
        item[listAttr][0][strAttr] = currentItem[key];
        
      } else if(Array.isArray(currentItem[key])){
        var res = flatToArrayInner(currentItem[key][0])
        item[key]
        item[key] = Array.isArray(res) ? res : [res];
      } else {
        item[key] = currentItem[key];
      }
  } 
  return item;
}


function splitStringByUnderscore(inputString) {
  const indexUnderscore = inputString.indexOf('_');
  if (indexUnderscore === -1) {
    // Se non viene trovato alcun carattere '_', restituiamo la stringa intera
    return [inputString, ''];
  }

  const firstPart = inputString.slice(0, indexUnderscore);
  const secondPart = inputString.slice(indexUnderscore + 1);

  return [firstPart, secondPart];
}

function joinArray(inputArray){
    var result = [];
    var previousItem = null;
    for (var currentItem of inputArray) {
     if(previousItem == null){
        previousItem = currentItem;
     } else {
        var equalKeys = true;
        var arrayAttrName = '';
        for (const key in currentItem) {
            if(typeof currentItem[key] === 'string' && previousItem[key] !== currentItem[key]){
                equalKeys = false;
            } else if(Array.isArray(currentItem[key])){
                arrayAttrName = key;
            }
        }
        if(equalKeys){
            previousItem[arrayAttrName].push(currentItem[arrayAttrName][0]);

        } else {
            var arrayName = getArrayAttrName(previousItem);
            if(arrayName != null){
                previousItem[arrayName] = joinArray(previousItem[arrayName]);
            }

                result.push(previousItem)
            
            previousItem = currentItem;

        }

     }
    }
    var arrayName = getArrayAttrName(previousItem);
    if(arrayName != null){
        previousItem[arrayName] = joinArray(previousItem[arrayName]);
    }
    result.push(previousItem)
    return result
}

function getArrayAttrName(item){
    for (const key in item) {
        if(Array.isArray(item[key])){
            return key
        }
    }
}


