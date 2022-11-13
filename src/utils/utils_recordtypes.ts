export function transformXMLtoCSV(jsonArray) {
    if(!Array.isArray(jsonArray)) jsonArray = [jsonArray];

    var jsforcsv = [];
    for (var pickfield of jsonArray) {

        if(!Array.isArray(pickfield.values)) pickfield.values = [pickfield.values];
        for (var pickentry of pickfield.values) {

            jsforcsv.push({ picklist: pickfield.picklist, values_fullName: pickentry.fullName, values_default: pickentry.default })
        }
    }
    return jsforcsv;
}