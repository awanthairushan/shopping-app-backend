import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    id: string,
    name: string,
    price: number,
    discountedPrice: number,
    quantity: number,
    category: string,
    image: string,
    description?: string
}

const productSchema: Schema = new Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    discountedPrice: {type: Number, required: true},
    quantity: {type: Number, required: true},
    category: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
});

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;
