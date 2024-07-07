'use strict';

import { dbConnection, logger } from 'lib-finance-service';
import app from './app.js';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config({
    path: './env'
});

const log = logger('gateway-connection');

const options = {
    key: process.env.SSL_KEY,
    cert: process.env.SSL_CERT
};
const HTTP_PORT = process.env.PORT || 5080;
const HTTPS_PORT = process.env.HTTPS_PORT || 6000;

dbConnection()
.then(() => {
    app.listen(HTTP_PORT, () => {
        log.info(`Server is running on PORT: ${HTTP_PORT}`);
    });
    https.createServer(options, app).listen(HTTPS_PORT, () => {
        log.info(`Service Gateway HTTPS Server is running on PORT: ${HTTPS_PORT}`);
    });
}).catch((err) => {
    log.error(`DB Connection Failed!, ${err}`);
});
