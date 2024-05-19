'use strict';

import { logger } from 'lib-finance-service';
import axios from 'axios';

const header = 'util: request-external-svc';
const log = logger(header);

let externalSvcConfig = {};

const initializeSvc = (port) => {
    log.info('External service config started');
    const host = process.env.NODE_ENV == 'dev' ? `http://localhost:${port}` : ``;
    externalSvcConfig.host = host;
    log.info('External service config completed');
}

const sendRequest = async(path, method, payload, accessToken = null, jsonData = null) => {
    log.info('Execution of external service request started');

    try {
        let baseUrl = `${externalSvcConfig.host}${path}`;
        let options = {
            method: method,
            url: baseUrl,
            baseUrl: baseUrl,
            data: payload,
            timeout: 50000,
            headers: { accept: 'application/json, text/plain, */*', 'content-type': 'application/json' },
            responseType: 'json'
        };

        if (accessToken) {
            options.headers = { ...options.headers, Authorization: 'Bearer ' + accessToken };
        }

        let response;
        await axios(options).then(res => {
            response = {
                resType: res.data.type,
                resMsg: res.data.message,
                data: res.data.data,
                isValid: res.data.success
            };
        }).catch(err => {
            response = {
                resType: err.response.data.type,
                resMsg: err.response.data.errors,
                data: err.response.data.data,
                isValid: false
            };
        });
        log.info('Execution of external service request is successfully completed');
        return response;
    } catch (err) {
        log.error('Internal Error occurred while calling the external service');
        next({
            resType: 'INTERNAL_SERVER_ERROR',
            resMsg: err,
            stack: err.stack,
            isValid: false
        });
    }
}

const callExternalSvc = async(port, originalUrl, method, payload, accessToken) => {
    initializeSvc(port);
    return await sendRequest(originalUrl, method, payload, accessToken);
}

export default callExternalSvc;
