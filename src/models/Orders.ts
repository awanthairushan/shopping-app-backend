import mongoose, {Document, Model, Schema} from "mongoose";

export interface IOrder extends Document {
    id: string
    userId: string
    orderList: { productId: string, quantity: number }[]
}

const orderItemSchema: Schema = new Schema({
    productId: { type: String, required: true },
    quantity: { type: Number, required: true },
});

const orderSchema: Schema = new Schema({
    userId: { type: String, required: true },
    orderList: { type: [orderItemSchema], required: true },
});

const Order: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema)

export default Order