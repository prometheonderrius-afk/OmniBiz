import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Plus, UserCheck, Package, ListOrdered, 
  Key, ShieldAlert, Calendar, Utensils, Check, Search 
} from 'lucide-react';

export default function BackOffice({ companyName, industry }) {
  const ind = (industry || 'Landscaping Service').toLowerCase();

  // -------------------------------------------------------------
  // LANDSCAPING VERTICAL STATES & LOGIC
  // -------------------------------------------------------------
  const [expenses, setExpenses] = useState([]);
  const [newExpName, setNewExpName] = useState('');
  const [newExpCat, setNewExpCat] = useState('Materials');
  const [newExpAmt, setNewExpAmt] = useState('');

  const [employees, setEmployees] = useState([]);
  const [payrollStatus, setPayrollStatus] = useState('');

  const fetchExpenses = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM expenses;" })
      });
      
      if (!response.ok) {
        // Table doesn't exist, create and seed it!
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sql: "CREATE TABLE expenses (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, amount REAL, date TEXT);" 
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sql: "INSERT INTO expenses (name, category, amount, date) VALUES ('Premium Mulch Supply', 'Materials', 320.00, '2026-06-12'), ('Local Radio Ads', 'Marketing', 150.00, '2026-06-10'), ('Lawn Mower Fuel', 'Fuel', 65.40, '2026-06-15');" 
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM expenses;" })
        });
      }
      
      const data = await response.json();
      setExpenses(data.rows || []);
    } catch (err) {
      console.error('Error loading expenses:', err);
    }
  };

  const fetchEmployees = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM employees;" })
      });
      
      if (!response.ok) {
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sql: "CREATE TABLE employees (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, role TEXT, rate REAL, hours INTEGER);" 
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sql: "INSERT INTO employees (name, role, rate, hours) VALUES ('Carlos Santana', 'Crew Leader', 25.00, 40), ('Jake Gyllenhaal', 'Gardener', 18.00, 38), ('Bruce Willis', 'Tree Specialist', 30.00, 35);" 
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM employees;" })
        });
      }
      
      const data = await response.json();
      setEmployees(data.rows || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amt = parseFloat(newExpAmt);
    if (!newExpName.trim() || isNaN(amt)) return;
    const dateStr = new Date().toISOString().split('T')[0];
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `INSERT INTO expenses (name, category, amount, date) VALUES ('${newExpName.replace(/'/g, "''")}', '${newExpCat}', ${amt}, '${dateStr}');`
        })
      });
      
      if (response.ok) {
        fetchExpenses();
        setNewExpName('');
        setNewExpAmt('');
      }
    } catch (err) {
      console.error('Error adding expense:', err);
    }
  };

  const handleHoursChange = async (empId, val) => {
    const hrs = parseInt(val) || 0;
    setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, hours: hrs } : emp));
    try {
      await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `UPDATE employees SET hours = ${hrs} WHERE id = ${empId};` })
      });
    } catch (err) {
      console.error('Error updating hours:', err);
    }
  };

  const handleProcessPayroll = () => {
    setPayrollStatus('Processing direct deposits...');
    setTimeout(() => {
      const totalPayroll = employees.reduce((sum, e) => sum + (e.rate * e.hours), 0);
      setPayrollStatus(`Direct deposits sent! Total payroll of $${totalPayroll.toFixed(2)} processed for ${employees.length} workers.`);
    }, 1500);
  };


  // -------------------------------------------------------------
  // RETAIL VERTICAL STATES & LOGIC
  // -------------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');

  const fetchProducts = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM products;" })
      });
      if (!response.ok) {
        // Build tables & seed
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT UNIQUE, name TEXT, price REAL, stock INTEGER);"
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "INSERT INTO products (sku, name, price, stock) VALUES ('TSH-COT-M', 'Organic Cotton Tee (Medium)', 34.00, 45), ('DNM-SLM-32', 'Slim Fit Denim (Size 32)', 88.00, 18), ('JKT-LDR-L', 'Classic Leather Jacket (Large)', 220.00, 5);"
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM products;" })
        });
      }
      const data = await response.json();
      setProducts(data.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM orders;" })
      });
      if (!response.ok) {
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, order_date TEXT, total_amount REAL, status TEXT);"
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "INSERT INTO orders (id, order_date, total_amount, status) VALUES (1001, '2026-06-16', 122.00, 'Shipped'), (1002, '2026-06-16', 220.00, 'Processing'), (1003, '2026-06-15', 34.00, 'Delivered');"
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM orders;" })
        });
      }
      const data = await response.json();
      setOrders(data.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const prc = parseFloat(newProdPrice);
    const stk = parseInt(newProdStock);
    if (!newProdName.trim() || !newProdSku.trim() || isNaN(prc) || isNaN(stk)) return;

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `INSERT INTO products (sku, name, price, stock) VALUES ('${newProdSku.replace(/'/g, "''")}', '${newProdName.replace(/'/g, "''")}', ${prc}, ${stk});`
        })
      });
      if (response.ok) {
        fetchProducts();
        setNewProdSku('');
        setNewProdName('');
        setNewProdPrice('');
        setNewProdStock('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStock = async (prodId, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: newStock } : p));
    try {
      await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `UPDATE products SET stock = ${newStock} WHERE id = ${prodId};` })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    try {
      await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `UPDATE orders SET status = '${newStatus}' WHERE id = ${orderId};` })
      });
    } catch (err) {
      console.error(err);
    }
  };


  // -------------------------------------------------------------
  // TECH STARTUP VERTICAL STATES & LOGIC
  // -------------------------------------------------------------
  const [techUsers, setTechUsers] = useState([]);
  const [techKeys, setTechKeys] = useState([]);
  const [keyUserSelect, setKeyUserSelect] = useState('');

  const fetchTechUsers = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM users;" })
      });
      if (!response.ok) {
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, name TEXT, plan TEXT, status TEXT);"
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "INSERT INTO users (email, name, plan, status) VALUES ('alice@vance.io', 'Alice Vance', 'Scale', 'Active'), ('bob@chen.dev', 'Bob Chen', 'Developer', 'Active'), ('charlie@root.org', 'Charlie Root', 'Enterprise', 'Active');"
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM users;" })
        });
      }
      const data = await response.json();
      setTechUsers(data.rows || []);
      if (data.rows?.length > 0 && !keyUserSelect) {
        setKeyUserSelect(data.rows[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTechKeys = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM api_keys;" })
      });
      if (!response.ok) {
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "CREATE TABLE api_keys (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, key_prefix TEXT, requests_count INTEGER, status TEXT);"
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "INSERT INTO api_keys (user_id, key_prefix, requests_count, status) VALUES (1, 'sk_live_a1b2', 15420, 'Active'), (2, 'sk_dev_c3d4', 2310, 'Active'), (3, 'sk_live_e5f6', 89400, 'Active');"
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM api_keys;" })
        });
      }
      const data = await response.json();
      setTechKeys(data.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePlan = async (userId, planName) => {
    setTechUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: planName } : u));
    try {
      await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `UPDATE users SET plan = '${planName}' WHERE id = ${userId};` })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateApiKey = async () => {
    const randomHex = Math.random().toString(16).substring(2, 6);
    const prefix = `sk_live_${randomHex}`;
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `INSERT INTO api_keys (user_id, key_prefix, requests_count, status) VALUES (${keyUserSelect}, '${prefix}', 0, 'Active');`
        })
      });
      if (response.ok) {
        fetchTechKeys();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleKeyStatus = async (keyId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Revoked' : 'Active';
    setTechKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: newStatus } : k));
    try {
      await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `UPDATE api_keys SET status = '${newStatus}' WHERE id = ${keyId};` })
      });
    } catch (err) {
      console.error(err);
    }
  };


  // -------------------------------------------------------------
  // RESTAURANT VERTICAL STATES & LOGIC
  // -------------------------------------------------------------
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [newPartySize, setNewPartySize] = useState('2');
  const [newResTime, setNewResTime] = useState('19:00');
  const [newTableNum, setNewTableNum] = useState('4');

  const fetchReservations = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM reservations;" })
      });
      if (!response.ok) {
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "CREATE TABLE reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, guest_name TEXT, party_size INTEGER, reservation_time TEXT, table_number INTEGER, status TEXT);"
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "INSERT INTO reservations (guest_name, party_size, reservation_time, table_number, status) VALUES ('Sophia Loren', 4, '19:00', 12, 'Confirmed'), ('Marcello Mastroianni', 2, '20:30', 5, 'Seated'), ('Gina Lollobrigida', 6, '18:30', 8, 'Cancelled');"
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM reservations;" })
        });
      }
      const data = await response.json();
      setReservations(data.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMenuItems = async () => {
    try {
      let response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: "SELECT * FROM menu_items;" })
      });
      if (!response.ok) {
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "CREATE TABLE menu_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, price REAL, is_available INTEGER);"
          })
        });
        await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sql: "INSERT INTO menu_items (name, category, price, is_available) VALUES ('Truffle Tagliatelle', 'Entree', 24.50, 1), ('Prosciutto Crostini', 'Appetizer', 14.00, 1), ('Vanilla Bean Panna Cotta', 'Dessert', 10.50, 1);"
          })
        });
        response = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: "SELECT * FROM menu_items;" })
        });
      }
      const data = await response.json();
      setMenuItems(data.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReservation = async (e) => {
    e.preventDefault();
    const size = parseInt(newPartySize);
    const tbl = parseInt(newTableNum);
    if (!newGuestName.trim() || isNaN(size) || isNaN(tbl)) return;

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `INSERT INTO reservations (guest_name, party_size, reservation_time, table_number, status) VALUES ('${newGuestName.replace(/'/g, "''")}', ${size}, '${newResTime}', ${tbl}, 'Confirmed');`
        })
      });
      if (response.ok) {
        fetchReservations();
        setNewGuestName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateReservationStatus = async (resId, newStatus) => {
    setReservations(prev => prev.map(r => r.id === resId ? { ...r, status: newStatus } : r));
    try {
      await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `UPDATE reservations SET status = '${newStatus}' WHERE id = ${resId};` })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMenuAvailability = async (itemId, currentAvail) => {
    const nextAvail = currentAvail === 1 ? 0 : 1;
    setMenuItems(prev => prev.map(item => item.id === itemId ? { ...item, is_available: nextAvail } : item));
    try {
      await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `UPDATE menu_items SET is_available = ${nextAvail} WHERE id = ${itemId};` })
      });
    } catch (err) {
      console.error(err);
    }
  };


  // -------------------------------------------------------------
  // TRIGGER DATA LOADING ON VERTICAL BASIS
  // -------------------------------------------------------------
  useEffect(() => {
    if (ind.includes('landscap')) {
      fetchExpenses();
      fetchEmployees();
    } else if (ind.includes('retail') || ind.includes('shop') || ind.includes('boutique')) {
      fetchProducts();
      fetchOrders();
    } else if (ind.includes('tech') || ind.includes('startup')) {
      fetchTechUsers();
      fetchTechKeys();
    } else if (ind.includes('restaurant') || ind.includes('cafe') || ind.includes('food')) {
      fetchReservations();
      fetchMenuItems();
    } else {
      // Fallback
      fetchExpenses();
      fetchEmployees();
    }
  }, [industry]);

  // -------------------------------------------------------------
  // RENDER INTERFACES
  // -------------------------------------------------------------

  // 1. LANDSCAPING RENDER
  if (ind.includes('landscap')) {
    const totalExpenseAmt = expenses.reduce((sum, e) => sum + e.amount, 0);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }} className="animate-fade-in">
        {/* Expense Tracker Widget */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} style={{ color: 'var(--color-primary)' }} /> Landscaping Expenses
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            All landscape business records write directly to the local SQLite database.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Expenses</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginTop: '4px' }}>
                ${totalExpenseAmt.toFixed(2)}
              </div>
            </div>
            <span className="badge badge-success">SQLite Live</span>
          </div>

          <div style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  <th style={{ padding: '6px' }}>Date</th>
                  <th style={{ padding: '6px' }}>Vendor / Item</th>
                  <th style={{ padding: '6px' }}>Category</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 6px', color: 'var(--color-text-muted)', fontSize: '12px' }}>{exp.date}</td>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>{exp.name}</td>
                    <td style={{ padding: '8px 6px' }}><span className="badge" style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>{exp.category}</span></td>
                    <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '600' }}>${exp.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddExpense} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
            <input type="text" className="form-input" value={newExpName} onChange={(e) => setNewExpName(e.target.value)} placeholder="Item / Vendor" required />
            <select className="form-input" value={newExpCat} onChange={(e) => setNewExpCat(e.target.value)}>
              <option value="Materials">Materials</option>
              <option value="Marketing">Marketing</option>
              <option value="Fuel">Fuel</option>
              <option value="Software">Software</option>
            </select>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input type="text" className="form-input" value={newExpAmt} onChange={(e) => setNewExpAmt(e.target.value)} placeholder="Amt" required />
              <button type="submit" className="btn-primary" style={{ padding: '10px' }}><Plus size={16} /></button>
            </div>
          </form>
        </div>

        {/* Payroll calculator */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} style={{ color: 'var(--color-primary)' }} /> Crew Wages & Payroll
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Calculate staff hours and process direct deposits.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '6px' }}>Crew Worker</th>
                  <th style={{ padding: '6px' }}>Rate</th>
                  <th style={{ padding: '6px', width: '80px' }}>Hours</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Gross Pay</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 6px' }}>
                      <div style={{ fontWeight: '600' }}>{emp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{emp.role}</div>
                    </td>
                    <td style={{ padding: '10px 6px' }}>${emp.rate.toFixed(2)}/hr</td>
                    <td style={{ padding: '10px 6px' }}>
                      <input type="number" className="form-input" value={emp.hours} onChange={(e) => handleHoursChange(emp.id, e.target.value)} style={{ padding: '6px 8px', fontSize: '12px', textAlign: 'center' }} />
                    </td>
                    <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: '600' }}>${(emp.rate * emp.hours).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span>Total Payout:</span>
              <span style={{ color: 'var(--color-accent)', fontWeight: '700' }}>
                ${(employees.reduce((sum, e) => sum + (e.rate * e.hours), 0)).toFixed(2)}
              </span>
            </div>
            <button onClick={handleProcessPayroll} className="btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={payrollStatus.startsWith('Processing')}>
              Run Payroll Cycle
            </button>
            {payrollStatus && (
              <div style={{ fontSize: '11px', color: '#48bb78', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)' }}>
                {payrollStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. RETAIL SHOP RENDER
  if (ind.includes('retail') || ind.includes('shop') || ind.includes('boutique')) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1 }} className="animate-fade-in">
        {/* Inventory Stock Manager */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} style={{ color: 'var(--color-primary)' }} /> Inventory Stock Manager
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            View catalog SKUs, adjust physical stock levels, and insert new products.
          </p>

          <div style={{ flex: 1, maxHeight: '230px', overflowY: 'auto', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  <th style={{ padding: '6px' }}>SKU</th>
                  <th style={{ padding: '6px' }}>Product Name</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '6px', textAlign: 'center', width: '120px' }}>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => (
                  <tr key={prod.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 6px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-text-muted)' }}>{prod.sku}</td>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>{prod.name}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>${(prod.price || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => handleUpdateStock(prod.id, prod.stock, -1)} style={{ padding: '2px 6px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>-</button>
                        <span style={{ minWidth: '24px', fontWeight: '600', color: prod.stock < 20 ? '#f56565' : 'white' }}>{prod.stock}</span>
                        <button onClick={() => handleUpdateStock(prod.id, prod.stock, 1)} style={{ padding: '2px 6px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>+</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
              <input type="text" className="form-input" value={newProdSku} onChange={(e) => setNewProdSku(e.target.value)} placeholder="SKU (e.g. TSH-COT)" required />
              <input type="text" className="form-input" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Product Name" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
              <input type="text" className="form-input" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="Price ($)" required />
              <input type="text" className="form-input" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} placeholder="Initial Stock" required />
              <button type="submit" className="btn-primary" style={{ padding: '10px 16px' }}><Plus size={16} /> Add Item</button>
            </div>
          </form>
        </div>

        {/* Order Fulfillment */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListOrdered size={20} style={{ color: 'var(--color-primary)' }} /> Order Fulfillment
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Fulfill guest purchases and toggle shipping updates.
          </p>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map(order => (
                <div key={order.id} style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(255,255,255,0.04)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>#{order.id}</span>
                      <span className="badge" style={{ 
                        fontSize: '9px', 
                        background: order.status === 'Shipped' ? 'rgba(72,187,120,0.1)' : order.status === 'Processing' ? 'rgba(236,201,75,0.1)' : 'rgba(255,255,255,0.05)',
                        color: order.status === 'Shipped' ? '#48bb78' : order.status === 'Processing' ? '#ecc94b' : 'white'
                      }}>{order.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Date: {order.order_date} • Amount: ${order.total_amount.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleUpdateOrderStatus(order.id, 'Processing')} style={{ fontSize: '10px', padding: '6px 10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>Process</button>
                    <button onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')} style={{ fontSize: '10px', padding: '6px 10px', background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>Ship</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. TECH STARTUP RENDER
  if (ind.includes('tech') || ind.includes('startup')) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1 }} className="animate-fade-in">
        {/* User Subscriptions */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} style={{ color: 'var(--color-primary)' }} /> Subscriptions & Billing
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Manage client subscription tiers, license levels, and billing cycle plans.
          </p>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '6px' }}>Subscriber</th>
                  <th style={{ padding: '6px' }}>Plan Tier</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Update Plan</th>
                </tr>
              </thead>
              <tbody>
                {techUsers.map(usr => (
                  <tr key={usr.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 6px' }}>
                      <div style={{ fontWeight: '600' }}>{usr.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{usr.email}</div>
                    </td>
                    <td style={{ padding: '12px 6px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '10px' }}>{usr.plan}</span>
                    </td>
                    <td style={{ padding: '12px 6px', textAlign: 'right' }}>
                      <select 
                        value={usr.plan} 
                        onChange={(e) => handleUpdatePlan(usr.id, e.target.value)}
                        style={{
                          background: '#070a13',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: 'white',
                          padding: '4px 8px',
                          fontSize: '11px'
                        }}
                      >
                        <option value="Developer">Developer ($29)</option>
                        <option value="Scale">Scale ($99)</option>
                        <option value="Enterprise">Enterprise ($499)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Credentials Console */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} style={{ color: 'var(--color-primary)' }} /> Developer API Keys Console
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
            Inspect developers' API quota usages, rotation dates, and key statuses.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {techKeys.map(k => (
                <div key={k.id} style={{ 
                  background: 'rgba(0,0,0,0.15)', 
                  border: '1px solid rgba(255,255,255,0.04)', 
                  borderRadius: '8px', 
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '600' }}>{k.key_prefix}</span>
                      <span className="badge" style={{ 
                        fontSize: '8px', 
                        background: k.status === 'Active' ? 'rgba(72,187,120,0.1)' : 'rgba(239,68,68,0.15)',
                        color: k.status === 'Active' ? '#48bb78' : '#f87171'
                      }}>{k.status}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                      Usage: <strong>{k.requests_count.toLocaleString()}</strong> calls
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleKeyStatus(k.id, k.status)} 
                    style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      color: k.status === 'Active' ? '#f87171' : '#48bb78',
                      cursor: 'pointer'
                    }}
                  >
                    {k.status === 'Active' ? 'Revoke' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
            <label className="form-label" style={{ fontSize: '11px' }}>Assign New Live Key to:</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="form-input" 
                value={keyUserSelect} 
                onChange={(e) => setKeyUserSelect(e.target.value)}
                style={{ fontSize: '12px', padding: '8px' }}
              >
                {techUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button onClick={handleGenerateApiKey} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                <Plus size={12} /> Generate Key
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. RESTAURANT RENDER
  if (ind.includes('restaurant') || ind.includes('cafe') || ind.includes('food')) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', flex: 1 }} className="animate-fade-in">
        {/* Table Reservation Planner */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={20} style={{ color: 'var(--color-primary)' }} /> Guest Reservation Planner
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Add table reservations, update seating statuses, and coordinate covers.
          </p>

          <div style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                  <th style={{ padding: '6px' }}>Guest</th>
                  <th style={{ padding: '6px', textAlign: 'center' }}>Covers</th>
                  <th style={{ padding: '6px' }}>Time / Table</th>
                  <th style={{ padding: '6px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => (
                  <tr key={res.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>{res.guest_name}</td>
                    <td style={{ padding: '8px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{res.party_size}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'white', fontSize: '9px' }}>{res.reservation_time}</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginLeft: '6px' }}>T-{res.table_number}</span>
                    </td>
                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        {res.status === 'Confirmed' ? (
                          <button onClick={() => handleUpdateReservationStatus(res.id, 'Seated')} style={{ fontSize: '10px', padding: '3px 6px', background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary)', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Seat</button>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: '600', color: res.status === 'Seated' ? '#48bb78' : '#f56565' }}>{res.status}</span>
                        )}
                        {res.status === 'Confirmed' && (
                          <button onClick={() => handleUpdateReservationStatus(res.id, 'Cancelled')} style={{ fontSize: '10px', padding: '3px 6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', color: '#f56565', cursor: 'pointer' }}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleAddReservation} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '6px' }}>
            <input type="text" className="form-input" value={newGuestName} onChange={(e) => setNewGuestName(e.target.value)} placeholder="Guest Name" style={{ fontSize: '12px' }} required />
            <input type="number" className="form-input" value={newPartySize} onChange={(e) => setNewPartySize(e.target.value)} placeholder="Size" style={{ fontSize: '12px' }} required />
            <input type="text" className="form-input" value={newResTime} onChange={(e) => setNewResTime(e.target.value)} placeholder="Time" style={{ fontSize: '12px' }} required />
            <input type="number" className="form-input" value={newTableNum} onChange={(e) => setNewTableNum(e.target.value)} placeholder="T#" style={{ fontSize: '12px' }} required />
            <button type="submit" className="btn-primary" style={{ padding: '8px 12px' }}><Plus size={14} /></button>
          </form>
        </div>

        {/* Menu Editor */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Utensils size={20} style={{ color: 'var(--color-primary)' }} /> Kitchen Menu Editor
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
            Toggle active menu items availability and update live prices.
          </p>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {menuItems.map(item => (
                <div key={item.id} style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid rgba(255,255,255,0.04)', 
                  borderRadius: '10px', 
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{item.name}</span>
                      <span className="badge" style={{ fontSize: '8px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>{item.category}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Price: <strong>${item.price.toFixed(2)}</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{item.is_available === 1 ? 'Available' : 'Sold Out'}</span>
                    <button 
                      onClick={() => handleToggleMenuAvailability(item.id, item.is_available)} 
                      style={{
                        padding: '6px 10px',
                        background: item.is_available === 1 ? 'rgba(72,187,120,0.1)' : 'rgba(239,68,68,0.1)',
                        border: item.is_available === 1 ? '1px solid #48bb78' : '1px solid #f87171',
                        borderRadius: '6px',
                        color: item.is_available === 1 ? '#48bb78' : '#f87171',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}
                    >
                      {item.is_available === 1 ? 'In Stock' : 'Out'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FALLBACK RENDER (if vertical has no specific layout, render simple table inspector CRUD)
  return (
    <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
      <ShieldAlert size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 16px' }} />
      <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Back-Office Administration</h3>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', maxWidth: '460px', margin: '0 auto 20px' }}>
        No custom panel matches the "{industry}" industry. Access the general database inspector tab to execute direct tables manipulation.
      </p>
    </div>
  );
}
