/**
 * Alternative ultra-fast CSV writer implementation
 * Ottimizzata specificatamente per il caso d'uso di sfdx-easy-sources
 * Può essere 5-10x più veloce di json2csv per grandi dataset
 */

export interface FastCsvOptions {
    headers: string[];
    delimiter?: string;
    quote?: string;
    escape?: string;
    includeHeaders?: boolean;
}

/**
 * Converte array di oggetti JSON in stringa CSV in modo ultra-performante
 * @param data Array di oggetti da convertire
 * @param options Opzioni per la conversione
 * @returns Stringa CSV
 */
export function jsonArrayToCsvFast(data: any[], options: FastCsvOptions): string {
    const { 
        headers, 
        delimiter = ',', 
        quote = '"', 
        escape = '"', 
        includeHeaders = true 
    } = options;

    if (!data || data.length === 0) {
        return includeHeaders ? headers.join(delimiter) + '\n' : '';
    }

    const result: string[] = [];
    
    // Aggiungi header se richiesto (con virgolette)
    if (includeHeaders) {
        const quotedHeaders = headers.map(h => quote + h + quote);
        result.push(quotedHeaders.join(delimiter));
    }

    // Pre-compila regex per performance
    const escapeRegex = new RegExp(quote, 'g');

    // Funzione inline per escape veloce
    const escapeValue = (value: any): string => {
        if (value === null || value === undefined) {
            return '""';  // Virgolette anche per valori vuoti
        }
        
        const stringValue = String(value);
        
        // Sempre wrappa con virgolette per consistenza con json2csv
        return quote + stringValue.replace(escapeRegex, escape + quote) + quote;
    };

    // Processa ogni riga
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const csvRow: string[] = new Array(headers.length);
        
        // Usa loop for tradizionale per performance massima
        for (let j = 0; j < headers.length; j++) {
            csvRow[j] = escapeValue(row[headers[j]]);
        }
        
        result.push(csvRow.join(delimiter));
    }

    return result.join('\n');
}

/**
 * Versione streaming per dataset molto grandi
 * Usa meno memoria ma mantiene alta performance
 */
export function* jsonArrayToCsvStream(data: any[], options: FastCsvOptions): Generator<string, void, unknown> {
    const { 
        headers, 
        delimiter = ',', 
        quote = '"', 
        escape = '"', 
        includeHeaders = true 
    } = options;

    // Pre-compila regex per performance
    const escapeRegex = new RegExp(quote, 'g');

    const escapeValue = (value: any): string => {
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        return quote + stringValue.replace(escapeRegex, escape + quote) + quote;
    };

    // Yield header (con virgolette)
    if (includeHeaders) {
        const quotedHeaders = headers.map(h => quote + h + quote);
        yield quotedHeaders.join(delimiter) + '\n';
    }

    // Yield ogni riga (l'ultima senza newline finale)
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const csvRow: string[] = new Array(headers.length);
        for (let j = 0; j < headers.length; j++) {
            csvRow[j] = escapeValue(row[headers[j]]);
        }
        
        // Aggiungi newline solo se non è l'ultima riga
        const isLastRow = i === data.length - 1;
        yield csvRow.join(delimiter) + (isLastRow ? '' : '\n');
    }
}

/**
 * Wrapper per compatibilità con l'API esistente
 */
export class FastCsvWriter {
    private options: FastCsvOptions;

    constructor(options: FastCsvOptions) {
        this.options = options;
    }

    parse(data: any[]): string {
        return jsonArrayToCsvFast(data, this.options);
    }

    stream(data: any[]): Generator<string, void, unknown> {
        return jsonArrayToCsvStream(data, this.options);
    }
}