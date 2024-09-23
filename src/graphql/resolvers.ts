import Product, {IProduct} from '../models/Product.js';

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
            return await Product.findById(ID);
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
