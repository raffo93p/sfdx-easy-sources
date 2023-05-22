import { Builder } from "xml2js";

export default class XmlFormatter {

	constructor() { }

	formatXml(data: any): string {
		const xmlBuilder = new Builder({
			renderOpts: {
				pretty: true,
				indent: '    '
			},
		});
		const xml = xmlBuilder.buildObject(data);
		return xml.replaceAll("&#xD;", "") + '\n';
	}

}