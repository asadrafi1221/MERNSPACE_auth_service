import 'reflect-metadata';

import express, { Request, Response, NextFunction } from 'express';
import { HttpError } from 'http-errors';
import logger from './config/logger';
import router from './routes';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

app.get('/home', (req, res) => {
    return res.send('welcome to auth service !');
});

// global error handler

app.use(router);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err);
    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                message: err.message,
                path: '',
                location: '',
            },
        ],
    });
});
export default app;
