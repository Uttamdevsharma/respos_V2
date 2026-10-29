import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Table from '../models/Table.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Settings from '../models/Settings.js';

const seed = async (): Promise<void> => {
  await connectDB();

  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Table.deleteMany({}),
    Category.deleteMany({}),
    MenuItem.deleteMany({}),
    Settings.deleteMany({}),
  ]);

  // --- Users ---
  const users = await User.create([
    { name: 'Admin', email: 'admin@gastroflow.com', password: 'admin123', role: 'admin', phone: '+880 1700-000001' },
    { name: 'Alex (Waiter)', email: 'waiter@gastroflow.com', password: 'waiter123', role: 'waiter', phone: '+880 1700-000002' },
    { name: 'Sarah (Cashier)', email: 'cashier@gastroflow.com', password: 'cashier123', role: 'cashier', phone: '+880 1700-000003' },
    { name: 'Chef Rahman', email: 'kitchen@gastroflow.com', password: 'kitchen123', role: 'kitchen', phone: '+880 1700-000004' },
  ]);
  console.log(`  ✅ ${users.length} users created`);

  // --- Tables ---
  const tables = await Table.create([
    { number: 1, capacity: 4, location: 'Terrace', status: 'available' },
    { number: 2, capacity: 2, location: 'Window', status: 'available' },
    { number: 3, capacity: 6, location: 'Booth', status: 'available' },
    { number: 4, capacity: 4, location: 'Center', status: 'available' },
    { number: 5, capacity: 4, location: 'Patio', status: 'available' },
    { number: 6, capacity: 8, location: 'VIP Room', status: 'available' },
    { number: 7, capacity: 2, location: 'Bar', status: 'available' },
    { number: 8, capacity: 2, location: 'Bar', status: 'available' },
    { number: 9, capacity: 4, location: 'Main Hall', status: 'available' },
    { number: 10, capacity: 6, location: 'Main Hall', status: 'available' },
    { number: 11, capacity: 4, location: 'Main Hall', status: 'available' },
    { number: 12, capacity: 4, location: 'Terrace', status: 'available' },
    { number: 13, capacity: 2, location: 'Window', status: 'available' },
    { number: 14, capacity: 6, location: 'Main Hall', status: 'available' },
    { number: 15, capacity: 8, location: 'VIP Room', status: 'available' },
    { number: 16, capacity: 4, location: 'Center', status: 'available' },
    { number: 17, capacity: 2, location: 'Bar', status: 'available' },
    { number: 18, capacity: 4, location: 'Patio', status: 'available' },
    { number: 19, capacity: 6, location: 'Main Hall', status: 'available' },
    { number: 20, capacity: 4, location: 'Center', status: 'available' },
  ]);
  console.log(`  ✅ ${tables.length} tables created`);

  // --- Categories ---
  const categories = await Category.create([
    { name: 'Appetizers', description: 'Starters and small plates', sortOrder: 1 },
    { name: 'Mains', description: 'Main course dishes', sortOrder: 2 },
    { name: 'Drinks', description: 'Beverages and refreshments', sortOrder: 3 },
    { name: 'Desserts', description: 'Sweet treats and desserts', sortOrder: 4 },
    { name: 'Snacks', description: 'Quick bites and finger food', sortOrder: 5 },
  ]);
  console.log(`  ✅ ${categories.length} categories created`);

  // Find category IDs
  const findCat = (name: string) => categories.find((c) => c.name === name)!._id;

  // --- Menu Items (Bangladeshi cuisine) ---
  const menuItems = await MenuItem.create([
    // Appetizers
    { name: 'Chicken Samosa', description: 'Crispy pastry filled with spiced chicken', price: 60, category: findCat('Appetizers'), isAvailable: true },
    { name: 'Aloo Chop', description: 'Deep-fried spiced potato croquettes', price: 40, category: findCat('Appetizers'), isAvailable: true },
    { name: 'Fuchka', description: 'Crispy shells with tangy tamarind water', price: 80, category: findCat('Appetizers'), isAvailable: true },
    { name: 'Chicken Pakora', description: 'Batter-fried spiced chicken pieces', price: 120, category: findCat('Appetizers'), isAvailable: true },

    // Mains
    { name: 'Kacchi Biryani', description: 'Traditional basmati with tender mutton', price: 450, category: findCat('Mains'), isAvailable: true },
    { name: 'Beef Tehari', description: 'Mustard oil cooked aromatic beef rice', price: 380, category: findCat('Mains'), isAvailable: true },
    { name: 'Chicken Roast', description: 'Tender slow-cooked wedding-style roast', price: 220, category: findCat('Mains'), isAvailable: true },
    { name: 'Grilled Sea Bass', description: 'Fresh sea bass with herbs and lemon', price: 550, category: findCat('Mains'), isAvailable: true },
    { name: 'Mutton Rezala', description: 'Rich creamy mutton curry Kolkata style', price: 480, category: findCat('Mains'), isAvailable: true },
    { name: 'Fish Curry', description: 'Traditional Bengali fish curry with mustard', price: 350, category: findCat('Mains'), isAvailable: true },
    { name: 'Chicken Bhuna', description: 'Slow cooked spiced chicken gravy', price: 280, category: findCat('Mains'), isAvailable: true },
    { name: 'Vegetable Biryani', description: 'Fragrant rice with mixed vegetables', price: 250, category: findCat('Mains'), isAvailable: true },

    // Drinks
    { name: 'Borhani', description: 'Spiced yogurt digestive drink', price: 80, category: findCat('Drinks'), isAvailable: true },
    { name: 'Mango Lassi', description: 'Creamy mango yogurt smoothie', price: 120, category: findCat('Drinks'), isAvailable: true },
    { name: 'Fresh Lime Soda', description: 'Zesty lime with sparkling water', price: 60, category: findCat('Drinks'), isAvailable: true },
    { name: 'Masala Chai', description: 'Traditional spiced milk tea', price: 40, category: findCat('Drinks'), isAvailable: true },
    { name: 'Coffee', description: 'Freshly brewed hot coffee', price: 100, category: findCat('Drinks'), isAvailable: true },

    // Desserts
    { name: 'Rasmalai', description: 'Sweet cream soaked cheese dumplings', price: 120, category: findCat('Desserts'), isAvailable: true },
    { name: 'Mishti Doi', description: 'Bengali sweetened yogurt', price: 80, category: findCat('Desserts'), isAvailable: true },
    { name: 'Gulab Jamun', description: 'Deep fried milk dumplings in syrup', price: 100, category: findCat('Desserts'), isAvailable: true },
    { name: 'Firni', description: 'Creamy rice pudding with cardamom', price: 90, category: findCat('Desserts'), isAvailable: true },

    // Snacks
    { name: 'French Fries', description: 'Crispy golden potato fries', price: 100, category: findCat('Snacks'), isAvailable: true },
    { name: 'Chicken Wings', description: 'Spiced and fried chicken wings', price: 180, category: findCat('Snacks'), isAvailable: true },
    { name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 80, category: findCat('Snacks'), isAvailable: true },
  ]);
  console.log(`  ✅ ${menuItems.length} menu items created`);

  // --- Settings ---
  await Settings.create({
    restaurantName: 'GastroFlow Restaurant',
    address: 'House 12, Road 5, Dhanmondi, Dhaka-1205',
    phone: '+880 1700-000000',
    taxRate: 15,
    serviceChargeRate: 5,
    currency: '৳',
  });
  console.log('  ✅ Settings created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:   admin@gastroflow.com / admin123');
  console.log('  Waiter:  waiter@gastroflow.com / waiter123');
  console.log('  Cashier: cashier@gastroflow.com / cashier123');
  console.log('  Kitchen: kitchen@gastroflow.com / kitchen123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
