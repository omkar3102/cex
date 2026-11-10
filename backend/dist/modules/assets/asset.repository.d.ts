export declare const findActiveAssets: () => Promise<{
    id: string;
    symbol: string;
    name: string;
    decimals: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare const findActiveAssetBySymbol: (symbol: string) => Promise<{
    decimals: number;
    id: string;
    name: string;
    symbol: string;
} | null>;
//# sourceMappingURL=asset.repository.d.ts.map