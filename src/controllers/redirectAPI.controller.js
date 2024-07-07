'use strict';

import { Types } from 'mongoose';
import { logger } from 'lib-finance-service';
import { findPathDetails, findServiceDetails } from '../db/dbQueries.js';

const header = 'controller: redirect-svc';
const log = logger(header);

const buildApiToCheck = (originalUrl) => {
    log.info('Execution for converting incoming endpoint to desired api started');
    
    const urlPattern = /^\/([^\/]+)\/(.*)$/;
    const match = originalUrl.match(urlPattern);
    if (!match) {
        log.error('Requested endpoint does not match basic pattern');
        res.status(400).send('Invalid request format');
        return {
            resType: 'BAD_REQUEST',
            resMsg: 'Invalid request format',
            isValid: false
        };
    }

    const svc = match[1];
    let endpoint = match[2];

    if (endpoint.includes('?')) {
        endpoint = endpoint.split('?')[0];
    }

    const tokenPattern = /^[a-zA-Z0-9]{128}$/;

    let endpointArr = endpoint.split('/');
    let api = endpointArr.map(item => Types.ObjectId.isValid(item) || tokenPattern.test(item) ? '.*' : item).join('\/');

    log.info('Successfully converted incoming endpoint into desired endpoint and svc to check');
    return {
        resType: 'SUCCESS',
        resMsg: 'VALIDATION SUCCESSFULL',
        data: {originalUrl, svc, api},
        isValid: true
    };
}

const checkIfEndpointAvailable = async(svc, endpoint, method, protocol) => {
    try {
        log.info('Execution for checking if requested endpoint is registered in a system');
        log.info('Call db query to check if the endpoing present in a system or not');
        const endpointDetails = await findPathDetails(svc, endpoint, method);
        const serviceDetails = await findServiceDetails(svc, process.env.NODE_ENV, protocol)

        if (!endpointDetails || !serviceDetails) {
            log.error('Requested endpoint not found in a system');
            return {
                resType: 'NOT_FOUND',
                resMsg: 'Requested endpoint not found in a system',
                isValid: false
            };
        }

        log.info('Execution for checking existing endpoint completed');
        return {
            resType: 'SUCCESS',
            resMsg: 'VALIDATION SUCCESSFULL',
            data: {endpointDetails, serviceDetails},
            isValid: true
        };
    } catch (err) {
        log.error('Error while working with db to check if endpoint registerd in a system');
        return {
            resType: 'INTERNAL_SERVER_ERROR',
            resMsg: 'Some error occurred while working with db to check if endpoint registerd in a system',
            stack: err.stack,
            isValid: false
        };
    }
}

export {
    buildApiToCheck,
    checkIfEndpointAvailable
};
