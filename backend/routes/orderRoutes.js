import express from 'express';
import { 
    createOrder, 
    getUserOrders, 
    getSellerOrders,
    getOrderById,
    updateOrder, 
    cancelOrder
} from '../controllers/orderController.js';
import verifyToken from '../middleware/authMiddleware.js'
import authorizeRoles from '../middleware/roleMiddleware.js';

const router = express.Router();
router.use(verifyToken);

router.route('/')
    .get(getUserOrders)
    .post(createOrder);

router.get('/seller', authorizeRoles('seller', 'admin'), getSellerOrders);
router.get('/user/:userId', getUserOrders);

router.route('/:id')
    .get(getOrderById)
    .put(updateOrder)
    .patch(updateOrder)
    .delete(cancelOrder);

export default router;