import * as utils from '../utils/utils'
import {callbackFuncion, parseRessource, zipRessource} from '../functions'
import * as aws from "aws-sdk";
import * as chalk from "chalk";

export const zip = (event, context, callback) => {
  utils.isLocal(process.env && process.env.IS_LOCAL)

  //utils.showContext({ event: event })
  function procesarEvento(event) {
    parseRessource({event: event, zips: []})
      .then(zipRessource)
      .then(data => {
        utils.log('ZIPEADOS');
        callbackFuncion(context, event, true, data)
      })
      .catch(err => {
        utils.log('ZIPEADOS ERROR');
        callbackFuncion(context, event, false, err)
      })
  }

  var event = event
  if (!!event.s3Request) {
    const s3: any = new aws.S3()
    utils.log('EVENTO DESDE S3 : ', chalk.default(event.s3Request));
    var partes = event.s3Request.split("/");
    var bucket = partes[0];
    var key = event.s3Request.replace("/" + bucket + "/", "").replace("" + bucket + "/", "");
    var getParams = {
      Bucket: bucket, //replace example bucket with your s3 bucket name
      Key: key // replace file location with your s3 file location
    }
    s3.getObject(getParams, function (err, data) {
      if (err) {
        //console.error(err)

      } else {
        var req = data.Body.toString();
        event = JSON.parse(req);
        procesarEvento(event)
      }
    })
  }else {
    procesarEvento(event)
  }

  //callback(null,{seguimientoId:utils.seguimientoId()})
}