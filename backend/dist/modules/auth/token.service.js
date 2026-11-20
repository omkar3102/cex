import { createHash, randomBytes, randomUUID } from "node:crypto";
//Refresh token lifetime: 7 days
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
//generate a cryptographically secure refresh token
export const generateRefreshToken = (existingFamilyId) => {
    const refreshToken = randomBytes(64).toString("base64url");
    //store only hash in database
    const tokenHash = hashRefreshToken(refreshToken);
    //group tokens belonging to the same rotation chain
    const familyId = randomUUID();
    //Calculate expiration
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    return {
        refreshToken,
        tokenHash,
        familyId,
        expiresAt,
    };
};
//Hash refresh token using SHA-256
export const hashRefreshToken = (token) => {
    return createHash("sha256")
        .update(token)
        .digest("hex");
};
//# sourceMappingURL=token.service.js.map