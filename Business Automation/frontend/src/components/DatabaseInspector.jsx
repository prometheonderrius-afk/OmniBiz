import React, { useState } from 'react';
import { Database, Play, CheckCircle, AlertCircle, Terminal } from 'lucide-react';

export default function DatabaseInspector({ schema }) {
  const [selectedTable, setSelectedTable] = useState(schema?.tables?.[0]?.name || '');
  const [tableRows, setTableRows] = useState([]);
  const [sqlQuery, setSqlQuery] = useState(`SELECT * FROM ${schema?.tables?.[0]?.name || 'clients'};`);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [loadingTable, setLoadingTable] = useState(false);

  const activeTable = schema?.tables?.find(t => t.name === selectedTable);

  const fetchTableRows = async (tableName) => {
    if (!tableName) return;
    setLoadingTable(true);
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `SELECT * FROM ${tableName};` })
      });
      if (response.ok) {
        const data = await response.json();
        setTableRows(data.rows);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  React.useEffect(() => {
    fetchTableRows(selectedTable);
  }, [selectedTable]);

  const handleRunQuery = async () => {
    setQueryError(null);
    setQueryResult(null);
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'SQL query failed.');
      }
      
      const data = await response.json();
      
      if (data.message) {
        setQueryResult({
          columns: ['status'],
          rows: [{ status: data.message }]
        });
      } else {
        setQueryResult({
          columns: data.columns,
          rows: data.rows
        });
      }

      // Re-fetch active table rows
      fetchTableRows(selectedTable);
    } catch (err) {
      setQueryError(err.message || 'An error occurred while executing the query.');
    }
  };

  if (!schema || !schema.tables || schema.tables.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
        No database schema generated yet. Complete the onboarding first.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', flex: 1 }}>
      
      {/* Tables Sidebar */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} /> Tables
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {schema.tables.map(table => (
            <button
              key={table.name}
              onClick={() => {
                setSelectedTable(table.name);
                setSqlQuery(`SELECT * FROM ${table.name};`);
                setQueryResult(null);
                setQueryError(null);
              }}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: selectedTable === table.name ? 'var(--color-primary-glow)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: selectedTable === table.name ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: selectedTable === table.name ? '700' : 'normal',
                transition: 'var(--transition-fast)'
              }}
            >
              {table.name}
            </button>
          ))}
        </div>
        
        {schema.relationships && schema.relationships.length > 0 && (
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
            <h5 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Relationships</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {schema.relationships.map((rel, idx) => (
                <div key={idx} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  🔑 {rel}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Schema Details / SQL Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Table Schema Details */}
        {activeTable && (
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px', fontFamily: 'var(--font-mono)' }}>
              {activeTable.name}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              {activeTable.description}
            </p>

            <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Columns</h4>
            <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' }}>
                    <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>Column Name</th>
                    <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>Data Type</th>
                    <th style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>Constraints</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTable.columns.map((col, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: 'var(--color-primary)' }}>{col.name}</td>
                      <td style={{ padding: '10px 12px' }}>{col.type}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>{col.constraints || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h4 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Sample Data</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', fontFamily: 'var(--font-mono)' }}>
                    {activeTable.columns.map(c => (
                      <th key={c.name} style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{c.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingTable ? (
                    <tr>
                      <td colSpan={activeTable.columns.length} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Loading table rows...
                      </td>
                    </tr>
                  ) : tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeTable.columns.length} style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No records found in this table.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((rec, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {activeTable.columns.map(col => (
                          <td key={col.name} style={{ padding: '10px 12px' }}>{String(rec[col.name] ?? '')}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SQL Playground */}
        <div className="glass-card" style={{ padding: '24px', background: '#070a13' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} style={{ color: 'var(--color-primary)' }} /> Custom SQL Playground
          </h3>
          
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <textarea
              className="form-input"
              rows={3}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                background: 'rgba(0,0,0,0.4)',
                lineHeight: '1.5',
                padding: '12px 14px',
                letterSpacing: '0.02em',
                resize: 'none'
              }}
            />
            <button
              onClick={handleRunQuery}
              className="btn-primary"
              style={{
                position: 'absolute',
                right: '12px',
                bottom: '12px',
                padding: '8px 14px',
                fontSize: '12px'
              }}
            >
              <Play size={12} fill="white" /> Execute SQL
            </button>
          </div>

          {/* Results Console */}
          {queryError && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              borderRadius: '8px', 
              padding: '12px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#f87171',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px'
            }}>
              <AlertCircle size={16} />
              <span>{queryError}</span>
            </div>
          )}

          {queryResult && (
            <div style={{ 
              background: 'rgba(72, 187, 120, 0.05)', 
              border: '1px solid rgba(72, 187, 120, 0.1)', 
              borderRadius: '8px', 
              padding: '16px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#48bb78', fontSize: '13px', fontWeight: '600' }}>
                <CheckCircle size={16} /> Query executed successfully. Returned {queryResult.rows.length} rows.
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(72, 187, 120, 0.2)', textAlign: 'left', fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                      {queryResult.columns.map(c => (
                        <th key={c} style={{ padding: '8px 12px' }}>{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {queryResult.columns.map(col => (
                          <td key={col} style={{ padding: '10px 12px' }}>{String(row[col] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
