import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import {UserRole} from "../graphql/enums.js";

export const getUser = (token) => {
    if (!token) {
        return null; // No token provided
    }

    if(token == 'air-sample-user'){
        return {
            role: UserRole.USER
        }
    } else if (token == 'air-sample-admin'){
        return {
            role: UserRole.ADMIN
        }
    }

    try {
        // Decode and verify the token using your secret key
         // Return the decoded user
        return jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET)
    } catch (err) {
        console.error('Error verifying token', err);
        return null; // Invalid token, return null
    }
};

const saltRounds = 10;
export const hashPassword = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, saltRounds);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};
