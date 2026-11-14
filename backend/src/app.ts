import express from 'express';
import cors from "cors";
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import walletRoutes from './modules/wallet/wallet.routes.js';
import ledgerRoutes from './modules/ledger/ledger.routes.js'
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));

app.use(express.json());

app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/ledger", ledgerRoutes)

export default app;