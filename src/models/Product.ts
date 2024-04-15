import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    category: string;
    price: number;
}

const productSchema: Schema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true }
});

const Product: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default Product;
