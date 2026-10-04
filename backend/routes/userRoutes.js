import express from 'express';
import { 
    getAllUsers, 
    getUserById, 
    createUser, 
    deleteUser 
} from '../controllers/userController.js';
import verifyToken from '../middleware/authMiddleware.js';
import authorizeRoles from '../middleware/roleMiddleware.js';

const router = express.Router();
router.use(verifyToken, authorizeRoles('admin'));

router.route('/')
    .get(getAllUsers)
    .post(createUser);

router.route('/:id')
    .get(getUserById)
    .delete(deleteUser);

export default router;