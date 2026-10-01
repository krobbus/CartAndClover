import express from 'express';
import { 
    getProducts, 
    getProductById,
    getMyProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct 
} from '../controllers/productController.js';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js'

const router = express.Router();

router.route('/')
    .get(getProducts)
    .post(verifyToken, authorizeRoles('seller', 'admin'), createProduct);

router.get('/me', verifyToken, authorizeRoles('seller', 'admin'), getMyProducts);

router.route('/:id')
    .get(getProductById)
    .put(verifyToken, authorizeRoles('seller', 'admin'), updateProduct)
    .patch(verifyToken, authorizeRoles('seller', 'admin'), updateProduct)
    .delete(verifyToken, authorizeRoles('seller', 'admin'), deleteProduct);

export default router;