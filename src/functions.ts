import { config } from './config'
import * as utils from './utils/utils'
import { file } from './utils/File'

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
    const archive = archiver('zip', { store: true }).on('error', (err: any) => { reject(err) })
    archive.setMaxListeners(0)
    const output = data.outputZip
    utils.log('ZIP FILES', chalk.default())
    const uploadStream = s3s(new aws.S3()).upload(output.s3.get())
    utils.log('ZIP FILES 2', chalk.default())
    uploadStream.maxPartSize(config.maxPartSize)
    uploadStream.concurrentParts(config.concurrentParts)
    utils.log('ZIP FILES 3', chalk.default())
    uploadStream
      .on('uploaded', (details) => resolve(data))
    utils.log('ZIP FILES 4', chalk.default())
    pump(archive, uploadStream, (err: any) => {
      if (err) {
        reject(err)
      }
    })
    utils.log('ZIP FILES 5', chalk.default())
    async.eachSeries(data.zipFiles, (zipFile, cb) => {
      utils.log('ZIP FILES 6', chalk.default(JSON.stringify(zipFile)))
      let once = false;
      const parameters: any = zipFile.s3.get()
      utils.log('ZIP FILES 7', chalk.default(JSON.stringify(parameters)))
      s3.headObject(parameters, (err: any, data: any) => {
        if (err) {
          utils.log('ZIP FILES 8.1', chalk.default(JSON.stringify(err)))
          cb(err)
        } else {
          utils.log('ZIP FILES 8.2', chalk.default())
          archive.append(s3.getObject(parameters).createReadStream(), { name: zipFile.name })
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
    })
  })
}

export const parseRessource = (data: any) => {
  // @ts-ignore
  return new Promise((resolve: any, reject: any) => {
    if (data.hasOwnProperty('event')) {
      const event = data.event
      if (!_.isEmpty(event.buckets.source) && !_.isEmpty(event.buckets.destination) && !_.isEmpty(event.Keys)) {
        event.outputFilename = !_.isEmpty(event.outputFilename) ? event.outputFilename : uuidv4()
        data.outputZip = file({ path: config.tempPath + '/' + event.outputFilename + '.' + config.extensions.zipOutput, bucket: event.buckets.destination })
        data['zipFiles'] = event.Keys.map((key) => {
          let item: any = {
            Bucket: event.buckets.source,
            Key: key
          }
          return file({ path: config.tempPath + '/' + item.Key, bucket: item.Bucket })
        })
        utils.log('Your bucket source (files)', chalk.default(event.buckets.source))
        utils.log('Content of your zip', data.zipFiles.map(file => file.name))
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
    } else {
      reject({ err: 'Event is not provided' })
    }
  })
}