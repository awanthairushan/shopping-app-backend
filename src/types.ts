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
    email: string
    password: string
}

export type TAddress = {
    fullName: string
    address: string
    city: string
    postalCode: string
    country: string
    contact: string
}

export type TOrder = {
    productId: string
    quantity: number
}

export type TPlaceOrderInput = {
    orderList: TOrder[]
    deliveryCharge: number
    discountCode: string
    registerData: TProfileInput
    billingAddress: TAddress
    shippingAddress: TAddress
}