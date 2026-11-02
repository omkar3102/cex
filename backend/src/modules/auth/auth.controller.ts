import type {Request, Response} from 'express';

import { registerUser, AuthError } from './auth.service.js';
import type { RegisterInput } from './auth.types.js';

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