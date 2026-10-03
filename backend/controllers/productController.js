import asyncHandler from '../utils/asyncHandler.js';
import Product from '../models/Product.js';

export const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find();
    res.status(200).json(products);
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    };

    res.status(200).json(product);
});

export const getMyProducts = async (req, res, next) => {
    try {
        const products = await Product.find({ createdBy: req.user._id });
        res.json(products);
    } catch (err) {
        next(err);
    }
};

export const createProduct = asyncHandler(async (req, res) => {
    const { name, description, price, category, stock } = req.body;

    const product = new Product({
        name,
        description,
        price,
        category,
        stock,
        createdBy: req.user._id
    });

    const createdProduct = await product.save();
    
    res.status(201).json(createdProduct);
});

export const updateProduct = asyncHandler(async (req, res) => {
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, req.body, { new: true, runValidators: true }
    );

    if (!updatedProduct){
       res.status(404);
       throw new Error('Product not found');
    };

    res.status(200).json(updatedProduct);
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    res.status(200).json({ message: 'Product deleted successfully', id: req.params.id });
});