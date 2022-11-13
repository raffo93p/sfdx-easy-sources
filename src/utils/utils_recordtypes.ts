export function transformXMLtoCSV(jsonArray) {
    var jsforcsv = [];
    for (var pickfield of jsonArray) {
        for (var pickentry of pickfield.values) {
            jsforcsv.push({ picklist: pickfield.picklist, values_fullName: pickentry.fullName, values_default: pickentry.default })
        }
    }
    return jsforcsv;
}