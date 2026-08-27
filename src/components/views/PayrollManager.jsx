import React, { useState } from 'react';
import { generatePaystubPdfBlob } from '../../utils/documentGenerator';

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
  const [activePaystubDoc, setActivePaystubDoc] = useState(null);

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
      if (addNotification) addNotification(`Shift ended: ${selectedStaff} clocked out.`, 'system');
    }
    setPinInput('');
  };

  // Helper to compile full paystub document
  const buildPaystubData = (emp) => {
    const hourlyRate = emp.rate || 20.00;
    const regHours = 40;
    const otHours = 5;
    const regularPay = regHours * hourlyRate;
    const overtimePay = otHours * hourlyRate * 1.5;
    const grossPay = regularPay + overtimePay;
    
    // Itemized statutory withholdings
    const fitTax = grossPay * 0.0765;
    const ficaTax = grossPay * 0.0535;
    const stateTax = grossPay * 0.0200;
    const totalDeductions = fitTax + ficaTax + stateTax;
    const netPay = grossPay - totalDeductions;

    const deductions = [
      { name: 'Federal Income Tax (FIT)', amount: fitTax },
      { name: 'FICA (Social Security & Medicare)', amount: ficaTax },
      { name: 'State & Local Withholding (SIT)', amount: stateTax }
    ];

    const payPeriod = 'Bi-Weekly (Jul 15 - Jul 28, 2026)';
    const company = businessData.name || 'OmniBiz Operations Corp';

    const doc = generatePaystubPdfBlob({
      employeeName: emp.name,
      role: emp.role,
      payPeriod,
      regularHours: regHours,
      overtimeHours: otHours,
      hourlyRate,
      grossPay,
      deductions,
      taxes: totalDeductions,
      netPay,
      company,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    });

    return {
      employee: emp.name,
      role: emp.role,
      period: payPeriod,
      hourlyRate,
      regHours,
      otHours,
      regularPay,
      overtimePay,
      grossPay,
      deductions,
      taxes: totalDeductions,
      netPay,
      company,
      doc
    };
  };

  const handleGeneratePaystub = (emp) => {
    const data = buildPaystubData(emp);
    setActivePaystubDoc(data.doc);
    setPaystubModal(data);
  };

  const handleDirectDownloadPaystub = (emp) => {
    const data = buildPaystubData(emp);
    data.doc.download();
    if (addNotification) {
      addNotification(`Paystub PDF generated and downloaded for ${emp.name}.`, 'system');
    }
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
    if (addNotification) {
      addNotification("Payroll manifest exported to CSV.", "system");
    }
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
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="glass-button glass-button-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleGeneratePaystub(emp)}
                      >
                        👁️ View Paystub
                      </button>
                      <button 
                        className="glass-button glass-button-purple" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleDirectDownloadPaystub(emp)}
                      >
                        📄 Download PDF
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paystub Modal with Real Download & Print */}
      {paystubModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '24px', background: '#090d16', color: '#fff' }}>
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

              {/* Deductions Breakdown */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-pink)', marginBottom: '4px' }}>STATUTORY WITHHOLDINGS:</div>
                {paystubModal.deductions?.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>{d.name}:</span>
                    <span>-${d.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--accent-emerald)' }}>
                <span>NET DIRECT DEPOSIT:</span>
                <span>${paystubModal.netPay.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="glass-button glass-button-secondary" onClick={() => setPaystubModal(null)}>Close</button>
              <button className="glass-button glass-button-cyan" onClick={() => activePaystubDoc?.print()}>🖨️ Print Paystub</button>
              <button className="glass-button glass-button-purple" onClick={() => activePaystubDoc?.download()}>⬇️ Download PDF</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
