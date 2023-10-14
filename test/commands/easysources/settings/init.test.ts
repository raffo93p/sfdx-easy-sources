import { expect, test } from '@salesforce/command/lib/test';
import { SETTINGS_PATH } from "../../../../src/utils/constants/constants";

const fs = require('fs-extra');


describe('easysources:settings:init', function () {
    this.timeout(0);
    test
        .do(() => {
            // delete folder
            fs.removeSync(SETTINGS_PATH);
            expect(fs.existsSync(SETTINGS_PATH)).to.be.false;
        })
        .stdout()
        .command(['easysources:settings:init'])
        .it('runs easysources:settings:init', (ctx) => {
            const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH));
            expect(settings).to.have.property("salesforce-xml-path");
            expect(settings).to.have.property("easysources-csv-path");
            expect(settings).to.have.property("easysources-log-path");
            fs.removeSync(SETTINGS_PATH);
        });

});
