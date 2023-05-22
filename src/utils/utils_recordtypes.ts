export function transformXMLtoCSV(jsonArray) {
    if (!Array.isArray(jsonArray)) jsonArray = [jsonArray];

    var jsforcsv = [];
    for (var pickfield of jsonArray) {

        if (!Array.isArray(pickfield.values)) pickfield.values = [pickfield.values];
        for (var pickentry of pickfield.values) {

            jsforcsv.push({ picklist: pickfield.picklist, values_fullName: pickentry.fullName, values_default: pickentry.default })
        }
    }
    return jsforcsv;
}

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