import mongoose, {Document, Model, Schema} from "mongoose";

export interface IUser extends Document {
    id: string,
    email: string
    name: string,
    contact: string,
    password: string
    role: Number
}

const userSchema: Schema = new Schema({
    name: {type: String, required: true},
    email: {type: String, required: true},
    contact: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: Number, required: true}
})

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User