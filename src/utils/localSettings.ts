import { DEFAULT_ESCSV_PATH, DEFAULT_LOG_PATH, DEFAULT_SFXML_PATH, SETTINGS_PATH } from "./constants/constants";

const fs = require('fs-extra');


export function loadSettings() {
	const settings = fs.existsSync(SETTINGS_PATH) ? JSON.parse(fs.readFileSync(SETTINGS_PATH)) : {};
    return settings;
}

export function initSettings() {
    const settings = {
        "salesforce-xml-path": DEFAULT_SFXML_PATH,
        "easysources-csv-path": DEFAULT_ESCSV_PATH,
        "easysources-log-path": DEFAULT_LOG_PATH,
        "ignore-user-permissions": true
    }
    return settings;
}