export function transformLayoutXMLtoCSV(jsonArray) {
    if (!Array.isArray(jsonArray)) jsonArray = [jsonArray];

    var jsforcsv = [];
    for (var layout of jsonArray) {

        if (!Array.isArray(layout.sections)) layout.sections = [layout.sections];
        for (var section of layout.sections) {
            jsforcsv.push({ layout: layout.layout, sections_label: section.label, sections_section: section.section })
        }
    }
    return jsforcsv;
}

export function transformLayoutCSVtoXML(jsonArray) {
    var jsonArrayForXML = []
    var obj = {}
    var prevLayout: string;
    for (var entry of jsonArray) {

        if (entry.layout !== prevLayout) {
            if (prevLayout != undefined) jsonArrayForXML.push(obj);
            obj = { layout: entry.layout, sections: [{ label: entry.sections_label, section: entry.sections_section }] };
            prevLayout = entry.picklist
        } else {
            obj['sections'].push({ label: entry.sections_label, section: entry.sections_section })
        }
    }
    jsonArrayForXML.push(obj);
    return jsonArrayForXML;
}

export function transformFieldXMLtoCSV(fieldTr){
    // var csvEntry = {label: fieldTr.label, name: fieldTr.name};
    // var picklistValues = fieldTr.picklistValues;
    // if(picklistValues != null){
    //     if (!Array.isArray(picklistValues)) picklistValues = [picklistValues];
        
    //     for(var entry of picklistValues){

    //     }
    // }   
        var { label, name, picklistValues } = fieldTr;
        const attributesArray = [];
      
        if (!picklistValues || picklistValues.length === 0) {
            attributesArray.push({
            label,
            name,
            picklistValues_masterLabel: '',
            picklistValues_translation: ''
            });
        } else {
            if (!Array.isArray(picklistValues)) picklistValues = [picklistValues];

            for (const { masterLabel, translation } of picklistValues) {
            attributesArray.push({
                label,
                name,
                picklistValues_masterLabel: masterLabel,
                picklistValues_translation: translation
            });
            }
        }
      
        return attributesArray;      

}

export function transformFieldCSVtoXMLs(array) {
    const transformedArray = [];
  const uniqueNames = [...new Set(array.map(item => item.name))];

  for (const name of uniqueNames) {
    const filteredItems = array.filter(item => item.name === name);

    if (filteredItems.some(item => item.hasOwnProperty("picklistValues_masterLabel") && item.picklistValues_masterLabel !=='')) {
      const picklistValues = filteredItems.map(item => ({
        masterLabel: item.picklistValues_masterLabel,
        translation: item.picklistValues_translation
      }));

      transformedArray.push({
        "$":  {xmlns: 'http://soap.sforce.com/2006/04/metadata'},
        label: filteredItems[0].label,
        name,
        picklistValues
      });
    } else {
      transformedArray.push({
        "$":  {xmlns: 'http://soap.sforce.com/2006/04/metadata'},
        label: filteredItems[0].label,
        name
      });
    }
  }

  return transformedArray;


    // var xml = {};
    // xml['$'] = {xmlns: 'http://soap.sforce.com/2006/04/metadata'};
    // xml['label'] = map['label'];
    // xml['name'] = map['name'];
    // const transformedObject = {
    //     label: array[0].label,
    //     name: array[0].name,
    //     picklistValues: array.map(item => ({
    //       masterLabel: item.picklistValues_masterLabel,
    //       translation: item.picklistValues_translation
    //     }))
    //   };
    // return {[OBJTRANSL_CFIELDTRANSL_ROOT_TAG]: xml}; 
}
