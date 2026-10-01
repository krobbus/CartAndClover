import bcrypt from 'bcryptjs';
import asyncHandler from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import User from '../models/User.js';

export const registerUser = asyncHandler(async (req, res) => {
    const { firstName, middleName, lastName, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(400);
        throw new Error('Email already in use' );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
        firstName,
        middleName,
        lastName,
        email,
        passwordHash,
        role
    });

    res.status(201).json({
        message: 'User registered successfully',
        user: {
            _id: user._id,
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: generateToken(user._id)
        }
    });
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401);
        throw new Error('Invalid email or password');
    }

    res.status(200).json({ 
        message: 'Login successful', 
        user: { 
            _id: user._id, 
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            token: generateToken(user._id)
        } 
    });
});

export const getMe = asyncHandler(async (req, res) => {
    res.json(req.user);
});