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
    const { user, orderItems, shippingAddress, paymentMethod, totalAmount} = req.body;
    const userId = req.user?._id || user;
    
    if (!orderItems || orderItems.length === 0) {
        res.status(400);
        throw new Error('No order items provided');
    }

    const order = new Order({
        user: userId,
        orderItems,
        shippingAddress,
        paymentMethod,
        totalAmount
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
});

export const updateOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (req.body.shippingAddress) {
        order.shippingAddress = {
            ...(order.shippingAddress?.toObject?.() || order.shippingAddress),
            ...req.body.shippingAddress
        };
    }

    if (req.body.paymentMethod) {
        order.paymentMethod = req.body.paymentMethod;
    }

    if (req.body.status) {
        order.status = req.body.status;
    }

    if (typeof req.body.isPaid !== 'undefined') {
        const newIsPaid = Boolean(req.body.isPaid);

        if (order.isPaid && !newIsPaid) {
            res.status(400);
            throw new Error('Payment status cannot be changed back to Unpaid once marked as Paid.');
        }

        order.isPaid = newIsPaid;
        if (order.isPaid && !order.paidAt) {
            order.paidAt = new Date();
        }
    }

    const updatedOrder = await order.save();
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