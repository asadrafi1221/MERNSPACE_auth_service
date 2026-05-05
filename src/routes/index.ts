import { Router } from 'express';
import authRouter from './auth';
import tenantRouter from './tenant';
import userRouter from './user';
import { protect } from '../middleware/authenticate';

const router = Router();

router.use('/auth', authRouter);
router.use('/tenants', protect, tenantRouter);
router.use('/users', protect, userRouter);

export default router;
