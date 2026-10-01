import { capitalizeFirstLetter } from '../utils/formattedText.js';
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        set: capitalizeFirstLetter
    },
    description: {
        type: String,
        required: true,
        set: capitalizeFirstLetter
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Clothing', 'Electronics', 'Food', 'Home & Living', 'Accessories', 'General']
    },
    imageUrl: {
        type: String,
        required: true,
        default: 'https://via.placeholder.com/150'
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);