import express from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart } from '../controllers/cartController.js';
import verifyToken from '../middleware/authMiddleware.js'

const router = express.Router();
router.use(verifyToken);

router.get('/', getCart);
router.post('/add', addToCart);

router.route('/items/:id')
    .put(updateCartItem)
    .patch(updateCartItem)
    .delete(removeFromCart);

export default router;