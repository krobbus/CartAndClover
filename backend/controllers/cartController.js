import asyncHandler from '../utils/asyncHandler.js';
import Cart from '../models/Cart.js';

export const getCart = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.query.userId || req.body.userId;

    if (!userId) {
        res.status(400);
        throw new Error('User ID is required');
    }

    let cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart) {
        cart = await Cart.create({ user: userId, items: [] });
    }
    res.status(200).json(cart);
});

export const addToCart = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.body.userId;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
        res.status(400);
        throw new Error('User ID is required');
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = new Cart({ user: userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
        cart.items[itemIndex].quantity += Number(quantity);
    } else {
        cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    const updatedCart = await Cart.findById(cart._id).populate('items.product');
    res.status(200).json(updatedCart);
});

export const updateCartItem = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.body.userId || req.query.userId;
    const itemId = req.params.id;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
        res.status(404);
        throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
        item => item._id.toString() === itemId || item.product.toString() === itemId
    );

    if (itemIndex > -1) {
        if (quantity <= 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = Number(quantity);
        }

        await cart.save();
        const updatedCart = await Cart.findById(cart._id).populate('items.product');
        return res.status(200).json(updatedCart);
    }

    res.status(404).json({ message: 'Item not found in cart' });
});

export const removeFromCart = asyncHandler(async (req, res) => {
    const userId = req.user?._id || req.body?.userId || req.query.userId;
    const itemId = req.params.id;

    const cart = await Cart.findOne({ user: userId });
    if (cart) {
        cart.items = cart.items.filter(
            item => item._id.toString() !== itemId && item.product.toString() !== itemId
        );
        await cart.save();
    }

    res.status(200).json(cart);
});