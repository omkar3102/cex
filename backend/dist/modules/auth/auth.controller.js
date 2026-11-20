import { registerUser, AuthError, loginUser, refreshUserSession, logoutUser } from './auth.service.js';
export const register = async (req, res) => {
    try {
        const data = req.body;
        const user = await registerUser(data);
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: user,
        });
    }
    catch (error) {
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
export const login = async (req, res) => {
    try {
        const data = req.body;
        const result = await loginUser(data);
        const isProduction = process.env.NODE_ENV === "production";
        //Access token cookies: 15 minutes
        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
        });
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/auth",
        });
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            data: result.user,
        });
    }
    catch (error) {
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
export const refresh = async (req, res) => {
    try {
        //1. Read refresh token from HttpOnly cookie
        const refreshToken = req.cookies?.refreshToken;
        //2. Rotate the refresh session
        const result = await refreshUserSession(refreshToken);
        const isProduction = process.env.NODE_ENV === "production";
        //3. Set the new access token
        res.cookie("accessToken", result.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
            path: "/",
        });
        //4. Set the replacement refresh token
        res.cookie("refreshToken", result.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: "/api/auth",
        });
        return res.status(200).json({
            success: true,
            message: "Session refreshed successfully",
        });
    }
    catch (error) {
        if (error instanceof AuthError) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
        }
        console.error("Refresh controller error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
export const logout = async (req, res) => {
    try {
        //1 Read refresh token
        const refreshToken = req.cookies?.refreshToken;
        //2. Revoke refresh session
        await logoutUser(refreshToken);
        const isProduction = process.env.NODE_ENV === "production";
        //3. Clear access token cookie
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/",
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: isProduction,
            sameSite: "lax",
            path: "/api/auth"
        });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout controller error: ", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
//# sourceMappingURL=auth.controller.js.map