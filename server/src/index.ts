import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import vehiclesRouter from './routes/vehicles';
import driversRouter from './routes/drivers';
import tripsRouter from './routes/trips';
import maintenanceRouter from './routes/maintenance';
import fuelRouter from './routes/fuel';
import analyticsRouter from './routes/analytics';
import settingsRouter from './routes/settings';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/fuel', fuelRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);

app.get('/', (_req, res) => {
  res.send('<h1>TransitOps API Gateway</h1><p>The backend is running successfully!</p><p>To view the dashboard web interface, please open: <a href="http://localhost:5173/">http://localhost:5173/</a></p>');
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`🚀 TransitOps server running on http://localhost:${PORT}`);
});

export default app;
