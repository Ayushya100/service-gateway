'use strict';

// Import DB Template
import { serviceRoutesTemplate } from 'lib-finance-service';

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

export {
    findPathDetails
};
