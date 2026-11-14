import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateRefreshToken, hashRefreshToken } from './token.service.js';

import {
    findUserByEmail,
    createUserWithWallets,
} from './auth.repository.js';


// import { generateRefreshToken  } from './token.service.js';
import { createRefreshSession, findRefreshSession, rotateRefreshSession } from './session.repository.js';


import type { RegisterInput } from './auth.types.js';
import type { LoginInput } from './auth.types.js'

export class AuthError extends Error {
    constructor(message: string, public statusCode: number){
        super(message);
        this.name = 'AuthError';
    }
}

export const registerUser = async(data: RegisterInput) => {
    const email = data.email?.trim().toLowerCase();
    const password = data.password;

    //validate input
    if(!email || !password){
        throw new AuthError('Email and password are required', 400);
    }

    if(password.length < 8) {
        throw new AuthError("Password must be at least 8 characters", 400);
    }

    const existingUser = await findUserByEmail(email);

    if(existingUser){
        throw new AuthError('Email already registered', 409);
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);

    //create user
    try {

        const user = await createUserWithWallets(email, hashedPassword);
    
        return user;
    } catch(error) {
        //handle concurrent duplicate registrations
        if( typeof error === "object" && 
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            throw new AuthError(
                "Email already registered",
                409
            )
        }

        throw error;
    }

}

export const loginUser = async(data: LoginInput) => {
    if(typeof data?.email !== "string" || typeof data?.password !== "string") {
        throw new AuthError("Email and password are required", 400);
    }

    const email =  data.email.trim().toLowerCase();
    const password = data.password;

    if(!email || !password){
        throw new AuthError("Email and password are required", 400);
    }

    //Find user in database
    const user = await findUserByEmail(email);

    if(!user){
        throw new AuthError("Invalid email or password", 401);
    }

    //2. Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid){
        throw new AuthError("Invalid email or password", 401)
    }

    //generate JWT
    const secret = process.env.JWT_SECRET;

    if(!secret){
        throw new Error("JWT secret is not defined in environment variables");
    }

    const accessToken = jwt.sign(
        { sub: user.id },
        secret,
        { expiresIn: "15m", algorithm: "HS256" }
    );

    //generate refresh token
    const refreshSession = generateRefreshToken();

    //store hashed refresh token in PostgreSQL
    await createRefreshSession({
        userId: user.id,
        tokenHash: refreshSession.tokenHash,
        familyId: refreshSession.familyId,
        expiresAt: refreshSession.expiresAt,
    });
    
    return {
        accessToken,
        refreshToken: refreshSession.refreshToken,
        user: {
            id: user.id,
            email: user.email,
        },
    };
};


export const refreshUserSession = async (refreshToken : unknown) => {
    //1. Validate the incoming refresh token
    if (
        typeof refreshToken !== "string" ||
        !refreshToken.trim()
    ) {
        throw new AuthError("Refresh token is required", 401);
    }

    //2. Hash the incoming token
    const oldTokenHash = hashRefreshToken(refreshToken);

    //3. Find the existing refresh session
    const existingSession  = await findRefreshSession(oldTokenHash);

    if(!existingSession) {
        throw new AuthError("Invalid refresh token", 401);
    }

    //4. Generate a replacement token in the same family
    const newRefreshSession = generateRefreshToken(
        existingSession.familyId
    );

    //5. Atomically revoke the old token and create new session
    const rotationResult = await rotateRefreshSession({
        oldTokenHash,
        newTokenHash: newRefreshSession.tokenHash,
        newExpiresAt: newRefreshSession.expiresAt,
    });

    //6. handle rotation failures
    if (rotationResult.status === "REUSED") {
        throw new AuthError(
            "Refresh token reuse detected. Please log in again",
            401
        )
    }

    if (
        rotationResult.status === "EXPIRED" ||
        rotationResult.status === "NOT_FOUND"
    ) {
        throw new AuthError("Invalid or expired refresh token", 401);
    }


    const secret = process.env.JWT_SECRET;

    if(!secret) {
        throw new Error("JWT_SECRET is not configured");
    }

    const accessToken = jwt.sign(
        { sub: rotationResult.userId },
        secret,
        {
            expiresIn: "15m",
            algorithm: "HS256"
        }
    );

    return {
        accessToken,
        refreshToken: newRefreshSession.refreshToken,
    };

};
