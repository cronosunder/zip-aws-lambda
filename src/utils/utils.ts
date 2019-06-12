import * as _ from 'lodash'
import * as moment from 'moment'
import * as aws from 'aws-sdk'

const seguimiento = uuidv4()
var  esLLamadaLocal = false
export const isLocal = (local) =>{
  esLLamadaLocal=local?true:false;
  try{
    var table = "logs";
    var docClient = new aws.DynamoDB.DocumentClient();

    var params = {
      TableName:table,
      Item:{
        "ambiente": "desarrollo",
        "fecha": new Date().toLocaleString(),
        "logGroup": process.env.AWS_LAMBDA_LOG_GROUP_NAME,
        "logStream": process.env.AWS_LAMBDA_LOG_STREAM_NAME,
        "pais": "cl",
        "permiso": "Desconocido",
        "seguimientoId": seguimiento,
        "usuarioId": "0"
      }
    };
    if(esLLamadaLocal){
      console.log(JSON.stringify(params));
    }
    docClient.put(params, function(err, data) {
      if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
      } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
      }
    });
  }catch (e) {

  }
}
export const seguimientoId = () =>{
  return seguimiento;
}
export const log = (str_a, str_b ? ) => {
  if(false && esLLamadaLocal) {
    if (str_b) {
      console.log(seguimiento + ' [' + moment().format() + '] ' + str_a, (_.isString(str_b)) ? str_b : "\n" + JSON.stringify(str_b, null, 2))
    } else {
      console.log(seguimiento + ' [' + moment().format() + '] ', (_.isString(str_a)) ? str_a : "\n" + JSON.stringify(str_a, null, 2))
    }
  }else{
    var baseSeguimiento = {
      "seguimientoId": seguimiento,
      "fecha": moment().format(),
      "tipo": "INFO",
      "function": "zip-aws",
      "version": "$LATEST",
      "mensaje":""
    };
    if (!!str_b) {
      baseSeguimiento.mensaje = (str_a+" "+ (_.isString(str_b) ? str_b : "\n" + JSON.stringify(str_b, null, 2)))

    } else {
      baseSeguimiento.mensaje =(_.isString(str_a)) ? str_a : "\n" + JSON.stringify(str_a, null, 2)
    }
    console.log(JSON.stringify(baseSeguimiento))
  }
}

export const showContext = (data: any) => {
  console.log('-------- EVENT --------')
  console.log(JSON.stringify(data.event, null, 3))
  console.log('--------  ENV  --------')
  console.log('SERVERLESS_STAGE', process.env.SERVERLESS_STAGE)
  console.log('SERVERLESS_PROJECT', process.env.SERVERLESS_PROJECT)
  console.log('SERVERLESS_SERVICE_NAME', process.env.SERVERLESS_SERVICE_NAME)
  console.log(process.env)
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}