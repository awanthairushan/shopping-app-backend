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
import mongoose from "mongoose";

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
        async placeOrder(_: unknown, { placeOrderInput }: { placeOrderInput: TPlaceOrderInput }, context: TContext): Promise<string> {
            if (!context.user || context.user.role !== UserRole.USER) {
                throw new Error(errors.UNAUTHORIZED);
            }

            console.log("placeOrderInput ", placeOrderInput)

            const session = await mongoose.startSession();
            console.log("session started ", session)
            session.startTransaction();

            try {
                // Step 1: Create the new order
                const newOrder = new Order({
                    orderList: placeOrderInput.orderList
                });

                const savedOrder = await newOrder.save({ session });
                console.log(savedOrder);

                // Step 2: Update product quantities in bulk
                const productsBulkOperation = placeOrderInput.orderList.map((order: TOrder) => ({
                    updateOne: {
                        filter: { _id: order.productId, quantity: { $gte: order.quantity } },  // Ensure sufficient stock
                        update: { $inc: { quantity: -order.quantity } }
                    }
                }));

                const productUpdateResult = await Product.bulkWrite(productsBulkOperation, { session });
                console.log(productUpdateResult);

                // Step 3: Manage billing and shipping addresses
                const addresses = await Address.find({ userId: context.user.id }).session(session);

                // Handle billing address
                const existingBillingAddress = addresses.find(item => item.addressType === AddressType.Billing);
                if (!existingBillingAddress) {
                    const newBillingAddress = new Address({
                        userId: context.user.id,
                        ...placeOrderInput.billingAddress,
                        addressType: AddressType.Billing
                    });
                    const savedBillingAddress = await newBillingAddress.save({ session });
                    console.log(savedBillingAddress);
                } else {
                    const updatedBillingAddress = await Address.findOneAndUpdate(
                        { _id: existingBillingAddress._id },
                        { ...placeOrderInput.billingAddress },
                        { session, new: true }
                    );
                    console.log(updatedBillingAddress);
                }

                // Handle shipping address
                const existingShippingAddress = addresses.find(item => item.addressType === AddressType.Shipping);
                if (!existingShippingAddress) {
                    const newShippingAddress = new Address({
                        userId: context.user.id,
                        ...placeOrderInput.shippingAddress,
                        addressType: AddressType.Shipping
                    });
                    const savedShippingAddress = await newShippingAddress.save({ session });
                    console.log(savedShippingAddress);
                } else {
                    const updatedShippingAddress = await Address.findOneAndUpdate(
                        { _id: existingShippingAddress._id },
                        { ...placeOrderInput.shippingAddress },
                        { session, new: true }
                    );
                    console.log(updatedShippingAddress);
                }

                // Commit the transaction
                await session.commitTransaction();
                session.endSession();

                // Return a success message or the order ID
                return "Order placed successfully";
            } catch (error) {
                console.log(error);
                // Abort the transaction in case of an error
                await session.abortTransaction();
                session.endSession();
                throw new Error(errors.ORDER_CREATE_FAILED);
            }
        }
    },
};

export default resolvers;
