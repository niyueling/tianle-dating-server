/**
 *
 * Created by user on 2016-07-02.
 */
import * as express from 'express';
import * as http from 'http';
import * as ws from 'ws';
import * as logger from 'winston';
import * as Promise from 'promise';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as request from 'request';
import listeners from './network/listeners';
import Database from './database/database';
import * as config from './config';
import {initPlayerShortId, initClubShortId, initPlayerInviteCode} from './database/init';
import api from './api'
import {service} from "./service/importService";
import * as rabbitMq from 'amqplib'
import PlayerManager from "./player/player-manager";

logger.level = config.logger.level || 'info';
if (config.logger.filename) {
  logger.add(logger.transports.File, {filename: config.logger.filename});
}

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

// start http.
function startHttpServer(callback) {
  const server = new http.Server(app);

  app.get('/', (req, res) => (
    res.send('<h1>Hello world!</h1>')
  ));

  app.use(cors({
    origin: '*',
  }));
  app.use('/public', express.static(`${__dirname}/../public`));

  app.get('/head', function (req, res) {
    let url = req.query.url || ''
    url = url.replace('.png', '') || 'http://wx.qlogo.cn/mmopen/vi_32/PiajxSqBRaEIrBEU3kqpPyp5DaY7bibfhEic2CuWdDFEjN9UJqcPeKmvhmK8RVLfjiaM2oKicAgrMNY0AicuSkZPR2ibQ/0'
    request.get(encodeURI(url))
      .pipe(res)
  })


  const port = config.http.port;
  server.listen(port, '::', () => {
    logger.info(`listening on *:${port}`);
    callback();
  });
}

// start websocket.
function startWebSocketServer(callback) {
  const WebSocketServer = ws.Server;
  const wss = new WebSocketServer({host: '::', port: config.websocket.port}, callback);
  wss.on('connection', listeners.onConnect);
}

const httpPromise = Promise.denodeify(startHttpServer)();

const websocketPromise = Promise.denodeify(startWebSocketServer)();

const databasePromise = Database.connect(config.database.url, config.database.opt);

const injectRabbitMq = async () => {
  const connection = await rabbitMq.connect(config.rabbitmq.url);
  PlayerManager.injectRmqConnection(connection);
}

databasePromise.then(() => {
  initPlayerShortId();
  initClubShortId();
  initPlayerInviteCode();
});

app.startPromise = Promise.all([databasePromise, httpPromise, websocketPromise,
  injectRabbitMq(), service.utils.listenFromAdminByDating()])
  .catch((e) => logger.error(e));


app.use(api)

export default app;
