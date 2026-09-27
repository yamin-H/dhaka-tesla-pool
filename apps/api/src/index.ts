import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { env } from './config/env.js';
import authRoutes from "./modules/auth/auth.routes.js";
import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Error handler — must be last
app.use(errorHandler);

app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
});