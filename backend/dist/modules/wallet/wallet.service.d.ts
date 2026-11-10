export declare const getUserWallets: (userId: string) => Promise<{
    availableBalance: string;
    lockedBalance: string;
    asset: {
        decimals: number;
        name: string;
        symbol: string;
    };
    id: string;
}[]>;
export declare const getUserWalletByAsset: (userId: string, assetSymbol: string) => Promise<{
    availableBalance: string;
    lockedBalance: string;
    asset: {
        decimals: number;
        name: string;
        symbol: string;
    };
    id: string;
}>;
//# sourceMappingURL=wallet.service.d.ts.map