import app from './app';
import { AppDataSource } from './config/data-source';
import { CONFIG } from './config/index';
import logger from './config/logger';

const startServer = async () => {
    const PORT = CONFIG.PORT;
    try {
        await AppDataSource.initialize();
        logger.info('Database connected succesfully');
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }
};

void startServer();
