"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Azure = __importStar(require("@azure/storage-blob"));
const fs_1 = require("fs");
const util_1 = require("util");
const path_1 = require("path");
const core_1 = __importDefault(require("@actions/core"));
async function run() {
    try {
        const account = core_1.default.getInput('account', { required: true });
        const container = core_1.default.getInput('container', { required: true });
        const dir = core_1.default.getInput('directory', { required: true });
        const accountKey = process.env.AZURE_ACCOUNT_KEY;
        const token = process.env.AZURE_STORAGE_TOKEN;
        let credit;
        if (typeof accountKey === 'string') {
            credit = new Azure.SharedKeyCredential(account, accountKey);
            core_1.default.info('Found and use SharedKeyCredential (accountKey)');
        }
        else if (typeof token === 'string') {
            credit = new Azure.TokenCredential(token);
            core_1.default.info('Found and use TokenCredential');
        }
        else {
            credit = new Azure.AnonymousCredential();
            core_1.default.info('Not found any credential. Use AnonymousCredential. If you want assign credential, please assign env variable AZURE_ACCOUNT_KEY (your storage account key) or AZURE_STORAGE_TOKEN (your storage token)');
        }
        const pipeline = Azure.StorageURL.newPipeline(credit);
        const s = util_1.promisify(fs_1.stat);
        let files = await util_1.promisify(fs_1.readdir)(dir);
        await Promise.all(files.map(async (fileName) => {
            const filePath = path_1.join(dir, fileName);
            const fileStat = await s(filePath);
            if (fileStat.isDirectory()) {
                return;
            }
            const options = {
                blobHTTPHeaders: {}
            };
            if (fileName.endsWith("yml")) { // if the file is the yml file use yml format
                options.blobHTTPHeaders.blobContentType = 'text/x-yaml';
            }
            const blobURL = new Azure.BlockBlobURL(`https://${account}.blob.core.windows.net/${container}/${fileName}`, pipeline);
            core_1.default.info(`Upload ${fileName}`);
            await blobURL.upload(Azure.Aborter.none, () => fs_1.createReadStream(filePath), fileStat.size, options);
        }));
    }
    catch (error) {
        core_1.default.setFailed(error.message);
    }
}
if (require.main === module) {
    run();
}
//# sourceMappingURL=index.js.map