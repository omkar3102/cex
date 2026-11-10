export declare const findUserByEmail: (email: string) => Promise<{
    id: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare const createUser: (email: string, password: string) => Promise<{
    createdAt: Date;
    email: string;
    id: string;
    updatedAt: Date;
}>;
export declare const createUserWithWallets: (email: string, password: string) => Promise<{
    createdAt: Date;
    email: string;
    id: string;
    updatedAt: Date;
}>;
//# sourceMappingURL=auth.repository.d.ts.map