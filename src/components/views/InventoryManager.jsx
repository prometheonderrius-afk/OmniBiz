import React, { useState } from 'react';

export default function InventoryManager({ businessData = {}, addNotification }) {
  const [items, setItems] = useState([
    { id: 'inv-1', sku: '1001', name: 'Artisan Espresso Beans (5 lb Bag)', category: 'Beverages', stock: 4, reorder: 10, cost: 22.00, price: 65.00, supplier: 'Pacific Roasters Co.' },
    { id: 'inv-2', sku: '1002', name: 'Organic Oat Milk (12 Pack)', category: 'Beverages', stock: 18, reorder: 12, cost: 16.50, price: 38.00, supplier: 'Dairy Free Direct' },
    { id: 'inv-3', sku: '2001', name: 'HVAC Capacitor 45/5 MFD', category: 'Parts & Supplies', stock: 2, reorder: 5, cost: 12.00, price: 39.99, supplier: 'Climate Supply Wholesale' },
    { id: 'inv-4', sku: '2002', name: 'Universal Thermostat Pro', category: 'Parts & Supplies', stock: 8, reorder: 4, cost: 45.00, price: 110.00, supplier: 'Climate Supply Wholesale' }
  ]);

  const [filterCategory, setFilterCategory] = useState('all');
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'subtract'
  const [poDraftModal, setPoDraftModal] = useState(null);

  // New Item Modal
  const [newItemModal, setNewItemModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newStock, setNewStock] = useState(20);
  const [newReorder, setNewReorder] = useState(10);
  const [newPrice, setNewPrice] = useState(15.00);

  const lowStockItems = items.filter(i => i.stock <= i.reorder);

  // Apply Adjustment
  const handleApplyAdjustment = () => {
    if (!adjustModalItem) return;
    const delta = adjustType === 'add' ? adjustQty : -adjustQty;
    setItems(items.map(i => {
      if (i.id === adjustModalItem.id) {
        const updated = Math.max(0, i.stock + delta);
        return { ...i, stock: updated };
      }
      return i;
    }));
    alert(`Updated stock for ${adjustModalItem.name}!`);
    if (addNotification) {
      addNotification(`Stock adjusted for ${adjustModalItem.name}: ${delta > 0 ? '+' : ''}${delta}`, 'system');
    }
    setAdjustModalItem(null);
  };

  // Add Item
  const handleAddNewItem = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim()) return;
    const item = {
      id: 'inv-' + Date.now(),
      sku: newSku.trim(),
      name: newName.trim(),
      category: 'General Inventory',
      stock: parseInt(newStock) || 0,
      reorder: parseInt(newReorder) || 5,
      cost: newPrice * 0.5,
      price: parseFloat(newPrice) || 10.00,
      supplier: 'Default Distributor'
    };
    setItems([...items, item]);
    setNewItemModal(false);
    setNewName('');
    setNewSku('');
    alert("New inventory item added successfully!");
  };

  // AI Purchase Order Generator
  const handleGeneratePo = (item) => {
    const neededQty = (item.reorder * 3) - item.stock;
    const estCost = neededQty * item.cost;
    const draftText = `RE: RESTOCK PURCHASE ORDER - ${item.name} (SKU: ${item.sku})

Dear ${item.supplier},

Please fulfill the following restock purchase order for ${businessData.name || 'our company'}:

- Item: ${item.name}
- SKU: ${item.sku}
- Quantity Requested: ${neededQty} units
- Unit Cost: $${item.cost.toFixed(2)}
- Total Estimated Order Cost: $${estCost.toFixed(2)}

Shipping Address: ${businessData.location || 'HQ Storefront Address'}

Thank you,
${businessData.ownerName || 'Inventory Manager'}
${businessData.name || 'OmniBiz Client'}`;

    setPoDraftModal({
      supplier: item.supplier,
      draftText
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Inventory &amp; Stock <span className="text-gradient-purple">Tracking Suite</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Monitor real-time SKU stock levels, reorder thresholds, and generate AI purchase orders for suppliers.
          </p>
        </div>
        <button 
          className="glass-button" 
          style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', padding: '8px 18px' }}
          onClick={() => setNewItemModal(true)}
        >
          + Add Inventory Item
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--accent-pink)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h4 style={{ margin: 0, color: 'var(--accent-pink)', fontSize: '0.95rem' }}>⚠️ Low Stock Alert ({lowStockItems.length} items below threshold)</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Items: {lowStockItems.map(i => `${i.name} (${i.stock} left)`).join(', ')}
            </p>
          </div>
          <button 
            className="glass-button" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'var(--accent-pink)' }}
            onClick={() => handleGeneratePo(lowStockItems[0])}
          >
            🤖 Draft Purchase Order for Supplier
          </button>
        </div>
      )}

      {/* Main Stock Catalog Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Stock Catalog &amp; Quantities</h3>
        <table className="glass-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Stock Level</th>
              <th>Reorder Point</th>
              <th>Unit Cost</th>
              <th>Selling Price</th>
              <th>Supplier</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.stock <= item.reorder;
              return (
                <tr key={item.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.sku}</td>
                  <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`badge ${isLow ? 'badge-pink' : 'badge-emerald'}`}>
                      {item.stock} Units {isLow ? '(LOW)' : ''}
                    </span>
                  </td>
                  <td>{item.reorder} Units</td>
                  <td>${item.cost.toFixed(2)}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>${item.price.toFixed(2)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.supplier}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="glass-button glass-button-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => setAdjustModalItem(item)}
                      >
                        ± Adjust
                      </button>
                      <button 
                        className="glass-button" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--accent-purple)' }}
                        onClick={() => handleGeneratePo(item)}
                      >
                        🤖 PO
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Adjust Stock Level</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Item: <strong>{adjustModalItem.name}</strong> (Current: {adjustModalItem.stock})
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Adjustment Action</label>
              <select className="glass-input" value={adjustType} onChange={e => setAdjustType(e.target.value)}>
                <option value="add" style={{ background: '#090d16' }}>+ Receive Restock Shipment</option>
                <option value="subtract" style={{ background: '#090d16' }}>- Spoilage / Damage / Loss</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Quantity *</label>
              <input type="number" className="glass-input" min="1" value={adjustQty} onChange={e => setAdjustQty(parseInt(e.target.value) || 1)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="glass-button glass-button-secondary" onClick={() => setAdjustModalItem(null)}>Cancel</button>
              <button className="glass-button" style={{ background: 'var(--accent-purple)' }} onClick={handleApplyAdjustment}>Confirm Adjustment</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {newItemModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <form onSubmit={handleAddNewItem} className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>Add Inventory Stock Record</h3>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Item Name *</label>
              <input type="text" className="glass-input" value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>SKU / Barcode *</label>
              <input type="text" className="glass-input" value={newSku} onChange={e => setNewSku(e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Initial Stock</label>
                <input type="number" className="glass-input" value={newStock} onChange={e => setNewStock(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Reorder Point</label>
                <input type="number" className="glass-input" value={newReorder} onChange={e => setNewReorder(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Selling Price ($)</label>
              <input type="number" step="0.01" className="glass-input" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button type="button" className="glass-button glass-button-secondary" onClick={() => setNewItemModal(false)}>Cancel</button>
              <button type="submit" className="glass-button" style={{ background: 'var(--accent-purple)' }}>Save Item</button>
            </div>
          </form>
        </div>
      )}

      {/* PO Draft Modal */}
      {poDraftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div className="glass-card" style={{ maxWidth: '500px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3>🤖 AI Drafted Purchase Order</h3>
            <textarea 
              className="glass-input" 
              style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '0.8rem' }}
              value={poDraftModal.draftText}
              onChange={e => setPoDraftModal({ ...poDraftModal, draftText: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="glass-button glass-button-secondary" onClick={() => setPoDraftModal(null)}>Cancel</button>
              <button 
                className="glass-button" 
                style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)' }}
                onClick={() => {
                  alert(`Purchase Order dispatched to ${poDraftModal.supplier}!`);
                  setPoDraftModal(null);
                }}
              >
                Send PO to Supplier
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
