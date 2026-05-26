const fs = require('fs');
const path = require('path');

const LOCAL_DB_PATH = path.join(__dirname, '..', 'data', 'campusride_local.json');
let isUsingSupabase = false;
let mockDataStore = {
  users: [],
  rideschedules: [],
  rideposts: [],
  bookings: [],
  messages: []
};

// Ensure data folder exists
const dataDir = path.dirname(LOCAL_DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load persisted local data if it exists
const loadLocalData = () => {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const content = fs.readFileSync(LOCAL_DB_PATH, 'utf8');
      mockDataStore = JSON.parse(content);
      console.log(`[Database] Loaded local database from ${LOCAL_DB_PATH}`);
    } else {
      saveLocalData();
    }
  } catch (err) {
    console.error('[Database] Error loading local file database:', err);
  }
};

// Save local data to disk
const saveLocalData = () => {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(mockDataStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[Database] Error saving local database:', err);
  }
};

// Simple ID Generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// ----------------------------------------------------
// LOCAL MOCK DATABASE MODEL
// ----------------------------------------------------
class MockModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(query = {}) {
    let items = mockDataStore[this.collectionName] || [];
    return items.filter(item => {
      for (let key in query) {
        if (query[key] && typeof query[key] === 'object' && query[key].$in) {
          if (!query[key].$in.includes(item[key])) return false;
        } else if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }).map(item => ({ ...item, toJSON: () => item }));
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results[0] || null;
  }

  async findById(id) {
    return await this.findOne({ _id: id });
  }

  async create(doc) {
    const newDoc = {
      _id: doc._id || generateId(),
      createdAt: new Date().toISOString(),
      ...doc
    };
    if (!mockDataStore[this.collectionName]) {
      mockDataStore[this.collectionName] = [];
    }
    mockDataStore[this.collectionName].push(newDoc);
    saveLocalData();
    return { ...newDoc, toJSON: () => newDoc };
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const index = mockDataStore[this.collectionName].findIndex(item => item._id === id);
    if (index === -1) return null;

    const current = mockDataStore[this.collectionName][index];
    const updated = { ...current };

    if (update.$push) {
      for (let key in update.$push) {
        if (!Array.isArray(updated[key])) updated[key] = [];
        updated[key].push(update.$push[key]);
      }
    } else if (update.$pull) {
      for (let key in update.$pull) {
        if (Array.isArray(updated[key])) {
          updated[key] = updated[key].filter(v => {
            if (typeof v === 'object' && v && update.$pull[key] && typeof update.$pull[key] === 'object') {
              for (let k in update.$pull[key]) {
                if (v[k] !== update.$pull[key][k]) return true;
              }
              return false;
            }
            return v !== update.$pull[key];
          });
        }
      }
    } else {
      Object.assign(updated, update);
    }

    mockDataStore[this.collectionName][index] = updated;
    saveLocalData();
    return { ...updated, toJSON: () => updated };
  }

  async deleteOne(query = {}) {
    const initialLength = mockDataStore[this.collectionName].length;
    mockDataStore[this.collectionName] = mockDataStore[this.collectionName].filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return true;
      }
      return false;
    });
    saveLocalData();
    return { deletedCount: initialLength - mockDataStore[this.collectionName].length };
  }

  async deleteMany(query = {}) {
    return this.deleteOne(query);
  }
}

// ----------------------------------------------------
// SUPABASE CLOUD REST MODEL CLIENT
// ----------------------------------------------------
class SupabaseModel {
  constructor(collectionName) {
    // Map to low-case plural table names matching SQL
    this.collectionName = collectionName.toLowerCase();
    this.headers = {
      'apikey': process.env.SUPABASE_ANON_KEY || '',
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
      'Content-Type': 'application/json'
    };
  }

  // Parse filters into PostgREST syntax
  buildQueryString(query) {
    const params = new URLSearchParams();
    for (let key in query) {
      const val = query[key];
      if (val && typeof val === 'object') {
        if (val.$in) {
          const list = val.$in.map(v => `"${v}"`).join(',');
          params.append(key, `in.(${list})`);
        } else if (val.$ne !== undefined) {
          params.append(key, `neq.${val.$ne}`);
        } else {
          params.append(key, `eq.${val}`);
        }
      } else {
        params.append(key, `eq.${val}`);
      }
    }
    return params.toString();
  }

  async find(query = {}) {
    try {
      const qs = this.buildQueryString(query);
      const url = `${process.env.SUPABASE_URL}/rest/v1/${this.collectionName}${qs ? '?' + qs : ''}`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase find error: ${errText}`);
      }
      
      const data = await res.json();
      return data.map(item => ({ ...item, toJSON: () => item }));
    } catch (err) {
      console.error(`[Supabase Model - ${this.collectionName}] find failed:`, err);
      // Fallback to local json mock on query failure
      return new MockModel(this.collectionName).find(query);
    }
  }

  async findOne(query = {}) {
    try {
      const qs = this.buildQueryString(query);
      const separator = qs ? '&' : '?';
      const url = `${process.env.SUPABASE_URL}/rest/v1/${this.collectionName}${qs ? '?' + qs : ''}${separator}limit=1`;
      
      const res = await fetch(url, {
        method: 'GET',
        headers: this.headers
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase findOne error: ${errText}`);
      }
      
      const data = await res.json();
      const result = data[0] || null;
      return result ? { ...result, toJSON: () => result } : null;
    } catch (err) {
      console.error(`[Supabase Model - ${this.collectionName}] findOne failed:`, err);
      return new MockModel(this.collectionName).findOne(query);
    }
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(doc) {
    try {
      const newDoc = {
        _id: doc._id || generateId(),
        createdAt: new Date().toISOString(),
        ...doc
      };
      
      const url = `${process.env.SUPABASE_URL}/rest/v1/${this.collectionName}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(newDoc)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase create error: ${errText}`);
      }
      
      const data = await res.json();
      const created = data[0] || newDoc;
      return { ...created, toJSON: () => created };
    } catch (err) {
      console.error(`[Supabase Model - ${this.collectionName}] create failed:`, err);
      return new MockModel(this.collectionName).create(doc);
    }
  }

  async findByIdAndUpdate(id, update, options = {}) {
    try {
      const currentObj = await this.findById(id);
      if (!currentObj) return null;

      const current = currentObj.toJSON();
      const updated = { ...current };

      if (update.$push) {
        for (let key in update.$push) {
          if (!Array.isArray(updated[key])) updated[key] = [];
          updated[key].push(update.$push[key]);
        }
      } else if (update.$pull) {
        for (let key in update.$pull) {
          if (Array.isArray(updated[key])) {
            updated[key] = updated[key].filter(v => {
              if (typeof v === 'object' && v && update.$pull[key] && typeof update.$pull[key] === 'object') {
                for (let k in update.$pull[key]) {
                  if (v[k] !== update.$pull[key][k]) return true;
                }
                return false;
              }
              return v !== update.$pull[key];
            });
          }
        }
      } else {
        Object.assign(updated, update);
      }

      // Remove PK and generated timestamps from patch body
      const { _id, createdAt, ...payload } = updated;
      const url = `${process.env.SUPABASE_URL}/rest/v1/${this.collectionName}?_id=eq.${id}`;
      
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...this.headers,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase update error: ${errText}`);
      }
      
      const data = await res.json();
      const result = data[0] || updated;
      return { ...result, toJSON: () => result };
    } catch (err) {
      console.error(`[Supabase Model - ${this.collectionName}] update failed:`, err);
      return new MockModel(this.collectionName).findByIdAndUpdate(id, update, options);
    }
  }

  async deleteOne(query = {}) {
    try {
      const qs = this.buildQueryString(query);
      if (!qs) throw new Error("Delete queries must contain parameters to prevent truncating the table.");
      
      const url = `${process.env.SUPABASE_URL}/rest/v1/${this.collectionName}?${qs}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.headers
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Supabase delete error: ${errText}`);
      }
      
      return { deletedCount: 1 };
    } catch (err) {
      console.error(`[Supabase Model - ${this.collectionName}] delete failed:`, err);
      return new MockModel(this.collectionName).deleteOne(query);
    }
  }

  async deleteMany(query = {}) {
    return this.deleteOne(query);
  }
}

// ----------------------------------------------------
// DATABASE INITIALIZATION & MODEL ROUTER
// ----------------------------------------------------
const connectDB = async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  console.log(`[Database] Attempting to connect to Supabase at: ${supabaseUrl}`);
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or Key missing in environment variables.');
    }
    
    // Ping Supabase to verify connection
    const res = await fetch(`${supabaseUrl}/rest/v1/users?select=_id&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok && res.status !== 406) {
      throw new Error(`Supabase REST endpoint returned status code: ${res.status}`);
    }
    
    console.log('[Database] Connected to Supabase Cloud Successfully!');
    isUsingSupabase = true;
  } catch (err) {
    console.log('\n================================================================');
    console.log('[Database] WARNING: Supabase is offline or connection failed.');
    console.log(`           Error: ${err.message}`);
    console.log('[Database] Falling back to persistent local JSON file DB at:');
    console.log(`           ${LOCAL_DB_PATH}`);
    console.log('================================================================\n');
    isUsingSupabase = false;
    loadLocalData();
  }
};

const getModel = (name, mongooseSchema) => {
  const tableName = name.toLowerCase() + 's';
  return {
    find: async (query) => {
      if (isUsingSupabase) return new SupabaseModel(tableName).find(query);
      return new MockModel(tableName).find(query);
    },
    findOne: async (query) => {
      if (isUsingSupabase) return new SupabaseModel(tableName).findOne(query);
      return new MockModel(tableName).findOne(query);
    },
    findById: async (id) => {
      if (isUsingSupabase) return new SupabaseModel(tableName).findById(id);
      return new MockModel(tableName).findById(id);
    },
    create: async (doc) => {
      if (isUsingSupabase) return new SupabaseModel(tableName).create(doc);
      return new MockModel(tableName).create(doc);
    },
    findByIdAndUpdate: async (id, update, options) => {
      if (isUsingSupabase) return new SupabaseModel(tableName).findByIdAndUpdate(id, update, options);
      return new MockModel(tableName).findByIdAndUpdate(id, update, options);
    },
    deleteOne: async (query) => {
      if (isUsingSupabase) return new SupabaseModel(tableName).deleteOne(query);
      return new MockModel(tableName).deleteOne(query);
    },
    deleteMany: async (query) => {
      if (isUsingSupabase) return new SupabaseModel(tableName).deleteMany(query);
      return new MockModel(tableName).deleteMany(query);
    },
    getRawStore: () => mockDataStore,
    saveRawStore: () => saveLocalData()
  };
};

module.exports = {
  connectDB,
  getModel,
  isMock: () => !isUsingSupabase
};
