import mongoose, {Document, Model, Schema} from "mongoose";

export interface IAddress extends Document {
    userId: string
    fullName: string
    address: string
    city: string
    postalCode: string
    country: string
    contact: string
    addressType: number
}

const addressSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: {type: String, required: true},
    address: {type: String, required: true},
    city: {type: String, required: true},
    postalCode: {type: String, required: true},
    country: {type: String, required: true},
    contact: {type: String, required: true},
    addressType: {type: Number, required: true}
})

const Address: Model<IAddress> = mongoose.model<IAddress>('Address', addressSchema)
export default Address