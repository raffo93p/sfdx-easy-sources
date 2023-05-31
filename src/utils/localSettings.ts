import { SETTINGS_PATH } from "./constants/constants";

const fs = require('fs-extra');


export function loadSettings() {
	const settings = fs.existsSync(SETTINGS_PATH) ? JSON.parse(fs.readFileSync(SETTINGS_PATH)) : {};
    return settings;
}

export function initSettings(flags: {}) {

}