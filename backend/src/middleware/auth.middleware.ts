import { error } from 'console';
import type {Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {

        const authHeader = req.headers.authorization;
    
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                success: false,
                message: "Authentication token missing or invalid",
            })
        }
    
        // Extract token
        const token = authHeader.split(" ")[1];
    
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Authentication token missing or invalid",
            })
        }
    
        const secret = process.env.JWT_SECRET;
    
        if(!secret){
            throw new Error("JWT_SECRET is not configured");
        }
    
        // Verify token signature and expiration
        const decoded = jwt.verify(token, secret, {
            algorithms: ["HS256"],
        });
    
        if(
            typeof decoded === "string" ||
            typeof decoded.sub !== "string"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }
        // Attach authenticated user's ID to request
        req.userId = decoded.sub;
    
        // Allow request to continue
        next();
    } catch (error) {
        if(error instanceof jwt.JsonWebTokenError){
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            })
        }

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

