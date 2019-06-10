import * as utils from '../utils/utils'
import { parseRessource, zipRessource } from '../functions'
import * as chalk from "chalk";

export const zip = (event, context, callback) => {
  //utils.showContext({ event: event })
  parseRessource({ event: event, zips: [] })
    .then(zipRessource)
    .then(data => {
      utils.log('ZIPEADOS');
    })
    .catch(err => {
      utils.log('ZIPEADOS ERROR');
    })
}