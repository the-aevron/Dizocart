/**
 * Dizo Cart — Supabase Configuration
 * ============================================================
 * Replace placeholder values with your Supabase project details.
 * Get them from: Supabase Dashboard → Settings → API
 * ============================================================
 */

const SUPABASE_URL  = 'https://YOUR_PROJECT_REF.supabase.co';
const SUPABASE_KEY  = 'YOUR_ANON_PUBLIC_KEY';  // Safe to expose in frontend

// Initialize (requires @supabase/supabase-js or CDN)
// const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * SQL Schema for Supabase (run in SQL Editor)
 * ============================================================
 *
 * -- Products table
 * CREATE TABLE products (
 *   id         SERIAL PRIMARY KEY,
 *   name       TEXT NOT NULL,
 *   name_bn    TEXT,
 *   cat        TEXT CHECK (cat IN ('kitchen','home','gadgets','beauty')) NOT NULL,
 *   badge      TEXT CHECK (badge IN ('new','hot','sale','best')) NOT NULL,
 *   price      INTEGER NOT NULL,
 *   old_price  INTEGER NOT NULL,
 *   emoji      TEXT DEFAULT '📦',
 *   description TEXT,
 *   specs      TEXT,
 *   section    TEXT DEFAULT 'trending',
 *   stock      INTEGER DEFAULT 100,
 *   status     TEXT DEFAULT 'active',
 *   reviews    INTEGER DEFAULT 0,
 *   rating     DECIMAL(3,1) DEFAULT 4.5,
 *   image1     TEXT,
 *   image2     TEXT,
 *   image3     TEXT,
 *   image4     TEXT,
 *   is_flash   BOOLEAN DEFAULT FALSE,
 *   flash_price INTEGER,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Orders table
 * CREATE TABLE orders (
 *   id          TEXT PRIMARY KEY,
 *   name        TEXT NOT NULL,
 *   phone       TEXT NOT NULL,
 *   email       TEXT,
 *   address     TEXT NOT NULL,
 *   zone        TEXT NOT NULL,
 *   items       JSONB NOT NULL,
 *   subtotal    INTEGER NOT NULL,
 *   delivery    INTEGER NOT NULL,
 *   discount    INTEGER DEFAULT 0,
 *   total       INTEGER NOT NULL,
 *   payment     TEXT NOT NULL,
 *   coupon      TEXT,
 *   notes       TEXT,
 *   status      TEXT DEFAULT 'pending',
 *   created_at  TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at  TIMESTAMPTZ DEFAULT NOW()
 * );
 *
 * -- Enable RLS
 * ALTER TABLE products ENABLE ROW LEVEL SECURITY;
 * ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
 *
 * -- Products: public read, authenticated write
 * CREATE POLICY "Public products read" ON products FOR SELECT USING (true);
 * CREATE POLICY "Admin products write" ON products FOR ALL USING (auth.role() = 'authenticated');
 *
 * -- Orders: public insert, authenticated read
 * CREATE POLICY "Public order insert" ON orders FOR INSERT WITH CHECK (true);
 * CREATE POLICY "Admin orders read" ON orders FOR SELECT USING (auth.role() = 'authenticated');
 */

/**
 * Supabase Product Functions
 */
const SupabaseProducts = {
  async getAll(filters = {}) {
    // let query = supabase.from('products').select('*').order('created_at', { ascending: false });
    // if (filters.cat) query = query.eq('cat', filters.cat);
    // if (filters.status) query = query.eq('status', filters.status);
    // const { data, error } = await query;
    // if (error) throw error;
    // return data;
    console.warn('Supabase not configured.');
    return [];
  },

  async add(product) {
    // const { data, error } = await supabase.from('products').insert([product]).select();
    // if (error) throw error;
    // return data[0];
  },

  async update(id, changes) {
    // const { data, error } = await supabase.from('products').update(changes).eq('id', id).select();
    // if (error) throw error;
    // return data[0];
  },

  async delete(id) {
    // const { error } = await supabase.from('products').delete().eq('id', id);
    // if (error) throw error;
  }
};

/**
 * Supabase Order Functions
 */
const SupabaseOrders = {
  async place(orderData) {
    // const { data, error } = await supabase.from('orders').insert([orderData]).select();
    // if (error) throw error;
    // return data[0];
  },

  async getAll() {
    // const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    // if (error) throw error;
    // return data;
  },

  async updateStatus(id, status) {
    // const { error } = await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    // if (error) throw error;
  }
};

/**
 * Supabase Storage Image Upload
 */
async function uploadImageToSupabase(file, productId) {
  // const fileName = `${productId}/${Date.now()}_${file.name}`;
  // const { data, error } = await supabase.storage.from('product-images').upload(fileName, file);
  // if (error) throw error;
  // const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
  // return urlData.publicUrl;
  console.warn('Supabase Storage not configured.');
  return null;
}

if (typeof module !== 'undefined') {
  module.exports = { SUPABASE_URL, SUPABASE_KEY, SupabaseProducts, SupabaseOrders, uploadImageToSupabase };
}
