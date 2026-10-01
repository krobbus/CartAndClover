import { capitalizeWords } from '../utils/formattedText.js';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        maxLength: 50,
        trim: true,
        set: capitalizeWords
    },
    middleName: {
        type: String,
        maxLength: 50,
        trim: true,
        set: capitalizeWords
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        maxLength: 50,
        trim: true,
        set: capitalizeWords
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    passwordHash: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['shopper', 'seller', 'admin'],
        default: 'shopper'
    }
}, { timestamps: true });

export default mongoose.model('User', userSchema);