'use strict';

import { buildApiResponse, responseCodes, logger, verifyToken } from 'lib-finance-service';
import { buildApiToCheck, checkIfEndpointAvailable } from '../controllers/index.js';
import callExternalSvc from '../utils/request-external-svc.js';

const header = 'route: redirect-svc';
const msg = 'API redirect router started';

const log = logger(header);

// API Function
const redirectAPI = async(req, res, next) => {
    log.info(msg);

    try {
        const payload = req.body;
        const accessToken = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
        const method = req.method;
        const files = req.files;

        log.info('Call controller funciton to build api endpoint to check');
        const toCheckAPI = buildApiToCheck(req.originalUrl);
        if (!toCheckAPI.isValid) {
            throw toCheckAPI;
        }

        const {originalUrl, svc, api} = toCheckAPI.data;

        log.info('Call controller function to check if requested endpoint exists in a system');
        const endpointFound = await checkIfEndpointAvailable(svc, api, method);
        if (!endpointFound.isValid) {
            throw endpointFound;
        }

        let isAuth = endpointFound;
        if (endpointFound.data.validations.includes('requiresAuth')) {
            log.info('Call controller function to check if user is authenticated');
            verifyToken(process.env.ACCESS_TOKEN_KEY);
        }
        if(!isAuth.isValid) {
            throw isAuth;
        }
                
        log.info('Call external service function to send the request to desired service');
        const externalSvcRes = await callExternalSvc(isAuth.data.port, originalUrl, method, payload, accessToken, files);
        if (!externalSvcRes.isValid) {
            throw externalSvcRes;
        }

        log.success(`Request completed successfully with external service`);
        res.status(responseCodes[externalSvcRes.resType]).json(
            buildApiResponse(externalSvcRes)
        );
    } catch (err) {
        if (err.resType === 'INTERNAL_SERVER_ERROR') {
            log.error('Internal Error occurred while working with redirect service router function');
        } else {
            log.error(`Error occurred : ${err.resMsg}`);
        }
        next(err);
    }
}

export default redirectAPI;
