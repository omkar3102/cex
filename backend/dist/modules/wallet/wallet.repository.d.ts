export declare const findWalletsByUserId: (userId: string) => Promise<{
    asset: {
        decimals: number;
        name: string;
        symbol: string;
    };
    availableBalance: import("@prisma/client-runtime-utils").Decimal;
    id: string;
    lockedBalance: import("@prisma/client-runtime-utils").Decimal;
}[]>;
export declare const findWalletByUserAndAsset: (userId: string, assetSymbol: string) => Promise<{
    asset: {
        decimals: number;
        name: string;
        symbol: string;
    };
    availableBalance: import("@prisma/client-runtime-utils").Decimal;
    id: string;
    lockedBalance: import("@prisma/client-runtime-utils").Decimal;
} | null>;
//# sourceMappingURL=wallet.repository.d.ts.map