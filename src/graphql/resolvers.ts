import Product, {IProduct} from '../models/Product.js';
import User, {IUser} from "../models/User.js";
import {hashPassword, verifyPassword} from "../services/authorize.js";
import jwt from 'jsonwebtoken';
import {AddressType, UserRole} from "./enums.js";
import {LoginData, RegisterResponse, TContext, TOrder, TPlaceOrderInput, TProfileInput} from "../types";
import {errors} from "../data/errors.js";
import Address from "../models/Address.js";
import Order from "../models/Orders.js";
import {ObjectId} from "mongodb";

interface ProductInput {
    id: string,
    name: string,
    price: number,
    discountedPrice: number,
    quantity: number,
    category: string,
    image: string,
    description?: string
}

const resolvers = {
    Query: {
        async getProduct(_: unknown, {ID}: { ID: string }): Promise<IProduct | null> {
            return Product.findById(ID);
        },
        async getProducts(_: unknown, {offset, limit, category, query}:
            { offset: number, limit: number, category: string, query: string }): Promise<{
            total: number,
            products: IProduct[]
        }> {
            try {
                // Build the filter object
                const filter: { [key: string]: any } = {};

                // If category is not "all", add it to the filter
                if (category && category !== 'all') {
                    filter.category = category;
                }

                // If query is provided, use it to filter by name with a case-insensitive search
                if (query) {
                    filter.name = {$regex: query, $options: 'i'}; // 'i' makes the search case-insensitive
                }

                const total = await Product.countDocuments(filter);
                const products = await Product.find(filter).sort({price: -1}).skip(offset).limit(limit);
                return {total, products};
            } catch (error) {
                throw new Error(errors.PRODUCTS_FETCH_FAILED);
            }
        },
    },

    Mutation: {
        async registerUser(_: unknown, {userInput}: { userInput: IUser }): Promise<RegisterResponse> {

            const existingUser = await User.findOne({email: userInput.email})

            if (existingUser) {
                throw new Error(errors.EXISTING_USER)
            }

            const hashedPassword = await hashPassword(userInput.password)
            const newUser = new User({
                name: userInput.name,
                email: userInput.email,
                contact: userInput.contact,
                password: hashedPassword,
                role: UserRole.USER
            })

            const res = await newUser.save();
            // @ts-ignore
            const registeredUser = res._doc
            const token = jwt.sign({
                id: registeredUser.id,
                email: registeredUser.email,
                role: registeredUser.role
            }, process.env.JWT_SECRET, {expiresIn: '2h'})
            return {
                id: res.id,
                token: token,
                name: registeredUser.name,
                email: registeredUser.email,
                contact: registeredUser.contact,
                role: registeredUser.role
            };
        },
        async login(_: unknown, {loginData}: { loginData: LoginData }): Promise<RegisterResponse> {

            const registeredUser = await User.findOne({email: loginData.email})

            if (!registeredUser) {
                throw new Error(errors.INVALID_CREDENTIALS)
            }

            const isPasswordVerified = await verifyPassword(loginData.password, registeredUser.password)
            if (!isPasswordVerified) {
                throw new Error(errors.INVALID_CREDENTIALS)
            }

            const token = jwt.sign({
                id: registeredUser.id,
                email: registeredUser.email,
                role: registeredUser.role
            }, process.env.JWT_SECRET, {expiresIn: '2h'})

            return {
                id: registeredUser.id,
                token: token,
                name: registeredUser.name,
                email: registeredUser.email,
                contact: registeredUser.contact,
                role: Number(registeredUser.role)
            };
        },
        async saveProfile(_: unknown, {profileInput}: {
            profileInput: TProfileInput
        }, context: TContext): Promise<string> {
            if (!context.user || context.user.role !== UserRole.USER) {
                throw new Error(errors.UNAUTHORIZED)
            }

            const newProfile = new Address({
                userId: context.user.id,
                fullName: profileInput.fullName,
                address: profileInput.address,
                city: profileInput.city,
                postalCode: profileInput.postalCode,
                country: profileInput.country,
                contact: profileInput.contact,
                email: profileInput.email,
                addressType: profileInput.addressType
            })

            try {
                const res = await newProfile.save();
                return res.id
            } catch (error) {
                return error
            }
        },
        async createProduct(_: unknown, {productInput}: { productInput: ProductInput }, context: TContext): Promise<{
            id: string
        }> {

            if (!context.user || context.user.role !== UserRole.ADMIN) {
                throw new Error(errors.UNAUTHORIZED)
            }

            const createdProduct = new Product({
                name: productInput.name,
                price: productInput.price,
                discountedPrice: productInput.discountedPrice,
                quantity: productInput.quantity,
                category: productInput.category,
                image: productInput.image,
                description: productInput.description
            });

            const res = await createdProduct.save();

            return {
                id: res.id,
                // @ts-ignore
                ...res._doc
            };

            // return {
            //     success: true,
            //     message: 'product uploaded successfully'
            // };
        },
        async deleteProduct(_: unknown, {ID}: { ID: string }, context: TContext): Promise<number> {
            if (!context.user || context.user.role !== UserRole.ADMIN) {
                throw new Error(errors.UNAUTHORIZED)
            }

            return (await Product.deleteOne({_id: ID})).deletedCount;
        },
        async editProduct(_: unknown, {ID, productInput}: {
            ID: string;
            productInput: ProductInput
        }, context: TContext): Promise<number> {
            if (!context.user || context.user.role !== UserRole.ADMIN) {
                throw new Error(errors.UNAUTHORIZED)
            }

            return (await Product.updateOne({_id: ID}, {
                name: productInput.name,
                category: productInput.category,
                price: productInput.price,
            })).modifiedCount;
        },
        async placeOrder(_: unknown, {placeOrderInput}: {
            placeOrderInput: TPlaceOrderInput
        }, context: TContext): Promise<string> {
            if (!context.user || context.user.role !== UserRole.USER) {
                throw new Error(errors.UNAUTHORIZED)
            }

            const newOrder = new Order({
                orderList: placeOrderInput.orderList
            })

            try {
                const res = await newOrder.save()
                console.log(res)
            } catch (error) {
                console.log(error)
                throw new Error(errors.ORDER_CREATE_FAILED)
            }

            const productsBulkOperation = placeOrderInput.orderList.map((order: TOrder) => ({
                updateOne: {
                    filter: { _id: order.productId, quantity: { $gte: order.quantity } },  // Ensure sufficient stock
                    update: { $inc: { quantity: -order.quantity } }
                }
            }))

            try {
                const res = await Product.bulkWrite(productsBulkOperation)
                console.log(res)
            } catch (error) {
                console.log(error)
                throw new Error(errors.ORDER_CREATE_FAILED)            }

            const addresses = await Address.find({userId: context.user.id})

            const existingBillingAddress = addresses.find(item => item.addressType === AddressType.Billing)

            if (!existingBillingAddress) {
                const newBillingAddress = new Address({
                    userId: context.user.id,
                    fullName: placeOrderInput.billingAddress.fullName,
                    address: placeOrderInput.billingAddress.address,
                    city: placeOrderInput.billingAddress.city,
                    postalCode: placeOrderInput.billingAddress.postalCode,
                    country: placeOrderInput.billingAddress.country,
                    contact: placeOrderInput.billingAddress.contact,
                    email: placeOrderInput.billingAddress.email,
                    addressType: AddressType.Billing
                })

                try {
                    const res = await newBillingAddress.save();
                    console.log(res)
                } catch (error) {
                    console.log(error)
                    throw new Error(errors.ORDER_CREATE_FAILED)                }
            } else {
                try {
                    const res = await Address.findOneAndUpdate({_id: existingBillingAddress._id}, {
                        userId: context.user.id,
                        fullName: placeOrderInput.billingAddress.fullName,
                        address: placeOrderInput.billingAddress.address,
                        city: placeOrderInput.billingAddress.city,
                        postalCode: placeOrderInput.billingAddress.postalCode,
                        country: placeOrderInput.billingAddress.country,
                        contact: placeOrderInput.billingAddress.contact,
                        email: placeOrderInput.billingAddress.email,
                    })
                    console.log(res)
                } catch (error) {
                    console.log(error)
                    throw new Error(errors.ORDER_CREATE_FAILED)
                }
            }
            const existingShippingAddress = addresses.find(item => item.addressType === AddressType.Shipping)

            if (!existingShippingAddress) {
                const newShippingAddress = new Address({
                    userId: context.user.id,
                    fullName: placeOrderInput.shippingAddress.fullName,
                    address: placeOrderInput.shippingAddress.address,
                    city: placeOrderInput.shippingAddress.city,
                    postalCode: placeOrderInput.shippingAddress.postalCode,
                    country: placeOrderInput.shippingAddress.country,
                    contact: placeOrderInput.shippingAddress.contact,
                    email: placeOrderInput.shippingAddress.email,
                    addressType: AddressType.Shipping
                })

                try {
                    const res = await newShippingAddress.save();
                    console.log(res)
                } catch (error) {
                    console.log(error)
                    throw new Error(errors.ORDER_CREATE_FAILED)                }
            } else {
                try {
                    const res = await Address.findOneAndUpdate({_id: existingShippingAddress._id}, {
                        userId: context.user.id,
                        fullName: placeOrderInput.shippingAddress.fullName,
                        address: placeOrderInput.shippingAddress.address,
                        city: placeOrderInput.shippingAddress.city,
                        postalCode: placeOrderInput.shippingAddress.postalCode,
                        country: placeOrderInput.shippingAddress.country,
                        contact: placeOrderInput.shippingAddress.contact,
                        email: placeOrderInput.shippingAddress.email,
                    })
                    console.log(res)
                } catch (error) {
                    console.log(error)
                    throw new Error(errors.ORDER_CREATE_FAILED)                }
            }

            // TODO: update the return correctly
            return "TODO: update the return correctly"
        }
    },
};

export default resolvers;
