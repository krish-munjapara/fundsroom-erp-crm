import express, { Application } from 'express';
import cors from 'cors';
import routes from './routes';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app: Application = express();

const corsOrigins =
  config.nodeEnv === 'production'
    ? [config.frontendUrl]
    : [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'];

// Middleware
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
