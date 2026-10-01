import { capitalizeFirstLetter } from '../utils/formattedText.js';
import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: { type: String, required: true, set: capitalizeFirstLetter },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true }
        }
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true, set: capitalizeFirstLetter },
        postalCode: { type: String, required: true },
        country: { type: String, required: true, set: capitalizeFirstLetter }
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    paidAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);