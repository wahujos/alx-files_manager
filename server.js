import express from 'express';
import router from './routes/index';
import dotenv from 'dotenv';

dotenv.config(); // Ensure this is at the top

const port = parseInt(process.env.PORT, 10) || 5000;

const app = express();

app.use(express.json());
app.use('/', router);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
