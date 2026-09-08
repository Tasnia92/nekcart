# Simple B2B E-Commerce Architecture & Development Plan

## 1. Technology Stack

Use a simple MERN-style architecture:

```text
Frontend
React + Vite
Tailwind CSS
React Context

Backend
Node.js
Express.js
Mongoose

Database
MongoDB Atlas

Payments
SSLCommerz Sandbox

Product Images
Cloudinary

Authentication
JWT + bcrypt

Deployment
Frontend → Vercel
Backend → Render / Railway
Database → MongoDB Atlas
```

Do not introduce Redux, GraphQL, NestJS, microservices, Kubernetes, Redis, or other unnecessary infrastructure for version 1.

The goal is:

> **Simple code, simple folders, simple database, and one obvious place for every business rule.**

---

# 2. Overall Architecture

```text
                    ┌──────────────────────┐
                    │      React App       │
                    │                      │
                    │ Retailer             │
                    │ Supplier             │
                    │ Admin                │
                    └──────────┬───────────┘
                               │
                          REST API
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Express Backend    │
                    │                      │
                    │ Routes               │
                    │ Controllers          │
                    │ Middleware           │
                    │ Business Logic       │
                    └──────────┬───────────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       ┌─────────────────┐          ┌──────────────────┐
       │   MongoDB Atlas │          │ SSLCommerz       │
       │                 │          │ Sandbox          │
       │ Users           │          │                  │
       │ Products        │          │ Delivery payment │
       │ Orders          │          │ Online payment   │
       │ Payouts         │          │ Refund handling  │
       │ Complaints      │          │                  │
       └─────────────────┘          └──────────────────┘
```

---

# 3. Project Structure

```text
b2b-ecommerce/
│
├── client/
│   │
│   ├── src/
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductForm.jsx
│   │   │   ├── OrderStatus.jsx
│   │   │   └── Button.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── MyOrders.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   │
│   │   │   ├── supplier/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Products.jsx
│   │   │   │   └── Orders.jsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Orders.jsx
│   │   │       ├── Products.jsx
│   │   │       ├── Categories.jsx
│   │   │       ├── Suppliers.jsx
│   │   │       ├── Payouts.jsx
│   │   │       └── Users.jsx
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── CartContext.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── server/
│   │
│   ├── src/
│   │   │
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Supplier.js
│   │   │   ├── Product.js
│   │   │   ├── Category.js
│   │   │   ├── Order.js
│   │   │   ├── Payment.js
│   │   │   ├── Payout.js
│   │   │   └── Complaint.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── supplier.routes.js
│   │   │   └── admin.routes.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── order.controller.js
│   │   │   ├── supplier.controller.js
│   │   │   └── admin.controller.js
│   │   │
│   │   ├── services/
│   │   │   ├── order.service.js
│   │   │   ├── payment.service.js
│   │   │   ├── refund.service.js
│   │   │   ├── payout.service.js
│   │   │   ├── calculations.js
│   │   │   ├── adminCalculations.js
│   │   │   ├── notification.service.js
│   │   │   └── verification.service.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── admin.js
│   │   │
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── package.json
│
├── .env
├── .gitignore
├── package.json
└── README.md
```

---

# 4. Most Important Design Rule

Keep business logic in `services/`.

```text
services/
│
├── order.service.js
├── payment.service.js
├── refund.service.js
├── payout.service.js
├── calculations.js
└── adminCalculations.js
```

The responsibilities are very clear:

```text
order.service.js
→ What happens to an order?

payment.service.js
→ How do payments work?

refund.service.js
→ When and how is money refunded?

payout.service.js
→ How much does each supplier receive?

calculations.js
→ Pure mathematical calculations

adminCalculations.js
→ Dashboard totals and admin statistics
```

This is much easier to understand than putting financial logic inside React components or route files.

## The supplied technical guide similarly keeps payout calculations, ledger behavior, payment/refund behavior, dashboard aggregation, disputes, catalog moderation, and verification as distinct business areas.

# 5. Order Flow

This should be the central business process.

## Step 1 — Retailer creates order

Retailer:

```text
Product
   ↓
Cart
   ↓
Checkout
```

The system calculates:

```text
Product subtotal
+ Delivery fee
= Order total
```

The fixed delivery fee is:

```text
৳120
```

For both normal online payment and COD, the retailer must pay the ৳120 delivery fee before the order is successfully placed.

---

# 6. Online Payment Flow

```text
Retailer
    ↓
Checkout
    ↓
Pay ৳120 delivery fee
    ↓
SSLCommerz Sandbox
    ↓
Payment successful
    ↓
Order created
    ↓
Supplier notified
```

The retailer does not get an active order until the delivery-fee payment succeeds.

For example:

```text
Products          ৳5,000
Delivery fee       ৳120
------------------------
Order total       ৳5,120
```

The system records the delivery payment separately so the order's financial history is easy to understand.

---

# 7. COD Flow

COD has a slightly different payment sequence.

```text
Retailer
    ↓
Checkout
    ↓
Pay ৳120 delivery fee
    ↓
SSLCommerz Sandbox
    ↓
Order created
    ↓
Supplier notified
    ↓
Supplier confirms
    ↓
Admin starts delivery
    ↓
Retailer receives product
    ↓
Retailer pays remaining merchandise amount
```

Therefore:

```text
COD = Delivery fee paid online
      +
      Merchandise paid on delivery
```

The order should therefore maintain separate payment information for:

```text
deliveryFeePaid
productAmountPaid
paymentMethod
paymentStatus
```

This is consistent with the source guide's distinction between delivery payment and merchandise payment for COD.

---

# 8. Supplier Order Approval

Once the retailer successfully creates the order:

```text
Order status:
PENDING_SUPPLIER
```

Supplier receives a notification:

```text
New Order Received
Order #10045
৳5,000 merchandise
```

Supplier has two choices:

```text
CONFIRM
CANCEL
```

---

# 9. Supplier Confirms

When supplier confirms:

```text
PENDING_SUPPLIER
        ↓
SUPPLIER_CONFIRMED
        ↓
ADMIN notification
```

Admin now sees:

```text
New order ready for delivery processing
```

The admin becomes responsible for the delivery workflow.

---

# 10. Supplier Cancels

If the supplier cancels **before admin delivery starts**:

```text
Supplier cancels
        ↓
Order cancelled
        ↓
Refund customer
```

The retailer receives the applicable payment back.

For online orders, the refund applies to money already paid according to the order's refundable amount.

For COD:

```text
৳120 delivery payment
        ↓
Supplier cancels
        ↓
Refund ৳120
```

The refund logic should be centralized in:

```text
services/refund.service.js
```

The PDF also establishes a principle that cancellation/refund processing should be separate from seller payout effects, and that pending payout amounts should be reversed rather than accidentally paid.

---

# 11. Admin Delivery Process

After supplier confirmation:

```text
SUPPLIER_CONFIRMED
        ↓
Admin notification
        ↓
Admin starts delivery
```

At this point:

```text
CANCELLATION = NOT ALLOWED
```

This is a very important business rule.

The backend should enforce it.

For example:

```js
if (order.status === "DELIVERY_STARTED") {
  return error("Order can no longer be cancelled");
}
```

Do not rely only on hiding the cancellation button in React.

The server must enforce the rule.

---

# 12. Delivery Statuses

Keep delivery statuses simple.

```text
PENDING_SUPPLIER
SUPPLIER_CONFIRMED
DELIVERY_STARTED
IN_TRANSIT
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

The admin is the only user who can move an order through the delivery statuses after delivery begins.

Example:

```text
SUPPLIER_CONFIRMED
        ↓
DELIVERY_STARTED
        ↓
IN_TRANSIT
        ↓
OUT_FOR_DELIVERY
        ↓
DELIVERED
```

---

# 13. Cancellation Rule

The most important rule is:

```text
                    ADMIN STARTS DELIVERY
                           │
                ┌──────────┴──────────┐
                │                     │
             BEFORE                  AFTER
                │                     │
        Cancellation allowed     Cancellation blocked
                │
        Refund if applicable
```

So the backend can have one simple condition:

```text
deliveryStarted = false
    → cancellation allowed

deliveryStarted = true
    → cancellation forbidden
```

I recommend having the order store:

```js
deliveryStarted: false
```

When admin starts delivery:

```js
deliveryStarted: true
```

That makes this business rule extremely easy to understand.

---

# 14. Refund Logic

Put all refund decisions in:

```text
services/refund.service.js
```

The basic logic:

```text
Was money actually paid?
        │
        ├── No → No refund
        │
        └── Yes
              ↓
       Was delivery started?
              │
          ┌───┴───┐
          │       │
         No      Yes
          │       │
       Refund   No cancellation
```

Potential refund situations:

```text
Supplier cancels before delivery
Admin cancels before delivery
Other permitted pre-delivery cancellation
```

After delivery starts:

```text
No normal order cancellation
```

The original guide also treats refunds and payout reversal as separate financial operations and describes manual/offline refund processing as a policy layer.

For your new system, the actual SSLCommerz refund implementation should be kept behind `refund.service.js`, so the rest of the application does not need to know how SSLCommerz works internally.

---

# 15. Payment Model

Keep payment records separate from orders.

```text
Payment.js
```

Example:

```js
{
  orderId,
  type: "delivery_fee",
  amount: 120,
  method: "sslcommerz",
  status: "paid",
  transactionId,
  createdAt
}
```

For COD:

```js
{
  orderId,
  type: "merchandise",
  amount: 5000,
  method: "cod",
  status: "pending"
}
```

This makes the payment history much easier to understand than putting every transaction into one large Order object.

---

# 16. Order Model

Keep the order itself focused on order information.

```js
{
  retailer,
  supplier,

  items: [
    {
      product,
      name,
      price,
      quantity
    }
  ],

  subtotal,
  deliveryFee,
  total,

  paymentMethod,

  status,

  deliveryStarted,

  supplierConfirmedAt,
  deliveryStartedAt,
  deliveredAt,

  createdAt
}
```

Do not put complicated calculations inside the Mongoose model.

---

# 17. Calculations

Keep all pure calculations in:

```text
services/calculations.js
```

Example:

```js
export function calculateSubtotal(items) {
  return items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

export function calculateOrderTotal(subtotal, deliveryFee = 120) {
  return subtotal + deliveryFee;
}

export function calculateCommission(
  subtotal,
  commissionRate
) {
  return subtotal * commissionRate;
}

export function calculateSupplierEarnings(
  subtotal,
  commissionRate
) {
  const commission = calculateCommission(
    subtotal,
    commissionRate
  );

  return {
    commission,
    earnings: subtotal - commission
  };
}
```

The important rule:

> **Commission applies to merchandise, not the fixed delivery fee.**

That matches the financial separation documented in the supplied guide.

---

# 18. Admin Commission Setting

Admin should be able to change the commission rate.

For example:

```text
Current commission: 10%

[ Change commission ]
```

Store it in a simple settings collection:

```text
settings
```

Example:

```js
{
  commissionRate: 0.10,
  deliveryFee: 120
}
```

This means you don't have:

```js
10
```

hardcoded everywhere.

Instead:

```js
const settings = await getSettings();
```

Then:

```js
settings.commissionRate
```

and:

```js
settings.deliveryFee
```

---

# 19. Supplier Payouts

When a qualifying order is completed, calculate:

```text
Merchandise subtotal
        ↓
Commission
        ↓
Supplier earnings
```

Example:

```text
Merchandise       ৳10,000
Commission 10%     ৳1,000
--------------------------
Supplier earnings  ৳9,000
```

The ৳120 delivery fee is separate.

Create:

```text
Payout.js
```

Example:

```js
{
  supplier,
  order,
  orderAmount,
  commissionRate,
  commissionAmount,
  supplierAmount,
  status: "pending",
  createdAt
}
```

---

# 20. Weekly Payouts

Admin manages supplier payouts.

Supplier dashboard:

```text
Available balance
Pending balance
Total paid
```

Admin dashboard:

```text
Supplier payouts
--------------------------
Supplier A     ৳25,000
Supplier B     ৳18,500
Supplier C     ৳12,200
```

Admin can process weekly payouts.

```text
PENDING
   ↓
ADMIN PAYS
   ↓
PAID
```

The payout service should be responsible for this:

```text
services/payout.service.js
```

Example functions:

```text
calculatePayout()
getPendingPayouts()
getSupplierBalance()
markPayoutAsPaid()
processWeeklyPayout()
```

The uploaded guide also uses an explicit pending → paid payout model and calculates supplier earnings from ledger/payout data rather than simply deriving them from dashboard display values.

---

# 21. Important Payout Rule

Do not pay a supplier simply because an order exists.

The lifecycle should be controlled.

For example:

```text
Order created
     ↓
Supplier confirmed
     ↓
Delivery started
     ↓
Delivered
     ↓
Payment requirements satisfied
     ↓
Payout becomes eligible
     ↓
Weekly admin payout
```

This prevents cancelled or incomplete orders from accidentally entering the payout system.

---

# 22. Admin Dashboard

Keep admin dashboard calculations in:

```text
services/adminCalculations.js
```

Dashboard can show:

```text
Total orders
Pending supplier approvals
Orders in delivery
Delivered orders
Cancelled orders
Gross merchandise value
Collected revenue
Pending supplier payouts
Paid supplier payouts
Commission earned
Refund amount
Open complaints
```

Example:

```js
export function calculateDashboard(orders, payouts) {
  return {
    totalOrders: orders.length,
    pendingOrders: ...,
    deliveredOrders: ...,
    cancelledOrders: ...,
    revenue: ...,
    pendingPayouts: ...,
    paidPayouts: ...
  };
}
```

The source guide similarly separates captured, refunded, settled, payout, and SLA-oriented admin KPIs rather than treating all order totals as the same financial measure.

---

# 23. Notifications

Don't build a complicated notification system initially.

Use a simple Notification model:

```text
Notification.js
```

with:

```js
{
  user,
  title,
  message,
  type,
  read,
  createdAt
}
```

Important notifications:

```text
Retailer
→ Order confirmed
→ Order cancelled
→ Order delivered
→ Refund processed

Supplier
→ New order
→ Order cancelled
→ Order confirmed by system

Admin
→ Supplier confirmed order
→ New order ready for delivery
→ Refund required
→ Complaint received
```

---

# 24. Supplier Verification

Use:

```text
services/verification.service.js
```

Supplier lifecycle:

```text
PENDING
   ↓
APPROVED
```

or:

```text
PENDING
   ↓
REJECTED
```

A supplier can resubmit after rejection.

The PDF specifies supplier approval changing supplier status/role and supplier renaming causing the verification status to return to pending. That pattern can be retained in the MongoDB version.

---

# 25. Product Moderation

Product fields:

```js
isActive
approvalStatus
```

Statuses:

```text
pending
approved
rejected
hidden
```

Public catalog:

```text
isActive = true
AND
approvalStatus = approved
```

Admin can:

```text
Approve
Reject
Hide
Restore
Delete
```

This directly mirrors the simple two-flag moderation approach documented in the source guide.

---

# 26. Category Management

Admin:

```text
Create
Edit
Hide
Show
Delete
```

Product:

```text
categoryId
```

Deleting a category should not accidentally delete products.

Instead:

```text
Delete Category
       ↓
Products become uncategorized
```

This corresponds to the source guide's category deletion behavior, where deleting a category clears the category relationship rather than deleting the products.

---

# 27. Complaints / Disputes

Keep this simple.

```text
Complaint.js
```

```js
{
  retailer,
  supplier,
  order,
  subject,
  description,
  status: "open",
  createdAt,
  resolvedAt
}
```

Statuses:

```text
open
resolved
```

Admin can:

```text
View complaint
Resolve complaint
```

Complaints should not automatically change supplier payouts.

This is also consistent with the supplied guide's rule that dispute creation/resolution has no automatic seller-payout side effects.

---

# 28. Order State Machine

This should be documented in one place because it is the heart of the application.

```text
                    ┌─────────────────────┐
                    │       CREATED       │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ PENDING_SUPPLIER     │
                    └───────┬───────┬─────┘
                            │       │
                      CONFIRM       CANCEL
                            │       │
                            ↓       ↓
               ┌────────────────┐  CANCELLED
               │SUPPLIER_CONFIRMED│
               └────────┬───────┘
                        ↓
              ┌──────────────────┐
              │ DELIVERY_STARTED │
              └────────┬─────────┘
                       ↓
                  IN_TRANSIT
                       ↓
                OUT_FOR_DELIVERY
                       ↓
                   DELIVERED
```

Cancellation is allowed only before:

```text
DELIVERY_STARTED
```

Once:

```text
deliveryStarted = true
```

normal order cancellation is blocked.

---

# 29. Who Can Change What?

## Retailer

```text
Create order
View order
Cancel before delivery starts
View refund
Pay COD merchandise
Create complaint
```

## Supplier

```text
View new orders
Confirm order
Cancel order before delivery starts
Manage products
View earnings
View payout history
```

## Admin

```text
Approve suppliers
Manage products
Manage categories
View all orders
Start delivery
Update delivery status
Handle refunds
Manage commission
Manage payouts
View dashboard
Resolve complaints
```

This permission model should be enforced through backend middleware.

---

# 30. Backend Permission Structure

Very simple:

```js
auth
```

checks that the user is logged in.

```js
admin
```

checks that:

```js
user.role === "admin"
```

For supplier-specific actions:

```js
supplier
```

checks:

```js
user.role === "supplier"
```

Then routes stay readable:

```js
router.post(
  "/orders/:id/confirm",
  auth,
  supplier,
  confirmOrder
);

router.post(
  "/orders/:id/start-delivery",
  auth,
  admin,
  startDelivery
);

router.post(
  "/payouts/:id/pay",
  auth,
  admin,
  markPayoutAsPaid
);
```

---

# 31. Payment Architecture

The application should not spread SSLCommerz code throughout the project.

Use:

```text
services/payment.service.js
```

Only this service communicates with SSLCommerz.

The rest of the application simply calls:

```js
createPayment(...)
verifyPayment(...)
handlePaymentSuccess(...)
handlePaymentFailure(...)
```

The flow becomes:

```text
React Checkout
      ↓
POST /api/orders
      ↓
order.controller.js
      ↓
order.service.js
      ↓
payment.service.js
      ↓
SSLCommerz
```

This makes it possible to change payment providers later without rewriting the entire application.

---

# 32. Recommended Financial Separation

Keep these concepts separate:

```text
Order amount
Delivery fee
Payment
Refund
Commission
Supplier payout
```

Do not combine everything into one `total` field and try to derive everything later.

A clean structure is:

```text
Order
├── subtotal
├── deliveryFee
└── total

Payment
├── type
├── amount
├── method
└── status

Payout
├── orderAmount
├── commissionRate
├── commissionAmount
├── supplierAmount
└── status
```

This will make your admin dashboard and financial debugging much easier.

---

# 33. The Golden Rule for Business Logic

Every important business decision should happen on the backend.

Bad:

```text
React decides:
"Cancel button should be disabled"
```

Good:

```text
React hides the button
        +
Backend checks:
deliveryStarted === false
```

Bad:

```text
React calculates commission
```

Good:

```text
Backend calculates commission
```

Bad:

```text
React decides supplier can confirm order
```

Good:

```text
Backend checks user.role === supplier
```

---

# 34. Development Order

Build the project in this exact sequence.

## Phase 1 — Project foundation

```text
1. Create React + Vite
2. Create Express server
3. Connect MongoDB Atlas
4. Configure environment variables
5. Create basic API
```

## Phase 2 — Authentication

```text
6. User model
7. Register
8. Login
9. JWT
10. Auth middleware
11. Role middleware
```

## Phase 3 — Catalog

```text
12. Product model
13. Category model
14. Product API
15. Category API
16. Product listing
17. Product details
18. Admin product management
19. Admin category management
```

## Phase 4 — Cart and orders

```text
20. Cart
21. Checkout
22. Order model
23. Order creation
24. Delivery-fee calculation
```

## Phase 5 — SSLCommerz

```text
25. SSLCommerz sandbox configuration
26. Delivery-fee payment
27. Payment success handling
28. Payment failure handling
29. Payment records
```

## Phase 6 — Supplier approval

```text
30. Supplier role
31. Supplier dashboard
32. Supplier order notification
33. Confirm order
34. Cancel order
```

## Phase 7 — Admin delivery

```text
35. Admin order dashboard
36. Start delivery
37. Update delivery status
38. Disable cancellation after delivery starts
39. Mark delivered
```

## Phase 8 — Refunds

```text
40. Refund service
41. Supplier cancellation refund
42. Admin cancellation refund
43. Refund records
```

## Phase 9 — Payouts

```text
44. Commission setting
45. Payout calculation
46. Supplier balance
47. Pending payouts
48. Weekly admin payout
49. Payout history
```

## Phase 10 — Additional features

```text
50. Notifications
51. Supplier verification
52. Complaints
53. Admin dashboard KPIs
54. Reporting
55. UI polish
```

---

# 35. Final Architecture Philosophy

The project should follow this pattern:

```text
MODELS
What does the data look like?

ROUTES
What URL is being called?

CONTROLLERS
What request is being handled?

SERVICES
What should actually happen?

MIDDLEWARE
Who is allowed to do it?

CALCULATIONS
What is the mathematical result?
```

For example:

```text
Supplier confirms order

React
 ↓
POST /api/orders/123/confirm
 ↓
order.routes.js
 ↓
order.controller.js
 ↓
order.service.js
 ↓
Check supplier
 ↓
Check order status
 ↓
Set supplierConfirmed
 ↓
Create admin notification
 ↓
MongoDB
```

For a refund:

```text
Supplier cancels
 ↓
order.service.js
 ↓
Check deliveryStarted
 ↓
refund.service.js
 ↓
Calculate refundable amount
 ↓
SSLCommerz refund process
 ↓
Update payment/refund
 ↓
Update order
```

For a payout:

```text
Delivered order
 ↓
payout.service.js
 ↓
calculations.js
 ↓
Get commission rate
 ↓
Calculate commission
 ↓
Calculate supplier earnings
 ↓
Create Payout
 ↓
Admin pays weekly
 ↓
Payout = PAID
```

That is the architecture I would use.

It is **small enough for one developer to understand**, but it still gives you dedicated places for the complicated parts of the business: **SSLCommerz payments, order state transitions, cancellation/refund rules, delivery, commission calculations, supplier payouts, admin dashboard calculations, verification, moderation, and complaints**.

Most importantly, the application has one clear source of truth for every major financial or business rule rather than scattering calculations across React components, controllers, and database queries.
