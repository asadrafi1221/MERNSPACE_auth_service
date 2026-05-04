import { Router } from 'express';
import authRouter from './auth';
import tenantRouter from './tenant';

const router = Router();

router.use('/auth', authRouter);
router.use('/tenants', tenantRouter);

export default router;
