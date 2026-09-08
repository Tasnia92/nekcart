import Notification from '../models/Notification.js';
import User from '../models/User.js';

export async function notifyUser(userId, { title, body = '', link = '', relatedOrder = null } = {}) {
  if (!userId || !title) return null;
  return Notification.create({
    user: userId,
    title,
    body,
    link,
    relatedOrder: relatedOrder || undefined,
  });
}

export async function notifyAdmins(payload) {
  const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
  const out = [];
  for (const a of admins) {
    out.push(await notifyUser(a._id, payload));
  }
  return out;
}
