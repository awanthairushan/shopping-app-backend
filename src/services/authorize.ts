import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const getUser = (token) => {
    if (!token) {
        return null; // No token provided
    }

    try {
        // Decode and verify the token using your secret key
        return jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET); // Return the decoded user
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
