import Product, {IProduct} from '../models/Product.js';
import User, {IUser} from "../models/User.js";
import {hashPassword, verifyPassword} from "../services/authorize.js";
import jwt from 'jsonwebtoken';
import {UserRole} from "./enums.js";
import {LoginData, RegisterResponse} from "../types";

interface ProductInput {
    id: string,
    name: string,
    price:number,
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
            { offset: number, limit: number, category: string, query: string }): Promise<{total: number, products :IProduct[]}> {
            try {
                // Build the filter object
                const filter: { [key: string]: any } = {};

                // If category is not "all", add it to the filter
                if (category && category !== 'all') {
                    filter.category = category;
                }

                // If query is provided, use it to filter by name with a case-insensitive search
                if (query) {
                    filter.name = { $regex: query, $options: 'i' }; // 'i' makes the search case-insensitive
                }

                const total = await Product.countDocuments(filter);
                const products = await Product.find(filter).sort({ price: -1 }).skip(offset).limit(limit);
                return {total, products};
            } catch (error) {
                throw new Error("Failed to fetch products");
              }
        },
    },

    Mutation: {
        async registerUser(_:unknown, {userInput}: {userInput: IUser}): Promise<RegisterResponse> {

            const existingUser = await User.findOne({email:userInput.email})

            if(existingUser) {
             throw new Error('User already exists')
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
            const token = jwt.sign({ id: registeredUser.id, email: registeredUser.email, role: registeredUser.role }, process.env.JWT_SECRET, {expiresIn: '2h'})
            return {
                id: res.id,
                token: token,
                name: registeredUser.name,
                email: registeredUser.email,
                contact: registeredUser.contact,
                role: registeredUser.role
            };
        },
        async login(_: unknown, {loginData}: {loginData: LoginData}): Promise<RegisterResponse> {

            const registeredUser = await User.findOne({email:loginData.email})

            if(!registeredUser) {
                throw new Error('Username or password is wrong')
            }

            const isPasswordVerified = await verifyPassword(loginData.password, registeredUser.password)
            if (!isPasswordVerified){
                throw new Error('Username or password is wrong')
            }

            const token = jwt.sign({ id: registeredUser.id, email: registeredUser.email, role: registeredUser.role }, process.env.JWT_SECRET, {expiresIn: '2h'})

            return {
                id: registeredUser.id,
                token: token,
                name: registeredUser.name,
                email: registeredUser.email,
                contact: registeredUser.contact,
                role: Number(registeredUser.role)
            };
        },
        async createProduct(_: unknown, {productInput}: {productInput: ProductInput }): Promise<{ id: string }> {
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
        async deleteProduct(_: unknown, {ID}: { ID: string }): Promise<number> {
            return (await Product.deleteOne({_id: ID})).deletedCount;
        },
        async editProduct(_: unknown, {ID, productInput}: { ID: string; productInput: ProductInput }): Promise<number> {
            return (await Product.updateOne({_id: ID}, {
                name: productInput.name,
                category: productInput.category,
                price: productInput.price,
            })).modifiedCount;
        },
    },
};

export default resolvers;
