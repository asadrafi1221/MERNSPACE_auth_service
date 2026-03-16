import app from './app';
import { CONFIG } from './config/index';
import logger from './config/logger';

const startServer = () => {
    const PORT = CONFIG.PORT;

    try {
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(error);
        process.exit(1);
    }
};

startServer();
