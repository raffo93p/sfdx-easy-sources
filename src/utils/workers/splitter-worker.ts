import { isMainThread, parentPort } from 'worker_threads';
import { processSingleFile, SplitFileOptions } from '../commands/splitter';

// Worker thread execution - use the generic processSingleFile function
if (!isMainThread && parentPort) {
    parentPort.on('message', async (data: SplitFileOptions) => {
        const result = await processSingleFile(data);
        parentPort!.postMessage(result);
    });
}
