 
 
 

import { config } from 'dotenv';

config();

const { PORT, NODE_ENV } = process.env;

export const appConfig = {
    PORT,
    NODE_ENV,
};
