import { Builder } from "xml2js";
import { XML_PART_EXTENSION } from "./constants/constants";

export default class XmlFormatter {

	constructor() { }

	formatXml(data: any, file: string): string {
		const xmlBuilder = new Builder({
			// explicitNull: true,
			renderOpts: {
				pretty: true,
				indent: '    '
			},
		});
		var xml = xmlBuilder.buildObject(data);

		// we replace self-closing tags with the full form as salesforce uses
		// we only allow self-closing tags in -part.xml files, just to avoid confusion with already splitted files
		if(!file.endsWith(XML_PART_EXTENSION)){
			const regex = /<(\w+)\s*\/>/g;
			xml = xml.replace(regex, '<$1></$1>');
		}
		xml = xml.replaceAll("&#xD;", "") + '\n';
		xml = xml.replace('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>', '<?xml version="1.0" encoding="UTF-8"?>');
		return xml;
	}

}