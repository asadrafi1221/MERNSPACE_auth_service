import app from './app';
import { CONFIG } from './config/index';

const startServer = () => {
    const PORT = CONFIG.PORT;

    try {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();
