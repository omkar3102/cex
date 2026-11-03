import type {Request, Response} from 'express';

import { registerUser, AuthError } from './auth.service.js';
import type { RegisterInput } from './auth.types.js';

import type { LoginInput } from './auth.types.js';
import {loginUser} from './auth.service.js';

export const register = async(req: Request, res: Response) => {
    try {
        const data = req.body as RegisterInput;


        const user = await registerUser(data);

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    } catch (error) {
        if(error instanceof AuthError){
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
    }

    console.error(error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    })
}
}

export const login = async(req: Request, res : Response) => {
    try {
        const data = req.body as LoginInput;

        const result = await loginUser(data);

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: result,
        });
    } catch (error) {
        if(error instanceof AuthError){
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        })
    }
}
