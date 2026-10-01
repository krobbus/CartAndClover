import express from 'express';
import verifyToken from '../middleware/authMiddleware.js';
import { registerUser, loginUser, getMe }  from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', verifyToken, getMe);

export default router;