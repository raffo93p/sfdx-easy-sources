import { expect } from 'chai';
import { join } from 'path';
import os from 'os';
import fs from 'fs-extra';

import { objectTranslationSplit } from '../../../../src/commands/easysources/objecttranslations/split.js';
import { objectTranslationMinify } from '../../../../src/commands/easysources/objecttranslations/minify.js';
import { objectTranslationMerge } from '../../../../src/commands/easysources/objecttranslations/merge.js';
import { getFieldTranslationFiles } from '../../../../src/utils/utils_objtransl.js';

const NS = 'xmlns="http://soap.sforce.com/2006/04/metadata"';

function fieldXml(name: string, inner: string) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<CustomFieldTranslation ${NS}>\n${inner}    <name>${name}</name>\n</CustomFieldTranslation>\n`;
}

describe('easysources:objecttranslations field translations', function () {
    this.timeout(0);

    let tmp: string;
    let xmlDir: string;
    let objDir: string;
    const options = () => ({ 'sf-xml': xmlDir, 'es-csv': xmlDir, sort: 'true' });

    beforeEach(() => {
        tmp = fs.mkdtempSync(join(os.tmpdir(), 'objtransl-'));
        xmlDir = join(tmp, 'xml');
        objDir = join(xmlDir, 'objectTranslations', 'Case-it');
        fs.mkdirSync(objDir, { recursive: true });
        fs.writeFileSync(join(objDir, 'Case-it.objectTranslation-meta.xml'),
            `<?xml version="1.0" encoding="UTF-8"?>\n<CustomObjectTranslation ${NS}>\n    <gender>Masculine</gender>\n</CustomObjectTranslation>\n`);
        fs.writeFileSync(join(objDir, 'Translated__c.fieldTranslation-meta.xml'), fieldXml('Translated__c', '    <label>Tradotto</label>\n'));
        fs.writeFileSync(join(objDir, 'Empty__c.fieldTranslation-meta.xml'), fieldXml('Empty__c', '    <label></label>\n'));
        fs.writeFileSync(join(objDir, 'case_access.fieldTranslation-meta.xml'), fieldXml('case_access',
            '    <caseValues>\n        <plural>false</plural>\n        <value>Accesso case</value>\n    </caseValues>\n    <gender>Masculine</gender>\n'));
    });

    afterEach(() => {
        fs.removeSync(tmp);
    });

    it('lists only the files that can be represented in csv', () => {
        const files = getFieldTranslationFiles(objDir);
        expect(files.sort()).to.deep.equal(['Empty__c.fieldTranslation-meta.xml', 'Translated__c.fieldTranslation-meta.xml']);
    });

    it('split/minify/merge removes untranslated files and preserves the ones with unsupported tags', async () => {
        await objectTranslationSplit(options());
        await objectTranslationMinify(options());
        await objectTranslationMerge(options());

        expect(fs.existsSync(join(objDir, 'Translated__c.fieldTranslation-meta.xml'))).to.be.true;
        expect(fs.existsSync(join(objDir, 'Empty__c.fieldTranslation-meta.xml'))).to.be.false;
        expect(fs.existsSync(join(objDir, 'case_access.fieldTranslation-meta.xml'))).to.be.true;
        expect(fs.readFileSync(join(objDir, 'case_access.fieldTranslation-meta.xml'), 'utf8')).to.contain('Accesso case');
    });

    it('merge removes the stale files when minify leaves the csv without rows', async () => {
        fs.removeSync(join(objDir, 'Translated__c.fieldTranslation-meta.xml'));

        await objectTranslationSplit(options());
        await objectTranslationMinify(options());
        await objectTranslationMerge(options());

        expect(fs.existsSync(join(objDir, 'Empty__c.fieldTranslation-meta.xml'))).to.be.false;
        expect(fs.existsSync(join(objDir, 'case_access.fieldTranslation-meta.xml'))).to.be.true;
    });

    it('merge does not overwrite a protected file with a csv row of the same name', async () => {
        await objectTranslationSplit(options());

        const csvPath = join(xmlDir, 'objectTranslations', 'Case-it', 'csv', 'Case-it-fieldTranslations.csv');
        const csv = fs.readFileSync(csvPath, 'utf8');
        const header = csv.split('\n')[0];
        const row = header.split(',').map(col => (col === '"name"' || col === '"_tagid"' ? '"case_access"' : col === '"label"' ? '"Altro"' : '""')).join(',');
        fs.writeFileSync(csvPath, csv.trimEnd() + '\n' + row + '\n');

        await objectTranslationMerge(options());

        const content = fs.readFileSync(join(objDir, 'case_access.fieldTranslation-meta.xml'), 'utf8');
        expect(content).to.contain('Accesso case');
        expect(content).to.not.contain('Altro');
    });
});
