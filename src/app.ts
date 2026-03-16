import express from 'express';

const app = express();

app.get('/home', (req, res) => {
    return res.send('welcome to auth service');
});

export default app;
