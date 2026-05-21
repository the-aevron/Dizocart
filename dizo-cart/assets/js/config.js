/**
 * Dizo Cart — config.js
 * Store Config, Contact, Delivery, Payment
 * Extracted from dizo_cart_V47.html (lines 1-207)
 * Part of the Dizo Cart modular project architecture
 */

// ===================== DATA =====================
let products=[];
let bestSellers=[];

let cart=[];
let lang='en';

// ===================== STORE CONTACT CONFIG (Feature 7) =====================
// ✅ EDIT PHONE NUMBERS HERE — used by Call Now & WhatsApp buttons on every product page
let STORE_CONTACT = (() => {
  const defaults = {
    phone: '+8801XXXXXXXXX',       // e.g. '+8801712345678'  — used for tel: dialer
    whatsapp: '8801XXXXXXXXX',     // e.g. '8801712345678'   — WhatsApp (no + prefix, no spaces)
    callLabel: 'Call to Order',    // Button text label
    waLabel: 'WhatsApp',           // WhatsApp button label
  };
  // ✅ FIX: Load persisted contact config from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('dizo_store_contact'));
    if (saved && saved.phone) return Object.assign(defaults, saved);
  } catch(e) {}
  return defaults;
})();
// ===================== END STORE CONTACT CONFIG =====================

// ===================== PRODUCT PERSISTENCE =====================
// Saves admin product changes to localStorage so they survive page reload.
const PRODUCTS_STORAGE_KEY = 'dizo_catalog_v1';

function saveProductsToStorage() {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify({
      products: products,
      bestSellers: bestSellers,
      flashSaleProducts: flashSaleProducts,
      flashNextId: flashNextId
    }));
  } catch(e) { console.warn('Could not save products:', e); }
}

function loadProductsFromStorage() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && Array.isArray(saved.products)) products = saved.products;
    if (saved && Array.isArray(saved.bestSellers)) bestSellers = saved.bestSellers;
    if (saved && Array.isArray(saved.flashSaleProducts)) flashSaleProducts = saved.flashSaleProducts;
    if (saved && saved.flashNextId) flashNextId = saved.flashNextId;
  } catch(e) { console.warn('Could not load saved products:', e); }
}

// loadProductsFromStorage() called after all arrays declared — see below

// ===================== STORE STATE ENGINE =====================
// All runtime data lives here. Populated ONLY by real user actions.
const StoreDB = {
  // Load from localStorage or return empty structure
  load() {
    try {
      const raw = localStorage.getItem('dizo_store_db');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { orders: [], customers: {}, orderCounter: 1001, activityLog: [] };
  },
  save(db) {
    try { localStorage.setItem('dizo_store_db', JSON.stringify(db)); } catch(e) {}
  },
  get() {
    if (!this._cache) this._cache = this.load();
    return this._cache;
  },
  persist() { this.save(this._cache || this.load()); },

  // Record a new order from placeOrder()
  recordOrder(orderData) {
    const db = this.get();
    db.orders.unshift(orderData);
    // Upsert customer
    const phone = orderData.phone;
    if (!db.customers[phone]) {
      db.customers[phone] = { name: orderData.name, phone, email: '', orders: [], totalSpent: 0 };
    }
    db.customers[phone].orders.unshift(orderData.id);
    db.customers[phone].totalSpent += orderData.total;
    db.customers[phone].name = orderData.name;
    // Activity log (keep last 50)
    db.activityLog.unshift({ type: 'order', time: Date.now(), text: `New order ${orderData.id} from ${orderData.name} — ৳${orderData.total.toLocaleString()}` });
    if (db.activityLog.length > 50) db.activityLog.length = 50;
    this.persist();
  },

  // Get analytics computed dynamically
  getAnalytics() {
    const db = this.get();
    const orders = db.orders;
    const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = orders.length;
    const totalCustomers = Object.keys(db.customers).length;
    const allProducts = [...(window.products || []), ...(window.bestSellers || [])];
    const totalProducts = allProducts.length;

    // Today's stats
    const today = new Date(); today.setHours(0,0,0,0);
    const todayOrders = orders.filter(o => new Date(o.timestamp) >= today);
    const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);

    // Top products (by order frequency)
    const productSales = {};
    orders.forEach(o => {
      (o.items || []).forEach(item => {
        productSales[item.name] = (productSales[item.name] || 0) + item.qty;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a,b) => b[1]-a[1]).slice(0,5)
      .map(([name, sold]) => ({ name, sold }));

    return { totalRevenue, totalOrders, totalCustomers, totalProducts, todayOrders: todayOrders.length, todayRevenue, topProducts };
  },

  // Reset functions
  resetOrders() { const db=this.get(); db.orders=[]; this.persist(); },
  resetCustomers() { const db=this.get(); db.customers={}; this.persist(); },
  resetAnalytics() { const db=this.get(); db.activityLog=[]; this.persist(); },
  factoryReset() {
    this._cache = { orders: [], customers: {}, orderCounter: 1001, activityLog: [] };
    try { localStorage.removeItem('dizo_store_db'); } catch(e) {}
  },
  nextOrderId() {
    const db = this.get();
    if (!db.orderCounter) db.orderCounter = 1001;
    const id = '#DC' + db.orderCounter++;
    this.persist();
    return id;
  },
  updateOrderStatus(orderId, newStatus) {
    const db = this.get();
    const o = db.orders.find(x => x.id === orderId);
    if (o) { o.status = newStatus; this.persist(); }
  }
};
let wishlist=new Map(); // id -> product
let currentFilter='all';
let modalProduct=null;
let selectedPayment='cod';
let couponDiscount=0;

// ===================== DELIVERY CHARGE CONFIG =====================
let deliveryConfig = (() => {
  const defaults = {
    insideDhaka: { charge: 60, label: '🏙️ Inside Dhaka', enabled: true },
    outsideDhaka: { charge: 120, label: '🗺️ Outside Dhaka', enabled: true },
    freeDeliveryOver: 999,
  };
  // ✅ FIX: Load persisted delivery config from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('dizo_delivery_config'));
    if (saved && saved.insideDhaka && saved.outsideDhaka) return saved;
  } catch(e) {}
  return defaults;
})();
let selectedDeliveryZone = 'insideDhaka'; // default

// ===================== PAYMENT METHOD CONFIG =====================
const PAYMENT_CONFIG_KEY = 'dizo_payment_config_v1';

const PAYMENT_METHODS_DEFAULT = {
  cod:    { label: '💵 Cash on Delivery (COD)', enabled: true },
  bkash:  { label: '📱 bKash',                  enabled: true },
  nagad:  { label: '🟠 Nagad',                  enabled: true },
  rocket: { label: '🚀 Rocket',                  enabled: true },
  card:   { label: '💳 Card / SSLCommerz / Stripe', enabled: true },
};

let paymentConfig = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(PAYMENT_CONFIG_KEY));
    if (saved && typeof saved === 'object') {
      // Merge with defaults so new methods added later still appear
      return Object.assign(JSON.parse(JSON.stringify(PAYMENT_METHODS_DEFAULT)), saved);
    }
  } catch(e){}
  return JSON.parse(JSON.stringify(PAYMENT_METHODS_DEFAULT));
})();

function savePaymentConfig(){
  try { localStorage.setItem(PAYMENT_CONFIG_KEY, JSON.stringify(paymentConfig)); } catch(e){}
}

function renderCheckoutPaymentMethods(){
  const wrap = document.getElementById('checkoutPaymentMethods');
  if(!wrap) return;
  const enabled = Object.entries(paymentConfig).filter(([,v]) => v.enabled);
  if(!enabled.length){
    wrap.innerHTML = '<p style="color:#dc2626;font-size:0.85rem">⚠️ কোনো payment method চালু নেই। Admin panel থেকে enable করুন।</p>';
    return;
  }
  wrap.innerHTML = enabled.map(([key, val], i) => `
    <label class="payment-option${i===0?' selected':''}" onclick="selectPayment(this,'${key}')">
      <input type="radio" name="pay"${i===0?' checked':''}> ${val.label}
    </label>
  `).join('');
  // Set default selected payment
  selectedPayment = enabled[0][0];
}

