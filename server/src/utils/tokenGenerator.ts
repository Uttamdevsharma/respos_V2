import mongoose from 'mongoose';

/**
 * Generates sequential order tokens per day.
 * Format: #001, #002, #003...
 * Resets daily based on the order count for that day.
 */
export const generateOrderToken = async (): Promise<string> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const Order = mongoose.model('Order');
  const todayCount = await Order.countDocuments({
    createdAt: { $gte: today },
  });

  const tokenNumber = (todayCount + 1).toString().padStart(3, '0');
  return `#${tokenNumber}`;
};
