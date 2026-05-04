import { Router } from 'express';

const tenantRouter = Router();

tenantRouter.post('/create', (req, res) => {
    res.status(201).send({});
});

export default tenantRouter;
