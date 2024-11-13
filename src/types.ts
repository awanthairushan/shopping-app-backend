export type TResponse = {
    success: boolean;
    message: string
}

export type LoginData = {
    email: string;
    password: string;
}

export type RegisterResponse = {
    id : string;
    token: string;
    role: number;
    name: string;
    email:string;
    contact: string;
}