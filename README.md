# GitHub Action - Upload Blob to Azure Storage

This GitHub Action (written in JavaScript) wraps the [Azure Storage Blob NPM Package](https://www.npmjs.com/package/@azure/storage-blob) to allow you to upload file to azure storage blob in workflow.

## Usage

### Pre-requisites
Create a workflow `.yml` file in your `.github/workflows` directory. An [example workflow](#example-workflow---upload-your-build-to-azure-storage) is available below.

Also, you might want to get your storage account key in azure portal, and put it in your repository secrets section

### Inputs

- `account`: The azure storage account name
- `container`: The container in provided azure storage
- `directory`: The directory containing your files to upload to azure storage container.

This workflow will `readdir` to your input `directory`, and it will upload all the file with its original name to the azure storage container. It will skip the directory inside the directory. So, no nested upload supported now.

If you really want something like glob pattern matching to supporte nested file scan. Let me know or make the PR.

### Environment Variable Requirement

- `AZURE_ACCOUNT_KEY`: You azure storage account key. You can found this in `Access keys` page of your storage account.

If this is not provided, it will use [AnonymousCredential](https://github.com/Azure/azure-sdk-for-js/blob/master/sdk/storage/storage-blob/src/credentials/AnonymousCredential.ts)

### Example workflow - upload your build to azure storage

On every `push`.

```yaml
on:
  push:

name: Build

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v2
      - name: Build
        runs: |
            npm run build
      - name: Upload to azure
        uses: ci010/upload-blob-to-azure@master
        with:
          account: your-storage-account
          container: the-container-to-upload
          directory: ./build
        env:
          AZURE_ACCOUNT_KEY: ${{ secrets.AZURE_ACCOUNT_KEY }}
```

This will upload all the files under `./build` directory under your repository. It will skip to dive into the nested directory.

## Contributing

Feel free to contribute. PRs are welcomed.

## License
The scripts and documentation in this project are released under the [MIT License](LICENSE)
