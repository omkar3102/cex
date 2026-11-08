import express from 'express';
import cors from "cors";
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);

export default app;