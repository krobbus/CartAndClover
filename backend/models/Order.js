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
        street: { type: String, required: true, set: capitalizeFirstLetter  },
        province: { type: String, required: true, set: capitalizeFirstLetter },
        city: { type: String, required: true, set: capitalizeFirstLetter },
        postalCode: { type: String, required: true },
        phone: { type: Number, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['Cash on Delivery', 'Credit/Debit Card', 'E-Wallet (GCash/Maya)'],
        default: 'Cash on Delivery'
    },
    totalAmount: {
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