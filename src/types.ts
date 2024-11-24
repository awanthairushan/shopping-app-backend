import {IUser} from "./models/User.js";

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

export type TContext = {
    user: IUser
}

export type TProfileInput = {
    fullName: string
    address: string
    city: string
    postalCode: string
    country: string
    contact: string
    email: string
}

export type TOrder = {
    productId: string
    quantity: number
}

export type TPlaceOrderInput = {
    orderList: TOrder[]
    deliveryCharge: number
    discountCode: string
    billingAddress: TProfileInput
    shippingAddress: TProfileInput
}