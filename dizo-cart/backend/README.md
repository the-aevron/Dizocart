# Dizo Cart — Backend Integration Guide

## Overview

The frontend is fully functional as a standalone SPA using `localStorage`.  
This guide shows how to connect a real backend database when you're ready to scale.

---

## Option A: Firebase (Recommended for Quick Start)

### Setup
```bash
npm install firebase
```

### Config (`/backend/firebase-config.js`)
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
```

### Products (Firestore)
```javascript
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

// Get all products
async function loadProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Add product
async function addProduct(product) {
  return await addDoc(collection(db, "products"), product);
}

// Update product
async function updateProduct(id, data) {
  return await updateDoc(doc(db, "products", id), data);
}

// Delete product
async function deleteProduct(id) {
  return await deleteDoc(doc(db, "products", id));
}
```

### Authentication (Firebase Auth)
```javascript
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";

// Login
async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// Register
async function registerUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}
```

### Image Upload (Firebase Storage)
```javascript
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

async function uploadProductImage(file, productId) {
  const storageRef = ref(storage, `products/${productId}/${file.name}`);
  const snap = await uploadBytes(storageRef, file);
  return await getDownloadURL(snap.ref);
}
```

---

## Option B: Supabase

### Setup
```bash
npm install @supabase/supabase-js
```

### Config (`/backend/supabase-config.js`)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY';
export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Products (Supabase)
```javascript
// Get all products
const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });

// Add product
const { data, error } = await supabase.from('products').insert([product]);

// Update product
const { data, error } = await supabase.from('products').update(updates).eq('id', productId);

// Delete product
const { error } = await supabase.from('products').delete().eq('id', productId);
```

---

## Option C: Custom REST API (Node.js / Express)

### Endpoints to build:
```
GET    /api/products              → list all products
GET    /api/products/:id          → single product
POST   /api/products              → create product (admin only)
PUT    /api/products/:id          → update product (admin only)
DELETE /api/products/:id          → delete product (admin only)

GET    /api/orders                → list orders (admin only)
GET    /api/orders/:id            → single order
POST   /api/orders                → place order (public)
PUT    /api/orders/:id/status     → update status (admin only)

GET    /api/customers             → list customers (admin only)
GET    /api/customers/:phone      → single customer

POST   /api/auth/login            → user login
POST   /api/auth/register         → user register
POST   /api/auth/admin/login      → admin login

GET    /api/coupons/:code         → validate coupon
POST   /api/reviews               → submit review
```

### Middleware
```javascript
// /backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Connecting to the Frontend

Replace the `localStorage` calls in `/assets/js/config.js` with API calls:

```javascript
// Before (localStorage):
function saveProductsToStorage() {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify({ products }));
}

// After (API):
async function saveProductsToServer(product) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify(product)
  });
  return res.json();
}
```

---

## Environment Variables

Create a `.env` file at the project root (never commit this):
```
# Firebase
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Custom API
API_BASE_URL=https://api.yourdomain.com
JWT_SECRET=your-super-secret-key

# Admin
ADMIN_EMAIL=admin@dizocart.com

# SMS / WhatsApp
TWILIO_SID=
TWILIO_AUTH=
TWILIO_PHONE=
```

---

## File Structure After Integration

```
/backend/
  firebase-config.js     ← Firebase SDK config
  supabase-config.js     ← Supabase client config
  api-client.js          ← Unified fetch wrapper
  auth.js                ← Auth helpers
  storage.js             ← File/image upload helpers
  middleware/
    adminAuth.js         ← JWT admin middleware
    rateLimit.js         ← Rate limiting
  server/                ← Express server (optional)
    index.js
    routes/
      products.js
      orders.js
      auth.js
      customers.js
```
