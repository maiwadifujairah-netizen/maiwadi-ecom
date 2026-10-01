import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { listCustomers, getCustomer, updateCustomerStatus } from '../controllers/customers.js';

export const customersRouter = Router();
customersRouter.use(requireAdmin);

customersRouter.get('/', listCustomers);
customersRouter.get('/:id', getCustomer);
customersRouter.patch('/:id', updateCustomerStatus);
