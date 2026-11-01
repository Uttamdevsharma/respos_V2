import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Table from '../models/Table.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Settings from '../models/Settings.js';
import PlatformSettings from '../models/PlatformSettings.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import Restaurant from '../models/Restaurant.js';
import Otp from '../models/Otp.js';

const seed = async (): Promise<void> => {
  await connectDB();

  console.log('🌱 Seeding multi-tenant database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Table.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Settings.deleteMany({}),
    PlatformSettings.deleteMany({}),
    SubscriptionPlan.deleteMany({}),
    Restaurant.deleteMany({}),
    Otp.deleteMany({}),
  ]);

  // --- 1. Platform Settings ---
  const platformSettings = await PlatformSettings.create({
    project_name: 'RestoPOS SaaS',
    logo_url: '',
    support_email: 'support@restopos.com',
    support_phone: '+880 1700-112233',
    currency: 'BDT',
    currency_symbol: '৳',
    manual_payment_active: true,
    bkash_number: '01712-345678',
    nagad_number: '01812-345678',
    manual_payment_instruction: 'Please Send Money to our official bKash/Nagad number above (Personal). Enter your sender phone number and TrxID to submit for approval.',
  });
  console.log('  ✅ Platform Settings created');

  // --- 2. Initial Subscription Plans ---
  const starterPlan = await SubscriptionPlan.create({
    name: 'Starter Plan',
    description: 'Perfect for small cafes, juice bars, and food carts.',
    badge: 'Popular for Small Cafes',
    monthly_price: 999,
    annual_price: 9999,
    trial_days: 7,
    max_tables: 5,
    max_staff: 2,
    max_branches: 1,
    features: [
      'Up to 5 Tables',
      '2 Staff Accounts',
      '1 Outlet / Branch',
      'Basic POS & Billing',
      'Kitchen Display (KDS)',
      'Sales Reports & Analytics',
    ],
    is_active: true,
  });

  const growthPlan = await SubscriptionPlan.create({
    name: 'Growth Plan',
    description: 'Ideal for medium-sized busy restaurants and dining spots.',
    badge: 'Most Popular',
    monthly_price: 2499,
    annual_price: 24999,
    trial_days: 7,
    max_tables: 20,
    max_staff: 10,
    max_branches: 2,
    features: [
      'Up to 20 Tables',
      '10 Staff Accounts',
      '2 Outlets / Branches',
      'Advanced POS & Billing',
      'Kitchen Display System (KDS)',
      'Inventory & Recipe Management',
      'Realtime Analytics & Daily Reports',
      'Multiple Payment Gateways',
    ],
    is_active: true,
  });

  const enterprisePlan = await SubscriptionPlan.create({
    name: 'Enterprise Plan',
    description: 'Full-fledged cloud POS platform for restaurant chains.',
    badge: 'Full Suite',
    monthly_price: 4999,
    annual_price: 49999,
    trial_days: 14,
    max_tables: 999,
    max_staff: 999,
    max_branches: 999,
    features: [
      'Unlimited Tables & Floors',
      'Unlimited Staff Accounts',
      'Unlimited Branches / Outlets',
      'Complete Cloud POS & KDS',
      'Multi-Branch Consolidated Reporting',
      'Online Ordering & QR Table Menu',
      '24/7 Dedicated Support & Training',
    ],
    is_active: true,
  });
  console.log('  ✅ 3 Subscription Plans created (Starter, Growth, Enterprise)');

  // --- 3. Super Admin User ---
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@gmail.com',
    password: 'admin1234',
    role: 'SUPER_ADMIN',
    restaurant_id: null,
    phone: '+880 1700-000000',
    isActive: true,
  });
  console.log(`  ✅ Super Admin created: ${superAdmin.email}`);

  // --- 4. Demo Approved Restaurant ---
  const subStart = new Date();
  const subEnd = new Date();
  subEnd.setDate(subEnd.getDate() + 30);

  const demoRestaurant = await Restaurant.create({
    name: 'GastroFlow Restaurant',
    owner_name: 'Tanvir Hossain',
    email: 'admin@gastroflow.com',
    contact_number: '+880 1700-000001',
    address: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
    status: 'APPROVED',
    plan_id: growthPlan._id,
    billing_cycle: 'MONTHLY',
    trade_license_number: 'TR-DHAKA-2024-88912',
    trade_license_doc: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80',
    nid_number: '19902692019283741',
    nid_front_doc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    nid_back_doc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    payment_method: 'MANUAL_BKASH',
    payment_trx_id: 'BKASH99281734',
    payment_amount: 2499,
    sender_number: '01711-223344',
    subscription_start: subStart,
    subscription_end: subEnd,
  });
  console.log(`  ✅ Demo Approved Restaurant created: ${demoRestaurant.name}`);

  // --- 5. Demo Restaurant Staff / Owner Users ---
  const restaurantUsers = await User.create([
    {
      name: 'Tanvir (Admin)',
      email: 'admin@gastroflow.com',
      password: 'admin123',
      role: 'admin',
      phone: '+880 1700-000001',
      restaurant_id: demoRestaurant._id,
      isActive: true,
    },
    {
      name: 'Alex (Waiter)',
      email: 'waiter@gastroflow.com',
      password: 'waiter123',
      role: 'waiter',
      phone: '+880 1700-000002',
      restaurant_id: demoRestaurant._id,
      isActive: true,
    },
    {
      name: 'Sarah (Cashier)',
      email: 'cashier@gastroflow.com',
      password: 'cashier123',
      role: 'cashier',
      phone: '+880 1700-000003',
      restaurant_id: demoRestaurant._id,
      isActive: true,
    },
    {
      name: 'Chef Rahman',
      email: 'kitchen@gastroflow.com',
      password: 'kitchen123',
      role: 'kitchen',
      phone: '+880 1700-000004',
      restaurant_id: demoRestaurant._id,
      isActive: true,
    },
  ]);
  console.log(`  ✅ ${restaurantUsers.length} restaurant users created`);

  // --- 6. Demo Restaurant Tables ---
  const tables = await Table.create([
    { restaurant_id: demoRestaurant._id, number: 1, capacity: 4, location: 'Terrace', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 2, capacity: 2, location: 'Window', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 3, capacity: 6, location: 'Booth', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 4, capacity: 4, location: 'Center', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 5, capacity: 4, location: 'Patio', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 6, capacity: 8, location: 'VIP Room', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 7, capacity: 2, location: 'Bar', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 8, capacity: 2, location: 'Bar', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 9, capacity: 4, location: 'Main Hall', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 10, capacity: 6, location: 'Main Hall', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 11, capacity: 4, location: 'Main Hall', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 12, capacity: 4, location: 'Terrace', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 13, capacity: 2, location: 'Window', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 14, capacity: 6, location: 'Main Hall', status: 'available' },
    { restaurant_id: demoRestaurant._id, number: 15, capacity: 8, location: 'VIP Room', status: 'available' },
  ]);
  console.log(`  ✅ ${tables.length} tables created for demo restaurant`);

  // --- 7. Demo Restaurant Categories ---
  const categories = await Category.create([
    { restaurant_id: demoRestaurant._id, name: 'Appetizers', description: 'Starters and small plates', sortOrder: 1 },
    { restaurant_id: demoRestaurant._id, name: 'Mains', description: 'Main course dishes', sortOrder: 2 },
    { restaurant_id: demoRestaurant._id, name: 'Drinks', description: 'Beverages and refreshments', sortOrder: 3 },
    { restaurant_id: demoRestaurant._id, name: 'Desserts', description: 'Sweet treats and desserts', sortOrder: 4 },
    { restaurant_id: demoRestaurant._id, name: 'Snacks', description: 'Quick bites and finger food', sortOrder: 5 },
  ]);
  console.log(`  ✅ ${categories.length} categories created`);

  const findCat = (name: string) => categories.find((c) => c.name === name)!._id;

  // --- 8. Demo Restaurant Menu Items ---
  const menuItems = await MenuItem.create([
    { restaurant_id: demoRestaurant._id, name: 'Chicken Samosa', description: 'Crispy pastry filled with spiced chicken', price: 60, category: findCat('Appetizers'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Aloo Chop', description: 'Deep-fried spiced potato croquettes', price: 40, category: findCat('Appetizers'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Fuchka', description: 'Crispy shells with tangy tamarind water', price: 80, category: findCat('Appetizers'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Chicken Pakora', description: 'Batter-fried spiced chicken pieces', price: 120, category: findCat('Appetizers'), isAvailable: true },

    { restaurant_id: demoRestaurant._id, name: 'Kacchi Biryani', description: 'Traditional basmati with tender mutton', price: 450, category: findCat('Mains'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Beef Tehari', description: 'Mustard oil cooked aromatic beef rice', price: 380, category: findCat('Mains'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Chicken Roast', description: 'Tender slow-cooked wedding-style roast', price: 220, category: findCat('Mains'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Grilled Sea Bass', description: 'Fresh sea bass with herbs and lemon', price: 550, category: findCat('Mains'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Mutton Rezala', description: 'Rich creamy mutton curry Kolkata style', price: 480, category: findCat('Mains'), isAvailable: true },

    { restaurant_id: demoRestaurant._id, name: 'Borhani', description: 'Spiced yogurt digestive drink', price: 80, category: findCat('Drinks'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Mango Lassi', description: 'Creamy mango yogurt smoothie', price: 120, category: findCat('Drinks'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Fresh Lime Soda', description: 'Zesty lime with sparkling water', price: 60, category: findCat('Drinks'), isAvailable: true },

    { restaurant_id: demoRestaurant._id, name: 'Rasmalai', description: 'Sweet cream soaked cheese dumplings', price: 120, category: findCat('Desserts'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'Mishti Doi', description: 'Bengali sweetened yogurt', price: 80, category: findCat('Desserts'), isAvailable: true },
    { restaurant_id: demoRestaurant._id, name: 'French Fries', description: 'Crispy golden potato fries', price: 100, category: findCat('Snacks'), isAvailable: true },
  ]);
  console.log(`  ✅ ${menuItems.length} menu items created`);

  // --- 9. Restaurant Settings ---
  await Settings.create({
    restaurant_id: demoRestaurant._id,
    restaurantName: 'GastroFlow Restaurant',
    address: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
    phone: '+880 1700-000000',
    taxRate: 15,
    serviceChargeRate: 5,
    currency: '৳',
  });
  console.log('  ✅ Restaurant settings created');

  // --- 10. Sample Pending Restaurant for Super Admin verification testing ---
  const pendingRestaurant = await Restaurant.create({
    name: 'Dhaka Spice Lounge',
    owner_name: 'Kamrul Islam',
    email: 'kamrul@dhakaspice.com',
    contact_number: '+880 1819-556677',
    address: 'Plot 45, Gulshan-2, Dhaka',
    status: 'PENDING',
    plan_id: starterPlan._id,
    billing_cycle: 'MONTHLY',
    trade_license_number: 'TR-GLS-2024-10294',
    trade_license_doc: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=800&q=80',
    nid_number: '19852692019999999',
    nid_front_doc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    nid_back_doc: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    payment_method: 'MANUAL_BKASH',
    payment_trx_id: 'BKASH77665544',
    payment_amount: 999,
    sender_number: '01819-556677',
  });

  await User.create({
    name: 'Kamrul Islam',
    email: 'kamrul@dhakaspice.com',
    password: 'password123',
    role: 'OWNER',
    phone: '+880 1819-556677',
    restaurant_id: pendingRestaurant._id,
    isActive: true,
  });
  console.log('  ✅ Sample Pending Restaurant created for Super Admin verification testing');

  console.log('\n🎉 Multi-Tenant Database seeded successfully!');
  console.log('\n=============================================');
  console.log('👑 Super Admin Credentials:');
  console.log('   Email:    superadmin@gmail.com');
  console.log('   Password: admin1234');
  console.log('   Portal:   /super-admin/overview');
  console.log('---------------------------------------------');
  console.log('🍽️ Approved Restaurant (Demo) Credentials:');
  console.log('   Admin:    admin@gastroflow.com / admin123');
  console.log('   Waiter:   waiter@gastroflow.com / waiter123');
  console.log('   Cashier:  cashier@gastroflow.com / cashier123');
  console.log('   Kitchen:  kitchen@gastroflow.com / kitchen123');
  console.log('---------------------------------------------');
  console.log('⏳ Pending Restaurant (Registration Verification Test):');
  console.log('   Email:    kamrul@dhakaspice.com / password123');
  console.log('=============================================\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
