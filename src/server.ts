import 'reflect-metadata';
import app from './app';
import { CONFIG } from './config/index';
import logger from './config/logger';
import { AppDataSource } from './data-source';

const startServer = async () => {
    try {
        // Initialize TypeORM connection
        await AppDataSource.initialize();
        logger.info('Database connection established');

        const PORT = CONFIG.PORT;

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }
};

void startServer();
