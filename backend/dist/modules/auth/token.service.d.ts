export declare const REFRESH_TOKEN_TTL_MS: number;
export declare const generateRefreshToken: (existingFamilyId?: string) => {
    refreshToken: string;
    tokenHash: string;
    familyId: `${string}-${string}-${string}-${string}-${string}`;
    expiresAt: Date;
};
export declare const hashRefreshToken: (token: string) => string;
//# sourceMappingURL=token.service.d.ts.map