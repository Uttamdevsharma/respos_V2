import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes.js';
import tableRoutes from './modules/table/table.routes.js';
import categoryRoutes from './modules/category/category.routes.js';
import menuRoutes from './modules/menu/menu.routes.js';
import orderRoutes from './modules/order/order.routes.js';
import userRoutes from './modules/user/user.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import expenseRoutes from './modules/expense/expense.routes.js';
import publicRoutes from './modules/public/public.routes.js';
import superAdminRoutes from './modules/super-admin/super-admin.routes.js';
import subscriptionRoutes from './modules/subscription/subscription.routes.js';
import { publicLiveChatRouter, superAdminLiveChatRouter } from './modules/support/liveChat.routes.js';
import { tenantSupportTicketRouter, superAdminSupportTicketRouter } from './modules/support/supportTicket.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// Prevent browser/proxy HTTP disk caching for API responses
app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});
// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'https://pos.okobiz.com'],
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static files (uploads & public images)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/images', express.static(path.join(__dirname, '..', '..', 'client', 'public', 'images')));
// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/public/live-chat', publicLiveChatRouter);
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/super-admin/live-chat', superAdminLiveChatRouter);
app.use('/api/super-admin/support-tickets', superAdminSupportTicketRouter);
app.use('/api/support-tickets', tenantSupportTicketRouter);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses', expenseRoutes);
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Error handler
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map