import * as utils from '../utils/utils'
import {callbackFuncion, parseRessource, zipRessource} from '../functions'

export const zip = (event, context, callback) => {
  //utils.showContext({ event: event })
  parseRessource({event: event, zips: []})
    .then(zipRessource)
    .then(data => {
      utils.log('ZIPEADOS');
      callbackFuncion(event,true,data)
    })
    .catch(err => {
      utils.log('ZIPEADOS ERROR');
      callbackFuncion(event,false,err)
    })
}