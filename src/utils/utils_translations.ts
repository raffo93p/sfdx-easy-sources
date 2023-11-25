export function transformXMLtoCSV(jsonArray) {
    if (!Array.isArray(jsonArray)) jsonArray = [jsonArray];

    var jsforcsv = [];
    for (var reptype of jsonArray) {
        if(reptype.sections == undefined || reptype.sections == null){
            jsforcsv.push(reptype);

        } else {
            if (!Array.isArray(reptype.sections)) reptype.sections = [reptype.sections];
            for (var section of reptype.sections) {

                if(section.columns == undefined || section.columns == null){
                    jsforcsv.push({...reptype, sections_label: section.label, sections_name: section.name});

                } else {
                    if (!Array.isArray(section.columns)) section.columns = [section.columns];
                    for(var column of section.columns){
                        jsforcsv.push({...reptype, sections_label: section.label, sections_name: section.name, sections_columns_label: column.label, sections_columns_name: column.name});

                    }


                }

            }
        }
        
    }

    for(var entry of jsforcsv){
        for(const attr of Object.keys(entry)){
            if(Array.isArray(attr)){
                entry.delete(attr);
            }
        }
    }
    return jsforcsv;
}

// <reportTypes>
//         <description><!-- CasosMod --></description>
//         <label><!-- CasosMod --></label>
//         <name>Casos</name>
//         <sections>
//             <label><!-- Cases --></label>
//             <name>Cases</name>
//         </sections>
//         <sections>
//             <columns>
//                 <label><!-- Location /Municipality --></label>
//                 <name>Location /Municipality</name>
//             </columns>
//             <label><!-- Field Address --></label>
//             <name>Field Address</name>
//         </sections>
//     </reportTypes>


export function transformCSVtoXML(jsonArray) {
    var jsonArrayForXML = []
    var obj = {}
    var prevPicklist: string;
    for (var entry of jsonArray) {

        if (entry.picklist !== prevPicklist) {
            if (prevPicklist != undefined) jsonArrayForXML.push(obj);
            obj = { picklist: entry.picklist, values: [{ fullName: entry.values_fullName, default: entry.values_default }] };
            prevPicklist = entry.picklist
        } else {
            obj['values'].push({ fullName: entry.values_fullName, default: entry.values_default })
        }
    }
    jsonArrayForXML.push(obj);
    return jsonArrayForXML;
}