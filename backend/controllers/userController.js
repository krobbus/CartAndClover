import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

export const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json(user);
});

export const createUser = asyncHandler(async (req, res) => {
    const { firstName, middleName, lastName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    const user = await User.create({
        firstName,
        middleName,
        lastName,
        email,
        password,
        role
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
});

export const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
        res.status(404)
        throw new Error('User not found');
    }

    res.status(200).json({ message: 'User deleted successfully', id: req.params.id });
});