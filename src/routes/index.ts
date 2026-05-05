import { Router } from 'express';
import authRouter from './auth';
import tenantRouter from './tenant';
import { protect } from '../middleware/authenticate';

const router = Router();

router.use('/auth', authRouter);
router.use('/tenants', protect, tenantRouter);

export default router;
