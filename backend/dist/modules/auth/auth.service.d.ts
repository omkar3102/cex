import type { RegisterInput } from './auth.types.js';
import type { LoginInput } from './auth.types.js';
export declare class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number);
}
export declare const registerUser: (data: RegisterInput) => Promise<{
    createdAt: Date;
    email: string;
    id: string;
    updatedAt: Date;
}>;
export declare const loginUser: (data: LoginInput) => Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
    };
}>;
export declare const refreshUserSession: (refreshToken: unknown) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
//# sourceMappingURL=auth.service.d.ts.map