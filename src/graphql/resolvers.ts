import Product, {IProduct} from '../models/Product.js';

interface ProductInput {
    name: string;
    category: string;
    price: number;
}

const resolvers = {
    Query: {
        async product(_: unknown, {ID}: { ID: string }): Promise<IProduct | null> {
            return await Product.findById(ID);
        },
        async getProducts(_: unknown, {amount}: { amount: number }): Promise<IProduct[]> {
            return await Product.find().sort({price: -1}).limit(amount);
        },
    },

    Mutation: {
        async createProduct(_: unknown, {productInput}: { productInput: ProductInput }): Promise<{ id: string }> {
            const createdProduct = new Product({
                name: productInput.name,
                category: productInput.category,
                price: productInput.price,
            });

            const res = await createdProduct.save();
            return {
                id: res.id,
                // @ts-ignore
                ...res._doc
            };
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
