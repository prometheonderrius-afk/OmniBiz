import React, { useState } from 'react';

export default function PayrollManager({ businessData = {}, addNotification }) {
  const employees = businessData.employees || [
    { name: 'Sarah Jenkins', role: 'Senior Barista / Supervisor', pin: '1234', rate: 22.50 },
    { name: 'Marcus Vance', role: 'Staff Technician / HVAC', pin: '5678', rate: 35.00 },
    { name: 'Elena Rostova', role: 'Store Associate', pin: '4321', rate: 18.00 }
  ];

  // Shifts state
  const [shifts, setShifts] = useState([
    { id: 'shift-1', employee: 'Sarah Jenkins', clockIn: '08:00 AM', clockOut: '04:30 PM', hours: 8.5, overtime: 0.5, date: 'Today', status: 'Completed' },
    { id: 'shift-2', employee: 'Marcus Vance', clockIn: '09:15 AM', clockOut: '--', hours: 4.2, overtime: 0, date: 'Today', status: 'Active Shift' }
  ]);

  // Terminal state
  const [selectedStaff, setSelectedStaff] = useState(employees[0]?.name || '');
  const [pinInput, setPinInput] = useState('');
  const [paystubModal, setPaystubModal] = useState(null);

  // Clock In/Out action
  const handleClockToggle = (isClockIn) => {
    if (!pinInput.trim()) {
      alert("Please enter your 4-digit PIN.");
      return;
    }
    const staff = employees.find(e => e.name === selectedStaff);
    if (staff && staff.pin && staff.pin !== pinInput.trim()) {
      alert("Incorrect PIN code!");
      return;
    }

    if (isClockIn) {
      const newShift = {
        id: 'shift-' + Date.now(),
        employee: selectedStaff,
        clockIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: '--',
        hours: 0,
        overtime: 0,
        date: 'Today',
        status: 'Active Shift'
      };
      setShifts([newShift, ...shifts]);
      alert(`Clock-In recorded for ${selectedStaff}!`);
      if (addNotification) addNotification(`Shift started: ${selectedStaff} clocked in.`, 'system');
    } else {
      setShifts(shifts.map(s => {
        if (s.employee === selectedStaff && s.status === 'Active Shift') {
          return {
            ...s,
            clockOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hours: 8.0,
            status: 'Completed'
          };
        }
        return s;
      }));
      alert(`Clock-Out recorded for ${selectedStaff}!`);
      if (addNotification) addNotification(`Shift ended: ${selectedStaff} clocked out.`, 'system');
    }
    setPinInput('');
  };

  // Generate Paystub
  const handleGeneratePaystub = (emp) => {
    const hourlyRate = emp.rate || 20.00;
    const regHours = 40;
    const otHours = 5;
    const grossPay = (regHours * hourlyRate) + (otHours * hourlyRate * 1.5);
    const taxes = grossPay * 0.15;
    const netPay = grossPay - taxes;

    setPaystubModal({
      employee: emp.name,
      role: emp.role,
      period: 'Bi-Weekly (Jul 15 - Jul 28)',
      hourlyRate,
      regHours,
      otHours,
      grossPay,
      taxes,
      netPay,
      company: businessData.name || 'OmniBiz Client'
    });
  };

  // Export Payroll to CSV
  const handleExportCsv = () => {
    let csv = "Employee,Role,HourlyRate,RegularHours,GrossPay,NetPay\n";
    employees.forEach(emp => {
      const rate = emp.rate || 20.00;
      const gross = rate * 40;
      const net = gross * 0.85;
      csv += `"${emp.name}","${emp.role}",${rate},40,${gross.toFixed(2)},${net.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniBiz_Payroll_${Date.now()}.csv`;
    a.click();
    alert("Payroll manifest exported to CSV!");
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', margin: 0, fontFamily: 'var(--font-heading)' }}>
            Payroll &amp; Staff <span className="text-gradient-purple">Timecards Hub</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Manage staff clock-in terminals, shift hours, overtime, paystubs, and Gusto/ADP exports.
          </p>
        </div>
        <button className="glass-button" style={{ background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6d28d9 100%)', padding: '8px 18px' }} onClick={handleExportCsv}>
          📥 Export Payroll CSV
        </button>
      </div>

      {/* Grid: Terminal & Shifts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
        
        {/* Left: Staff Terminal */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>⏱️ Staff Clock-In Terminal</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>
            Select your name and enter your 4-digit PIN to punch in or punch out for your shift.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Select Employee *</label>
            <select className="glass-input" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
              {employees.map(e => (
                <option key={e.name} value={e.name} style={{ background: '#090d16' }}>{e.name} ({e.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Enter 4-Digit Security PIN *</label>
            <input 
              type="password" 
              className="glass-input" 
              maxLength="4" 
              placeholder="e.g. 1234"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              style={{ fontSize: '1.2rem', letterSpacing: '4px', textAlign: 'center' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <button 
              className="glass-button" 
              onClick={() => handleClockToggle(true)}
              style={{ background: 'linear-gradient(135deg, var(--accent-emerald) 0%, #059669 100%)', border: 'none', padding: '12px' }}
            >
              ▶ Clock In
            </button>
            <button 
              className="glass-button" 
              onClick={() => handleClockToggle(false)}
              style={{ background: 'linear-gradient(135deg, var(--accent-pink) 0%, #db2777 100%)', border: 'none', padding: '12px' }}
            >
              ⏹ Clock Out
            </button>
          </div>
        </div>

        {/* Right: Active Shifts Log */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Live Shifts &amp; Timecard Log</h3>
          <table className="glass-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 'bold' }}>{s.employee}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>{s.clockIn}</td>
                  <td>{s.clockOut}</td>
                  <td>{s.hours} hrs {s.overtime > 0 && <span style={{ color: '#f59e0b', fontSize: '0.7rem' }}>(+{s.overtime} OT)</span>}</td>
                  <td>
                    <span className={`badge ${s.status === 'Active Shift' ? 'badge-emerald' : 'badge-muted'}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Bottom: Staff Payroll Summary Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Bi-Weekly Payroll Roster &amp; Paystub Generator</h3>
        <table className="glass-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Role</th>
              <th>Hourly Rate</th>
              <th>Est. Bi-Weekly Gross</th>
              <th>Est. Net Pay</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, idx) => {
              const rate = emp.rate || 20.00;
              const gross = rate * 80; // Bi-weekly 80 hrs
              const net = gross * 0.85;
              return (
                <tr key={idx}>
                  <td style={{ fontWeight: 'bold' }}>{emp.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{emp.role}</td>
                  <td style={{ color: 'var(--accent-cyan)' }}>${rate.toFixed(2)}/hr</td>
                  <td style={{ fontWeight: 'bold' }}>${gross.toFixed(2)}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-emerald)' }}>${net.toFixed(2)}</td>
                  <td>
                    <button 
                      className="glass-button glass-button-secondary" 
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => handleGeneratePaystub(emp)}
                    >
                      📄 Generate Paystub
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paystub Modal */}
      {paystubModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', background: '#090d16', color: '#fff' }}>
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '12px', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{paystubModal.company}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', fontWeight: 'bold' }}>EARNINGS STATEMENT / PAYSTUB</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{paystubModal.period}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Employee:</span>
                <strong>{paystubModal.employee}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Role:</span>
                <span>{paystubModal.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Hourly Rate:</span>
                <span>${paystubModal.hourlyRate.toFixed(2)}/hr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Regular Hours (40 hrs):</span>
                <span>${(paystubModal.hourlyRate * 40).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overtime Hours (5 hrs @ 1.5x):</span>
                <span>${(paystubModal.hourlyRate * 5 * 1.5).toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px dashed #444', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Gross Pay:</span>
                <span>${paystubModal.grossPay.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-pink)' }}>
                <span>Est. Tax &amp; Deductions (15%):</span>
                <span>-${paystubModal.taxes.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                <span>NET DIRECT DEPOSIT:</span>
                <span>${paystubModal.netPay.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="glass-button glass-button-secondary" onClick={() => setPaystubModal(null)}>Close</button>
              <button className="glass-button" style={{ background: 'var(--accent-purple)' }} onClick={() => { alert("Print dialog triggered for paystub."); setPaystubModal(null); }}>Print Paystub</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
