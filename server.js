import express from 'express';
import dotenv from 'dotenv';
import emergencyRoutes from './routes/emergency.routes.js';
import './config/firebase.js';

dotenv.config();
const app = express();
app.use(express.json());

app.use('/api/emergencies', emergencyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});