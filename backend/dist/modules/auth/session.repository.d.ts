interface CreateRefreshSessionInput {
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
}
interface RotateRefreshSessionInput {
    oldTokenHash: string;
    newTokenHash: string;
    newExpiresAt: Date;
}
export declare const createRefreshSession: (data: CreateRefreshSessionInput) => Promise<{
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
}>;
export declare const findRefreshSession: (tokenHash: string) => Promise<{
    id: string;
    userId: string;
    tokenHash: string;
    familyId: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
} | null>;
export declare const revokeRefreshSession: (id: string) => Promise<import("../../generated/prisma/internal/prismaNamespace.js").BatchPayload>;
export declare const revokeTokenFamily: (familyId: string) => Promise<import("../../generated/prisma/internal/prismaNamespace.js").BatchPayload>;
export declare const rotateRefreshSession: (data: RotateRefreshSessionInput) => Promise<{
    status: "NOT_FOUND";
    userId?: never;
    familyId?: never;
} | {
    status: "REUSED";
    userId?: never;
    familyId?: never;
} | {
    status: "EXPIRED";
    userId?: never;
    familyId?: never;
} | {
    status: "ROTATED";
    userId: string;
    familyId: string;
}>;
export {};
//# sourceMappingURL=session.repository.d.ts.map