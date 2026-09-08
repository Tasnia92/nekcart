import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notifyUser } from '../services/notify.js';

export const listProducts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.scope === 'catalog' || req.user?.role === 'retailer' || !req.user) {
    filter.status = 'approved';
    filter.isActive = true;
  }
  if (req.query.supplier) filter.supplier = req.query.supplier;
  if (req.query.mine === '1' && req.user?.role === 'supplier') filter.supplier = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };
  if (req.query.category) filter.category = req.query.category;

  const products = await Product.find(filter)
    .populate('category', 'name')
    .populate('supplier', 'name businessName')
    .sort({ createdAt: -1 });
  res.json({ products });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name')
    .populate('supplier', 'name businessName');
  if (!product) return res.status(404).json({ message: 'Not found' });
  res.json({ product });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, unit, stock, moq, imageUrl, category } = req.body;
  if (!name || price == null || !unit || stock == null || moq == null) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const product = await Product.create({
    name,
    description,
    price,
    unit,
    stock,
    moq,
    imageUrl: imageUrl || '',
    category: category || undefined,
    supplier: req.user._id,
    status: 'pending',
  });
  res.status(201).json({ product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });
  if (req.user.role === 'supplier' && String(product.supplier) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const fields = ['name', 'description', 'price', 'unit', 'stock', 'moq', 'imageUrl', 'category', 'isActive'];
  for (const f of fields) if (req.body[f] !== undefined) product[f] = req.body[f];
  if (req.user.role === 'supplier') product.status = 'pending';
  await product.save();
  res.json({ product });
});


export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'Not found' });

  const open = await Order.countDocuments({
    'items.product': product._id,
    status: { $nin: ['cancelled', 'supplier_cancelled', 'refunded', 'awaiting_payment'] },
  });
  if (open > 0) {
    return res.status(400).json({
      message: `Cannot delete: ${open} active order(s) still reference this product`,
    });
  }

  await product.deleteOne();
  res.json({ ok: true });
});

export const moderateProduct = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const product = await Product.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!product) return res.status(404).json({ message: 'Not found' });
  if (['approved', 'rejected'].includes(status)) {
    await notifyUser(product.supplier, {
      title: status === 'approved' ? 'Product approved' : 'Product rejected',
      body: `Your product "${product.name}" was ${status}.`,
      link: '/supplier/products',
    });
  }
  res.json({ product });
});

export const listCategories = asyncHandler(async (_req, res) => {
  const filter = {};
  if (req.query.all !== '1') filter.isActive = true;
  const categories = await Category.find(filter).sort({ name: 1 });
  res.json({ categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Name required' });
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const category = await Category.create({ name, slug, description: req.body.description });
  res.status(201).json({ category });
});


export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Not found' });
  if (req.body.name !== undefined) {
    category.name = req.body.name.trim();
    category.slug = category.name.toLowerCase().replace(/\s+/g, '-');
  }
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.isActive !== undefined) category.isActive = !!req.body.isActive;
  await category.save();
  res.json({ category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
});
