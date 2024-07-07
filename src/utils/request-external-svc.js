'use strict';

import { logger } from 'lib-finance-service';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';

const header = 'util: request-external-svc';
const log = logger(header);

let externalSvcConfig = {};

const initializeSvc = (protocol, port) => {
    log.info('External service config started');
    const host = process.env.NODE_ENV == 'dev' ? `${protocol}://localhost:${port}` : ``;
    const agent = process.env.NODE_ENV == 'dev' && protocol === 'https' ? new https.Agent({  
        rejectUnauthorized: false
    }) : null;

    externalSvcConfig.host = host;
    externalSvcConfig.agent = agent;
    log.info('External service config completed');
}

const sendRequest = async(path, method, payload, accessToken = null, jsonData = null, files = null) => {
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

        if(files && files.length > 0) {
            const formData = new FormData();
            
            for (const file of files) {
                formData.append(file.fieldname, file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype
                });
            }
            
            for (let key in payload) {
                if (payload.hasOwnProperty(key)) {
                    formData.append(key, payload[key]);
                }
            }

            options.headers = {
                'Content-Type': 'multipart/form-data',
                ...formData.getHeaders()
            };
            options.data = formData;
        }

        if (accessToken) {
            options.headers = { ...options.headers, Authorization: 'Bearer ' + accessToken };
        }
        if (externalSvcConfig.agent) {
            options.httpsAgent = externalSvcConfig.agent;
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

const callExternalSvc = async(protocol, port, originalUrl, method, payload, accessToken, files) => {
    initializeSvc(protocol, port);
    return await sendRequest(originalUrl, method, payload, accessToken, null, files);
}

export default callExternalSvc;
