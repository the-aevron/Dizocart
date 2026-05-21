# 🛒 Dizo Cart — Professional E-Commerce Project

> Bangladesh's premier e-commerce platform for Kitchen, Home, Gadgets & Beauty products.  
> Converted from a single-file SPA to a scalable modular architecture.

---

## 🚀 Quick Start

1. **Open the store** → Double-click `index.html` or serve with a local server:
   ```bash
   # Python
   python3 -m http.server 8080
   # Node.js
   npx serve .
   ```
   Then visit `http://localhost:8080`

2. **Access Admin Panel** → Navigate to `http://localhost:8080/admin/`  
   Default password: `admin123` (change in Settings → Admin Password)

3. **Add products** → Admin → Products → Add Product

---

## 📁 Project Structure

```
dizo-cart/
│
├── index.html                  ← Main SPA entry point (all pages render here)
│
├── assets/
│   ├── css/
│   │   ├── 01-variables-base.css   ← CSS custom properties, reset
│   │   ├── 02-navbar.css           ← Desktop & mobile navigation
│   │   ├── 03-hero-sections.css    ← Hero, section layouts
│   │   ├── 04-products.css         ← Product cards, grid
│   │   ├── 05-footer-brands.css    ← Footer, brand strip
│   │   ├── 06-cart.css             ← Cart drawer
│   │   ├── 07-animations.css       ← All keyframe animations
│   │   ├── 08-ui-components.css    ← Modals, toast, wishlist, checkout
│   │   ├── 09-admin.css            ← Admin panel styles
│   │   ├── 10-pdp.css              ← Product detail page
│   │   ├── 11-responsive.css       ← Responsive breakpoints
│   │   └── 12-banner-slider.css    ← Banner, promo strip, tab bar
│   │
│   ├── js/
│   │   ├── config.js           ← Store config, contact, delivery, payment
│   │   ├── theme.js            ← Theme & language toggle
│   │   ├── products.js         ← Product rendering & filters
│   │   ├── cart.js             ← Cart & buy now logic
│   │   ├── wishlist.js         ← Wishlist management
│   │   ├── search.js           ← Inline search (desktop + PDP)
│   │   ├── checkout.js         ← Checkout flow & order placement
│   │   ├── auth.js             ← Login/register
│   │   ├── admin.js            ← Admin panel (dashboard, products, orders)
│   │   ├── pdp.js              ← Product detail page
│   │   ├── category.js         ← Category page logic
│   │   ├── mobile-search.js    ← Mobile search dropdown
│   │   ├── ui.js               ← Toast, banner slider, tab bar
│   │   ├── router.js           ← Browser back button & history
│   │   └── init.js             ← App initialization
│   │
│   ├── images/                 ← Product & UI images
│   └── icons/                  ← SVG icons & favicon
│
├── pages/
│   ├── login.html              ← Standalone login/register page
│   └── order-success.html      ← Order confirmation page
│
├── components/
│   ├── navbar.html             ← Navbar HTML snippet (for multi-page use)
│   ├── footer.html             ← Footer HTML snippet
│   └── product-card.js         ← Reusable product card function
│
├── admin/
│   └── index.html              ← Secure admin redirect (no indexing)
│
├── backend/
│   ├── README.md               ← Full backend integration guide
│   ├── api-client.js           ← Unified API wrapper (fetch + localStorage)
│   ├── firebase-config.js      ← Firebase setup stub
│   └── supabase-config.js      ← Supabase setup stub
│
├── database/
│   └── schema.json             ← Database schema (Firestore / Supabase / SQL)
│
├── api/
│   └── README.md               ← REST API endpoint documentation
│
├── uploads/                    ← User-uploaded files (images)
│   └── .gitkeep
│
├── .gitignore
└── README.md                   ← This file
```

---

## 🔧 Configuration

### Store Contact & Phone
Edit `/assets/js/config.js`:
```javascript
let STORE_CONTACT = {
  phone: '+8801712345678',      // Call Now button
  whatsapp: '8801712345678',    // WhatsApp button
  callLabel: 'Call to Order',
  waLabel: 'WhatsApp',
};
```

### Delivery Charges
```javascript
let deliveryConfig = {
  insideDhaka:  { charge: 60,  label: '🏙️ Inside Dhaka',  enabled: true },
  outsideDhaka: { charge: 120, label: '🗺️ Outside Dhaka', enabled: true },
  freeDeliveryOver: 999,
};
```

### Payment Methods
Enable/disable payment options:
```javascript
let paymentConfig = {
  cod:    { enabled: true,  label: 'Cash on Delivery' },
  bkash:  { enabled: true,  label: 'bKash' },
  nagad:  { enabled: true,  label: 'Nagad' },
  rocket: { enabled: false, label: 'Rocket' },
  card:   { enabled: false, label: 'Credit/Debit Card' },
};
```

---

## 🗄️ Database Integration

The store works immediately with `localStorage`. When ready to scale:

| Provider   | Guide                          |
|------------|-------------------------------|
| Firebase   | `/backend/firebase-config.js`  |
| Supabase   | `/backend/supabase-config.js`  |
| Custom API | `/backend/README.md`           |
| Schema     | `/database/schema.json`        |

---

## 🔐 Admin Panel

**Access:** `http://localhost:8080/admin/`  
**Or via:** `http://localhost:8080/#admin`  
**Default password:** `admin123` (change immediately!)

### Admin Features
- 📊 Dashboard with real-time analytics
- 📦 Unlimited product management (add/edit/delete/toggle)
- 🖼️ Unlimited product image support
- ⚡ Flash sale management
- 📋 Order management & status updates
- 👥 Customer database
- 🎨 Theme customization
- 💬 Messaging / WhatsApp config
- 🔍 SEO settings
- ⚙️ Store settings (delivery, payment, contact)
- 🔌 API Integration Manager
- 📊 Meta Pixel configuration
- 🏠 Homepage customization (banner slides, promo strip)

---

## 📱 Features

| Feature | Status |
|---------|--------|
| Mobile-first responsive design | ✅ Live |
| Desktop navigation | ✅ Live |
| Product catalog with filters | ✅ Live |
| Cart with coupon system | ✅ Live |
| Wishlist | ✅ Live |
| Checkout (3-step) | ✅ Live |
| Cash on Delivery | ✅ Live |
| bKash / Nagad / Rocket | ✅ Config in Admin |
| Order tracking | ✅ Live |
| Admin dashboard | ✅ Live |
| Product detail page | ✅ Live |
| Category page | ✅ Live |
| Live search | ✅ Live |
| Flash sale with countdown | ✅ Live |
| Banner slider | ✅ Live |
| Reviews & ratings | ✅ Admin-ready |
| Firebase integration | 🔧 Config ready |
| Supabase integration | 🔧 Config ready |
| User auth (Firebase) | 🔧 Config ready |
| SMS notifications | 🔧 API ready |
| Meta Pixel | ✅ Admin-configurable |

---

## 🌐 Deployment

### Static Hosting (Netlify/Vercel)
1. Push to GitHub
2. Connect repo to Netlify or Vercel
3. Set build command: *(none needed — static files)*
4. Set publish directory: `.` (root)

### cPanel / Shared Hosting
1. Upload all files via FTP
2. Point domain to `index.html`

### Nginx
```nginx
server {
  listen 80;
  server_name dizocart.com www.dizocart.com;
  root /var/www/dizo-cart;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## 📝 License
Proprietary — Dizo Cart. All rights reserved.
