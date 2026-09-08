import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Category from './models/Category.js';
import Product from './models/Product.js';
import Settings from './models/Settings.js';
import Notification from './models/Notification.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nekcart';

await connectDB(uri);
await Promise.all([
  User.deleteMany({}),
  Category.deleteMany({}),
  Product.deleteMany({}),
  Settings.deleteMany({}),
  Notification.deleteMany({}),
]);

const password = await bcrypt.hash('Password123!', 10);

const admin = await User.create({
  name: 'Admin User',
  email: 'admin@soukcart.com',
  password,
  role: 'admin',
});

const supplier = await User.create({
  name: 'Amina Supplies',
  email: 'supplier@soukcart.com',
  password,
  role: 'supplier',
  businessName: 'Amina Wholesale',
  shopLink: 'https://example.com/amina',
  businessDescription: 'Grains and pantry staples',
  nidDocUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600',
  verificationStatus: 'approved',
  phone: '01700000001',
});

const retailer = await User.create({
  name: 'Karim Retail',
  email: 'retailer@soukcart.com',
  password,
  role: 'retailer',
  businessName: 'Karim Mart',
  phone: '01700000002',
});

await Settings.create({ key: 'global', commissionRate: 0.05 });

const cats = await Category.insertMany([
  { name: 'Grains', slug: 'grains', description: 'Rice, wheat, and more' },
  { name: 'Oils', slug: 'oils', description: 'Cooking oils' },
  { name: 'Spices', slug: 'spices', description: 'Spices and seasonings' },
]);

const img = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400';

await Product.insertMany([
  {
    name: 'Premium Basmati Rice',
    description: 'Long grain basmati, 1kg packs. Ideal for restaurants and retail shelves.',
    price: 120,
    unit: 'kg',
    stock: 500,
    moq: 10,
    imageUrl: img,
    category: cats[0]._id,
    supplier: supplier._id,
    status: 'approved',
  },
  {
    name: 'Soybean Oil',
    description: 'Refined soybean oil in 5L jerry cans.',
    price: 850,
    unit: 'can',
    stock: 120,
    moq: 2,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400',
    category: cats[1]._id,
    supplier: supplier._id,
    status: 'approved',
  },
  {
    name: 'Turmeric Powder',
    description: 'Freshly ground turmeric, 500g pouches.',
    price: 95,
    unit: 'pouch',
    stock: 200,
    moq: 5,
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    category: cats[2]._id,
    supplier: supplier._id,
    status: 'approved',
  },
  {
    name: 'Pending Sample SKU',
    description: 'Awaiting admin approval.',
    price: 50,
    unit: 'box',
    stock: 40,
    moq: 1,
    imageUrl: img,
    category: cats[0]._id,
    supplier: supplier._id,
    status: 'pending',
  },
]);

await Notification.create({
  user: retailer._id,
  title: 'Welcome to soukcart',
  body: 'Browse the catalog and place your first order.',
  link: '/retailer/products',
});

console.log('Seed complete');
console.log({ admin: admin.email, supplier: supplier.email, retailer: retailer.email, password: 'Password123!' });
await mongoose.disconnect();
