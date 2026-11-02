import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Restaurant from '../models/Restaurant.js';

async function fixAccount() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const email = 'admin@gastroflow.com';
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log(`❌ User with email ${email} not found!`);
      // List all users in the system to help diagnose
      const allUsers = await User.find({}, 'name email role isActive restaurant_id');
      console.log('Existing users in DB:', allUsers);
      process.exit(1);
    }

    console.log('Found user:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      restaurant_id: user.restaurant_id,
    });

    // Update user: activate and set password
    user.isActive = true;
    user.password = 'admin@gastroflow.com'; // setting password to what user specified
    await user.save();
    console.log(`✅ User ${email} activated and password updated to 'admin@gastroflow.com'`);

    // Also check associated restaurant
    if (user.restaurant_id) {
      const rest = await Restaurant.findById(user.restaurant_id);
      if (rest) {
        console.log('Associated Restaurant:', {
          id: rest._id,
          name: rest.name,
          status: rest.status,
          subscription_end: rest.subscription_end,
        });

        if (rest.status !== 'APPROVED') {
          rest.status = 'APPROVED';
          await rest.save();
          console.log(`✅ Restaurant status updated to 'APPROVED'`);
        }
      }
    }

    console.log('🎉 Done! Account is now active and ready to log in.');
  } catch (error) {
    console.error('Error fixing account:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixAccount();

