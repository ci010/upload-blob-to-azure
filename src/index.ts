import { getInput, info, setFailed } from '@actions/core';
import { AnonymousCredential, BlockBlobClient, BlockBlobUploadOptions, StorageSharedKeyCredential } from '@azure/storage-blob';
import { createReadStream, readdir, stat } from "fs";
import { join } from 'path';
import { promisify } from 'util';


async function run() {
    try {
        const account = getInput('account', { required: true });
        const container = getInput('container', { required: true });
        const dir = getInput('directory', { required: true });

        const accountKey = process.env.AZURE_ACCOUNT_KEY;

        let credit: StorageSharedKeyCredential | AnonymousCredential;
        if (typeof accountKey === 'string') {
            credit = new StorageSharedKeyCredential(account, accountKey);
            info('Found and use SharedKeyCredential (accountKey)');
        } else {
            credit = new AnonymousCredential();
            info('Not found any credential. Use AnonymousCredential. If you want assign credential, please assign env variable AZURE_ACCOUNT_KEY (your storage account key) or AZURE_STORAGE_TOKEN (your storage token)');
        }
        const s = promisify(stat);

        const files = await promisify(readdir)(dir);

        await Promise.all(files.map(async (fileName) => {
            const filePath = join(dir, fileName);
            const fileStat = await s(filePath);

            if (fileStat.isDirectory()) {
                return;
            }

            const options: BlockBlobUploadOptions = {
                blobHTTPHeaders: {
                },
            };
            if (fileName.endsWith("yml")) { // if the file is the yml file use yml format
                options.blobHTTPHeaders!.blobContentType = 'text/x-yaml';
            }
            const client = new BlockBlobClient(`https://${account}.blob.core.windows.net/${container}/${fileName}`, credit)
            info(`Upload ${fileName}`);

            await client.upload(() => createReadStream(filePath),
                fileStat.size,
                options);
        }));
    } catch (error) {
        console.error(error)
        setFailed(error.message);
    }
}

if (require.main === module) {
    run();
}