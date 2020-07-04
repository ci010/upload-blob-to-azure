import * as Azure from '@azure/storage-blob';
import { stat, readdir, createReadStream } from "fs";
import { promisify } from 'util';
import { join } from 'path';
import { getInput, setFailed, info } from '@actions/core';

async function run() {
    try {
        const account = getInput('account', { required: true });
        const container = getInput('container', { required: true });
        const dir = getInput('directory', { required: true });

        const accountKey = process.env.AZURE_ACCOUNT_KEY;
        const token = process.env.AZURE_STORAGE_TOKEN;

        let credit: Azure.Credential;
        if (typeof accountKey === 'string') {
            credit = new Azure.SharedKeyCredential(account, accountKey);
            info('Found and use SharedKeyCredential (accountKey)');
        } else if (typeof token === 'string') {
            credit = new Azure.TokenCredential(token);
            info('Found and use TokenCredential');
        } else {
            credit = new Azure.AnonymousCredential();
            info('Not found any credential. Use AnonymousCredential. If you want assign credential, please assign env variable AZURE_ACCOUNT_KEY (your storage account key) or AZURE_STORAGE_TOKEN (your storage token)');
        }
        const pipeline = Azure.StorageURL.newPipeline(credit);
        const s = promisify(stat);

        let files = await promisify(readdir)(dir);

        await Promise.all(files.map(async (fileName) => {
            const filePath = join(dir, fileName);
            const fileStat = await s(filePath);

            if (fileStat.isDirectory()) {
                return;
            }

            const options: Azure.IBlockBlobUploadOptions = {
                blobHTTPHeaders: {
                }
            };
            if (fileName.endsWith("yml")) { // if the file is the yml file use yml format
                options.blobHTTPHeaders!.blobContentType = 'text/x-yaml';
            }
            const blobURL = new Azure.BlockBlobURL(`https://${account}.blob.core.windows.net/${container}/${fileName}`, pipeline);
            info(`Upload ${fileName}`);
            await blobURL.upload(Azure.Aborter.none,
                () => createReadStream(filePath),
                fileStat.size,
                options);
        }));
    } catch (error) {
        setFailed(error.message);
    }
}

if (require.main === module) {
    run();
}