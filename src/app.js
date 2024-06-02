'use strict';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler, setUserContext } from 'lib-finance-service';
import multer from 'multer';

// Routes
import routes from './routes/index.js';

const app = express();
const upload = multer();

// Setting up Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN, // reflecting the request origin
    credentials: true
}));

app.use(express.json({
    limit: '64kb' // Maximum request body size.
}));

app.use(express.urlencoded({
    limit: '32kb',
    extended: false
}));

app.use(rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes max
    max: 1000 // Limit each IP to 1000 requests per windowMs
}));

app.use(cookieParser());
app.use(upload.any());

setUserContext(app);

// Global Route
app.use('*', routes.redirectAPI);

app.use(errorHandler);

export default app;
