'use strict';

// Import DB Template
import { serviceConfigTemplate, serviceRoutesTemplate } from 'lib-finance-service';

const findPathDetails = async(svc, path, method) => {
    const query = {
        path: {
            $regex: path,
            $options: 'i'
        },
        microservice: svc,
        method: method
    };
    const db = new serviceRoutesTemplate();
    return await db.findOne(query, null);
}

const findServiceDetails = async(svc, environment, protocol) => {
    const query = {
        microservice: svc,
        environment: environment,
        protocol: protocol
    };
    const db = new serviceConfigTemplate();
    return await db.findOne(query, null);
}

export {
    findPathDetails,
    findServiceDetails
};
