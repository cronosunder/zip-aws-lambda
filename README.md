
# zip-aws-lambda

AWS Lambda to zip ressources as stream between S3 buckets

Install Typescript
`yarn add typescript -g`
or
`npm install -g typescript`

`yarn install or npm install`

`tsc *.ts`

## How to use

### Event properties

see example: https://github.com/iiAku/zip-aws-lambda/blob/master/events/test.json

**Required**

bucket.source **[string]**: Bucket name where your files are located

bucket.destination **[string]**: Bucket name where you want to upload your zipped file

Keys **string[]**: Array of filename (string) of each file you need to include into your zip file

**optional**
outputFilename **[string]** if not provided you'll get an uuid as filename

### Run lambda locally
`serverless invoke local -f zip -p events/test.json`

### Empaquetar lambda
`serverless package`
### Deploy lambda
`serverless deploy -s lambda`

Se deja como nombre del deploy ``zip-aws`` para que cuando deployemos con stage `lambda` el nombre final del stak sea *`zip-aws-lambda`*
Se creara el zip en la carpeta .serverless


Note:

In config.ts you can also set the maxPartSize and concurentPart. Since AWS is applying a 10000 chunk part limit for multipart upload, if you are doing huge upload please increase/decrease default values depending on your needs.

See this:

https://www.npmjs.com/package/s3-upload-stream#streammaxpartsizesizeinbytes
