import { notifyAdmins } from '../services/notify.js';
import Complaint from '../models/Complaint.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createComplaint = asyncHandler(async (req, res) => {
  const { subject, message, orderId } = req.body;
  if (!subject || !message) return res.status(400).json({ message: 'subject and message required' });
  const complaint = await Complaint.create({
    reporter: req.user._id,
    subject,
    message,
    order: orderId || undefined,
  });
  await notifyAdmins({
    title: 'Complaint received',
    body: (req.body.subject || req.body.title || 'New complaint') + (req.body.message ? `: ${String(req.body.message).slice(0, 120)}` : ''),
    link: '/admin/complaints',
    relatedOrder: orderId || undefined,
  });
  res.status(201).json({ complaint });
});

export const myComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ reporter: req.user._id }).sort({ createdAt: -1 });
  res.json({ complaints });
});
