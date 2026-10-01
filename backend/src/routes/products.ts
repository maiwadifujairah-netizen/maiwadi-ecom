import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { listProducts, listProductsAdmin, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/products.js';

export const productsRouter = Router();

productsRouter.get('/', listProducts);
productsRouter.get('/admin', requireAdmin, listProductsAdmin);
productsRouter.get('/:slug', getProduct);
productsRouter.post('/', requireAdmin, createProduct);
productsRouter.put('/:id', requireAdmin, updateProduct);
productsRouter.delete('/:id', requireAdmin, deleteProduct);
