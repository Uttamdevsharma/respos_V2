import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import { generateOrderToken } from '../utils/tokenGenerator.js';

const seedOrders = async (): Promise<void> => {
  await connectDB();

  console.log('🌱 Creating sample orders...');

  // Clear existing orders
  await Order.deleteMany({});

  // Get all users, tables, and menu items
  const [users, tables, menuItems] = await Promise.all([
    User.find({}),
    Table.find({}),
    MenuItem.find({}).limit(5),
  ]);

  if (!users.length || !tables.length || !menuItems.length) {
    console.error('❌ Missing seed data. Please run seed.ts first.');
    process.exit(1);
  }

  const waiter = users.find((u) => u.role === 'waiter');
  if (!waiter) {
    console.error('❌ No waiter user found. Please run seed.ts first.');
    process.exit(1);
  }

  // Create 8 sample orders in different statuses
  const orders = [];

  // 2 Pending orders
  for (let i = 0; i < 2; i++) {
    const table = tables[i];
    const items = [
      {
        menuItem: menuItems[0]._id,
        name: menuItems[0].name,
        price: menuItems[0].price,
        quantity: 2,
        notes: i === 0 ? 'Extra spicy' : '',
      },
      {
        menuItem: menuItems[1]._id,
        name: menuItems[1].name,
        price: menuItems[1].price,
        quantity: 1,
        notes: '',
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;

    orders.push({
      token: await generateOrderToken(),
      table: table._id,
      waiter: waiter._id,
      items,
      status: 'pending',
      subtotal,
      tax,
      serviceCharge,
      grandTotal: subtotal + tax + serviceCharge,
    });
  }

  // 2 Preparing orders
  for (let i = 2; i < 4; i++) {
    const table = tables[i];
    const items = [
      {
        menuItem: menuItems[2]._id,
        name: menuItems[2].name,
        price: menuItems[2].price,
        quantity: 1,
        notes: 'No onion',
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;

    orders.push({
      token: await generateOrderToken(),
      table: table._id,
      waiter: waiter._id,
      items,
      status: 'preparing',
      subtotal,
      tax,
      serviceCharge,
      grandTotal: subtotal + tax + serviceCharge,
    });
  }

  // 2 Ready orders
  for (let i = 4; i < 6; i++) {
    const table = tables[i];
    const items = [
      {
        menuItem: menuItems[3]._id,
        name: menuItems[3].name,
        price: menuItems[3].price,
        quantity: 2,
        notes: '',
      },
      {
        menuItem: menuItems[4]._id,
        name: menuItems[4].name,
        price: menuItems[4].price,
        quantity: 1,
        notes: '',
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;

    orders.push({
      token: await generateOrderToken(),
      table: table._id,
      waiter: waiter._id,
      items,
      status: 'ready',
      subtotal,
      tax,
      serviceCharge,
      grandTotal: subtotal + tax + serviceCharge,
    });
  }

  // 2 Served orders (for billing)
  for (let i = 6; i < 8; i++) {
    const table = tables[i];
    const items = [
      {
        menuItem: menuItems[2]._id,
        name: menuItems[2].name,
        price: menuItems[2].price,
        quantity: 1,
        notes: '',
      },
    ];

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.15 * 100) / 100;
    const serviceCharge = Math.round(subtotal * 0.05 * 100) / 100;

    orders.push({
      token: await generateOrderToken(),
      table: table._id,
      waiter: waiter._id,
      items,
      status: 'served',
      subtotal,
      tax,
      serviceCharge,
      grandTotal: subtotal + tax + serviceCharge,
    });
  }

  await Order.insertMany(orders);
  console.log(`  ✅ ${orders.length} sample orders created`);

  console.log('\n🎉 Sample orders seeded successfully!');
  await mongoose.disconnect();
  process.exit(0);
};

seedOrders().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
