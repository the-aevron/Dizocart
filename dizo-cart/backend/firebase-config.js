/**
 * Dizo Cart — Firebase Configuration
 * ============================================================
 * Replace all placeholder values with your Firebase project details.
 * Get them from: Firebase Console → Project Settings → General → Your apps
 *
 * SECURITY: This file contains public API keys.
 * Secure your data using Firebase Security Rules (not by hiding keys).
 * ============================================================
 */

// Import Firebase SDKs
// In a module environment:
// import { initializeApp } from "firebase/app";
// In a CDN/browser environment (index.html):
// <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js"></script>

const firebaseConfig = {
  apiKey:            "YOUR_FIREBASE_API_KEY",
  authDomain:        "YOUR_PROJECT_ID.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
  measurementId:     "YOUR_MEASUREMENT_ID"  // Optional: for Analytics
};

/**
 * Initialize Firebase (uncomment when ready to use)
 */
// const app = firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const auth = firebase.auth();
// const storage = firebase.storage();

/**
 * Firestore Security Rules (paste in Firebase Console → Firestore → Rules)
 * ============================================================
 *
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Products: anyone can read, only admin can write
 *     match /products/{productId} {
 *       allow read: if true;
 *       allow write: if request.auth != null && request.auth.token.admin == true;
 *     }
 *     // Orders: authenticated users can create, admin can read all
 *     match /orders/{orderId} {
 *       allow create: if true;
 *       allow read, update: if request.auth != null && request.auth.token.admin == true;
 *     }
 *     // Customers: admin only
 *     match /customers/{customerId} {
 *       allow read, write: if request.auth != null && request.auth.token.admin == true;
 *     }
 *     // Reviews: anyone can read, authenticated users can create
 *     match /reviews/{reviewId} {
 *       allow read: if true;
 *       allow create: if request.auth != null;
 *     }
 *   }
 * }
 */

/**
 * Storage Security Rules (paste in Firebase Console → Storage → Rules)
 * ============================================================
 *
 * rules_version = '2';
 * service firebase.storage {
 *   match /b/{bucket}/o {
 *     match /products/{allPaths=**} {
 *       allow read: if true;
 *       allow write: if request.auth != null && request.auth.token.admin == true;
 *     }
 *   }
 * }
 */

/**
 * Product Functions
 * Replace localStorage calls in config.js with these
 */
const FirebaseProducts = {
  async getAll() {
    // const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
    // return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.warn('Firebase not configured. Using localStorage.');
    return [];
  },

  async add(product) {
    // const ref = await db.collection('products').add({ ...product, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    // return ref.id;
  },

  async update(id, data) {
    // await db.collection('products').doc(id).update({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  },

  async delete(id) {
    // await db.collection('products').doc(id).delete();
  }
};

/**
 * Order Functions
 */
const FirebaseOrders = {
  async place(orderData) {
    // const ref = await db.collection('orders').add({ ...orderData, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
    // return ref.id;
  },

  async getAll() {
    // const snap = await db.collection('orders').orderBy('timestamp', 'desc').get();
    // return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateStatus(id, status) {
    // await db.collection('orders').doc(id).update({ status, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  }
};

/**
 * Image Upload (Firebase Storage)
 */
async function uploadImageToFirebase(file, productId) {
  // const storageRef = storage.ref().child(`products/${productId}/${Date.now()}_${file.name}`);
  // const snap = await storageRef.put(file);
  // return await snap.ref.getDownloadURL();
  console.warn('Firebase Storage not configured.');
  return null;
}

if (typeof module !== 'undefined') {
  module.exports = { firebaseConfig, FirebaseProducts, FirebaseOrders, uploadImageToFirebase };
}
