import {config} from './config'
import * as utils from './utils/utils'
import {file} from './utils/File'

import * as aws from 'aws-sdk'
import * as _ from 'lodash'
import * as archiver from 'archiver'
import * as pump from 'pump'
import * as async from 'async'
import * as s3s from 's3-upload-stream'
import * as uuidv4 from 'uuid/v4'
import * as chalk from 'chalk'

export const zipRessource: any = (data: any) => {
  // @ts-ignore
  return new Promise((resolve: any, reject: any) => {
    const s3: any = new aws.S3()
    const archive = archiver('zip', {store: true}).on('error', (err: any) => {
      reject(err)
    })
    archive.setMaxListeners(0)
    const output = data.outputZip
    const uploadStream = s3s(new aws.S3()).upload(output.s3.get())
    uploadStream.maxPartSize(config.maxPartSize)
    uploadStream.concurrentParts(config.concurrentParts)
    uploadStream
      .on('uploaded', (details) => resolve(data))
    pump(archive, uploadStream, (err: any) => {
      if (err) {
        reject(err)
      }
    })

    async.eachSeries(data.zipFiles, (zipFile, cb) => {
      let once = false;
      const parameters: any = zipFile.s3.get()
      s3.headObject(parameters, (err: any, data: any) => {
        if (err) {
          if (err.code == 'NotFound') {
            utils.log('NO ENCONTRO EL ARCHIVO', chalk.default(JSON.stringify(parameters)))
            cb()
          } else {
            cb(err)
          }
        } else {
          archive.append(s3.getObject(parameters).createReadStream(), {name: zipFile.name})
            .on('progress', (details) => {
              if (details.entries.total === details.entries.processed && once === false) {
                once = true
                cb()
              }
            })
        }
      })
    }, (err) => {
      if (err) {
        reject(err)
      }
      archive.finalize()
      utils.log('FIN', chalk.default())
    })
  })
}

export const parseRessource = (data: any) => {
  // @ts-ignore
  return new Promise((resolve: any, reject: any) => {
    var procesarEvento = function (event) {

      utils.log('EVENTO', chalk.default(JSON.stringify(event)));
      if (!_.isEmpty(event.buckets.source) && !_.isEmpty(event.buckets.destination) && !_.isEmpty(event.Keys)) {
        event.outputFilename = !_.isEmpty(event.outputFilename) ? event.outputFilename : uuidv4()
        data.outputZip = file({path: config.tempPath + '/' + event.outputFilename + '.' + config.extensions.zipOutput, bucket: event.buckets.destination})
        data['zipFiles'] = event.Keys.map((key) => {
          let item: any = {
            Bucket: event.buckets.source,
            Key: key
          }
          return file({path: config.tempPath + '/' + item.Key, bucket: item.Bucket})
        })
        utils.log('Your bucket source (files)', chalk.default(event.buckets.source))
        //utils.log('Content of your zip', data.zipFiles.map(file => file.name))
        utils.log('Your bucket destination (zip)', chalk.default(event.buckets.destination))
        utils.log('Your zip filename', chalk.default(event.outputFilename))
        resolve(data)
      } else {
        reject({
          err: {
            required: {
              "buckets": {
                "source": "",
                "destination": ""
              },
              "Keys": [],
              "outputFilename": "(optional)"
            }
          },
          provided: data.event
        })
      }
    }
    if (data.hasOwnProperty('event')) {
      var event = data.event
      if (!!data.event.s3Request) {
        const s3: any = new aws.S3()
        utils.log('EVENTO DESDE S3 : ', chalk.default(data.event.s3Request));
        var partes = data.event.s3Request.split("/");
        var bucket = partes[0];
        var key = data.event.s3Request.replace("/"+bucket+"/","").replace(""+bucket+"/","");
        var getParams = {
          Bucket: bucket, //replace example bucket with your s3 bucket name
          Key: key // replace file location with your s3 file location
        }
        s3.getObject(getParams, function (err, data) {
          if (err) {
            //console.error(err)
            reject({
              err: {
                required: {
                  "buckets": {
                    "source": "",
                    "destination": ""
                  },
                  "Keys": [],
                  "outputFilename": "(optional)"
                }
              }
            })
          } else {
            var req = data.Body.toString();
            event = JSON.parse(req);
            procesarEvento(event)
          }
        })
      } else {
        procesarEvento(event)
      }

    } else {
      reject({err: 'Event is not provided'})
    }
  })
}

export const callbackFuncion: any = (context, event: any, ok: any, data: any) => {
  utils.log('CALLBACK FINALIZO OK', chalk.default(ok));
  if (!!event.callback) {
    //utils.log('CALLBACK EVENTO', chalk.default(JSON.stringify(event)))
    //utils.log('CALLBACK DATOS', chalk.default(JSON.stringify(data)))
    var lambda = new aws.Lambda({apiVersion: '2015-03-31'});
    var params = event.callback;
    params.Payload.status = ok ? 'si' : 'no';
    params.Payload = JSON.stringify(params.Payload);
    utils.log('request', chalk.default(JSON.stringify(params)));
    lambda.invoke(params, function (err, data) {
      if (err) {
        utils.log('LLAMADA EJECUTADA ERROR',chalk.default(JSON.stringify(err)))
        context.fail(err);
      } else {
        utils.log('LLAMADA EJECUTADA ')
        context.succeed("LLAMDA EJECUTADA");
      }
    })
  } else {
    utils.log('NO SE NOTIFICA', chalk.default(ok))
  }
}