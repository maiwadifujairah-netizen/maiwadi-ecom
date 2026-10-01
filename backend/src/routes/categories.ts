import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', listCategories);
categoriesRouter.post('/', requireAdmin, createCategory);
categoriesRouter.put('/:id', requireAdmin, updateCategory);
categoriesRouter.delete('/:id', requireAdmin, deleteCategory);
