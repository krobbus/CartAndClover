import asyncHandler from '../utils/asyncHandler.js';
import Order from '../models/Order.js';

export const getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.params.userId || req.query.userId;
    const query = userId ? { user: userId } : {};
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.status(200).json(orders);
});

export const getSellerOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('orderItems.product user');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.status(200).json(order);
});

export const createOrder = asyncHandler(async (req, res) => {
    const { user, orderItems, shippingAddress, totalPrice } = req.body;
    const userId = req.user?._id || user;
    
    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items provided');
    }

    const order = new Order({
        user: userId,
        orderItems,
        shippingAddress,
        totalPrice
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
});

export const updateOrder = asyncHandler(async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id, req.body, { new: true, runValidators: true }
    );

    if (!updatedOrder) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.status(200).json(updatedOrder);
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.status(200).json({ message: 'Order cancelled successfully', id: req.params.id });
});