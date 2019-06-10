import * as utils from '../utils/utils'
import {callbackFuncion, parseRessource, zipRessource} from '../functions'

export const zip = (event, context, callback) => {
  utils.isLocal(process.env && process.env.IS_LOCAL)
  //utils.showContext({ event: event })
  parseRessource({event: event, zips: []})
    .then(zipRessource)
    .then(data => {
      utils.log('ZIPEADOS');
      callbackFuncion(context,event,true,data)
    })
    .catch(err => {
      utils.log('ZIPEADOS ERROR');
      callbackFuncion(context,event,false,err)
    })
}