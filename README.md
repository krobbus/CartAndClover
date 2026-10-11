# Cart & Clover — MERN E-Commerce Platform

**Cart & Clover** is a full-stack MERN (MongoDB, Express.js, React, Node.js) e-commerce application featuring responsive Tailwind CSS styling, strict Role-Based Access Control (RBAC), and secure order/inventory workflows.

## Tech Stack

* **Frontend:** React, React Router, Tailwind CSS, FontAwesome icons.
* **Backend:** Node.js, Express.js.
* **Database:** MongoDB with Mongoose ODM (featuring structured schemas for users, products, carts, and orders).
* **State Management:** React Context API (`AuthContext`).

## Key Features & Architecture

### 1. Secure Authentication & Backend Security
* **Password Hashing:** Implements secure cryptographic password hashing (such as bcrypt) to protect user credentials before saving them to the database.
* **Token-Based Authentication:** Uses JSON Web Tokens (`jsonwebtoken`) for issuing session tokens, verifying secure API requests, and managing authenticated sessions.
* **Role-Based Access Control (RBAC):** Three distinct user roles (**Shopper**, **Seller**, and **Admin**) governed by global management flags (`isAdmin`, `canManage`, `isSeller`) that dynamically secure backend endpoints and toggle UI controls.

### 2. Marketplace & Product Management
* Browse a rich catalog with real-time search queries and category filtering (General, Clothing, Electronics, Home & Living, Food, Accessories).
* **Strict Ownership Verification:** Sellers and administrators can manage products, but sellers are strictly restricted from modifying or deleting products owned by other users, while admins maintain global oversight.
* Dynamic placeholder asset mapping based on product categories.

### 3. Shopping Cart & Checkout Workflow
* Interactive shopping cart supporting real-time quantity adjustments, stock limit validation, and item selection checkboxes.
* A mobile-responsive floating **Order Summary** card with a toggleable display button and badge count counters.
* Streamlined one-way payment validation workflows (`Unpaid` --> `Paid`).

### 4. Comprehensive Order Tracking
* Role-scoped order directories (`Orders.jsx`):
  * **Shoppers** can track and review only their past purchases.
  * **Sellers** can view and manage orders containing their specific store products.
  * **Admins** have global visibility across all platform customer orders.
* Order status tracking (Pending, Processing, Shipped, Delivered, Cancelled) with dedicated color-coded status badges.

## Database Schema Overview (`Order.js`)

The platform utilizes robust Mongoose schemas enforcing relational data integrity:
* **User Schema:** Manages user accounts, authentication credentials, and role definitions.
* **Product Schema:** Stores product inventory, pricing, stock counts, categories, and seller ownership references.
* **Order Schema:** Links customers (`user`), ordered items (`orderItems` array with product references, quantities, and prices), shipping addresses, payment methods, total amounts, payment status flags (`isPaid`), and fulfillment statuses.

## Getting Started

### Prerequisites
* Node.js (v16+ recommended)
* MongoDB instance (Local or MongoDB Atlas)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/cart-and-clover.git](https://github.com/your-username/cart-and-clover.git)
   cd cart-and-clover

2. **Install dependencies across the entire project structure from the root directory (Root, Frontend, and Backend):**
   ```bash
   npm install
*(Note: This runs concurrently or installs packages for both client and server depending on your workspace configuration)*

3. **Create a .env file with your environment variables (PORT, MONGO_URI, JWT_SECRET)**

4. **Run Concurrently**
   ```bash
   npm run start
*Start both the backend server and frontend development client simultaneously from the main project folder*