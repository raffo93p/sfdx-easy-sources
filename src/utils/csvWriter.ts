import { format } from "fast-csv";
import { loadSettings } from "./localSettings";

export enum CsvEngine {
    FAST_CSV = 'fast-csv',
    JSON2CSV = 'json2csv' // per backward compatibility
}

export default class CsvWriter {
    private readonly settings: any;

    constructor() {
        this.settings = loadSettings();
   
    }
    async toCsv(data: any[], headers: string[]): Promise<string> {
        const engine = this.settings['csv-engine'] === 'json2csv' ? CsvEngine.JSON2CSV : CsvEngine.FAST_CSV;

        let csvContent: string;
        
        // Scegli il motore CSV in base alla configurazione
        switch (engine) {
            case CsvEngine.FAST_CSV:
            default:
                // Usa fast-csv (default)
                csvContent = await new Promise<string>((resolve, reject) => {
                    let result = '';
                    const csvStream = format({ 
                        headers: [...headers, '_tagid'],
                        includeEndRowDelimiter: false,  // Non aggiungere newline finale
                        quote: '"',
                        quoteColumns: true,  // Forza le virgolette su tutte le colonne
                        quoteHeaders: true   // Forza le virgolette sui header
                    });
                    
                    csvStream
                        .on('data', (data) => result += data)
                        .on('end', () => resolve(result))
                        .on('error', reject);
                    
                    // Scrivi ogni riga con i dati processati
                    data.forEach(row => csvStream.write(row));
                    csvStream.end();
                });
                break;

            case CsvEngine.JSON2CSV:
                // Fallback al vecchio json2csv se necessario (usa gli header originali con unwind)
                const { Parser, transforms: { unwind } } = require('json2csv');
                const transforms = [unwind({ paths: headers })];
                const parser = new Parser({ fields: [...headers, '_tagid'], transforms });
                csvContent = parser.parse(data);
                break;
        }
        return csvContent.replace(/&#xD;/g, "");
    }
}