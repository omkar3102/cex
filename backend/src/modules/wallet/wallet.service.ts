import { findWalletsByUserId, findWalletByUserAndAsset } from "./wallet.repository.js";

import { AuthError } from "../auth/auth.service.js";


//fetch all wallets belonging to a user
export const getUserWallets = async (userId: string) => {
    const wallets = await findWalletsByUserId(userId);

    return wallets.map((wallet) => ({
        ...wallet,
        availableBalance: wallet.availableBalance.toString(),
        lockedBalance: wallet.lockedBalance.toString()
    }))
};

//fetch a specific asset wallet
export const getUserWalletByAsset = async (
    userId: string,
    assetSymbol: string
) => {
    const normalizedSymbol = assetSymbol.trim().toUpperCase();

    if(!normalizedSymbol) {
        throw new AuthError("Asset symbol is required", 400);
    }

    const wallet = await findWalletByUserAndAsset(
        userId,
        normalizedSymbol
    );
    
    if(!wallet) {
        throw new AuthError("Wallet not found", 404)
    }

    return {
        ...wallet,
        availableBalance: wallet.availableBalance.toString(),
        lockedBalance: wallet.lockedBalance.toString()
    };
};