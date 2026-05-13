import { format } from "fast-csv";

export default class CsvWriter {
    async toCsv(data: any[], headers: string[]): Promise<string> {
        const csvContent = await new Promise<string>((resolve, reject) => {
            let result = '';
            const csvStream = format({
                headers: [...headers, '_tagid'],
                includeEndRowDelimiter: false,
                quote: '"',
                quoteColumns: true,
                quoteHeaders: true
            });

            csvStream
                .on('data', (data) => result += data)
                .on('end', () => resolve(result))
                .on('error', reject);

            data.forEach(row => csvStream.write(row));
            csvStream.end();
        });
        return csvContent.replace(/&#xD;/g, "");
    }
}