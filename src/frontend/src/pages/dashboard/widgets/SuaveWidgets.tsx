// =========================================================
// 🎨 STYLED DASHBOARD WIDGETS - HYPRLAND SUAVE EDITION
// =========================================================

// pages/dashboard/widgets/SuaveWidgets.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { WidgetProps } from '../../../types/dashboard';

// =========================================================
// 📊 1. JOINT RETURN WIDGET (Finanças)
// =========================================================
export function JointReturnWidget({ data }: WidgetProps) {
  const returns = data?.returns || { gainers: [], losers: [], total: 1234 };
  
  return (
    <div className="suave-card" style={{ 
      background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container-low))',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Gradiente decorativo */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '200px',
        height: '200px',
        background: 'radial-gradient(circle, var(--primary-container) 0%, transparent 70%)',
        opacity: 0.3,
        pointerEvents: 'none'
      }} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: 0 }}>
            Joint Return
          </h3>
          <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>
            Total Return Amount
          </p>
        </div>
        <span style={{
          fontSize: 'var(--headline-lg)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--primary)',
          background: 'var(--primary-container)',
          padding: '4px 16px',
          borderRadius: 'var(--radius-lg)',
          letterSpacing: '-0.5px'
        }}>
          ${returns.total || 1234}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        {/* Gainers */}
        <div>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--tertiary)', fontWeight: 'var(--font-semibold)', marginBottom: '8px' }}>
            📈 Gainers
          </p>
          {returns.gainers?.map((item: any, i: number) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid var(--surface-container-high)'
            }}>
              <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}>{item.name}</span>
              <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: 'var(--tertiary)' }}>
                +${item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Losers */}
        <div>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--secondary)', fontWeight: 'var(--font-semibold)', marginBottom: '8px' }}>
            📉 Losers
          </p>
          {returns.losers?.map((item: any, i: number) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid var(--surface-container-high)'
            }}>
              <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}>{item.name}</span>
              <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: 'var(--secondary)' }}>
                -${item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 'var(--space-3)',
        padding: 'var(--space-2)',
        background: 'var(--surface-container)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        gap: 'var(--space-3)',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>
          🔗 Link your bank account
        </span>
        <button className="btn btn-primary" style={{ marginLeft: 'auto', padding: '6px 16px', fontSize: 'var(--label-md)' }}>
          Connect
        </button>
      </div>
    </div>
  );
}

// =========================================================
// 💰 2. DEBT PAYOFF WIDGET
// =========================================================
export function DebtPayoffWidget({ data }: WidgetProps) {
  const debts = data?.debts || [];
  
  return (
    <div className="suave-card" style={{
      background: 'var(--surface-container-lowest)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: 0 }}>
          Debt Payoff
        </h3>
        <span className="badge badge-warning">Discover the right way</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
        <div style={{
          padding: 'var(--space-2)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>retirement</span>
          <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', margin: '4px 0 0' }}>Retirement</p>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>Get a plan</p>
        </div>

        <div style={{
          padding: 'var(--space-2)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--tertiary)' }}>payments</span>
          <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', margin: '4px 0 0' }}>Income & Tax</p>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>Financing activities</p>
        </div>

        <div style={{
          padding: 'var(--space-2)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--secondary)' }}>shield</span>
          <p style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', margin: '4px 0 0' }}>Insurance</p>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)' }}>Home, car, life</p>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 🏠 3. JOINT ALLOCATION WIDGET
// =========================================================
export function JointAllocationWidget({ data }: WidgetProps) {
  const allocations = data?.allocations || [
    { label: 'Housing', amount: 3000, icon: 'home' },
    { label: 'Shop', amount: 600, icon: 'shopping_bag' },
    { label: 'Transfer', amount: 400, icon: 'swap_horiz' },
    { label: 'Food & Drink', amount: 150, icon: 'restaurant' },
    { label: 'Health care', amount: 50, icon: 'health_and_safety' }
  ];

  const total = allocations.reduce((sum: number, a: any) => sum + a.amount, 0);

  return (
    <div className="suave-card" style={{
      background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container))',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: 0 }}>
          Joint Allocation
        </h3>
        <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)' }}>
          Total: <strong style={{ color: 'var(--primary)' }}>${total}</strong>
        </span>
      </div>

      {allocations.map((item: any, i: number) => {
        const percentage = (item.amount / total) * 100;
        const colors = ['var(--primary)', 'var(--tertiary)', 'var(--secondary)', 'var(--primary-container)', 'var(--surface-container-high)'];
        
        return (
          <div key={i} style={{ marginBottom: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }}>
                  {item.icon}
                </span>
                {item.label}
              </span>
              <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)' }}>
                ${item.amount}
              </span>
            </div>
            <div style={{
              height: '6px',
              background: 'var(--surface-container-high)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${percentage}%`,
                height: '100%',
                background: colors[i % colors.length],
                borderRadius: 'var(--radius-full)',
                transition: 'width 1s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =========================================================
// 📈 4. STOCK WIDGET (Hyprland Style)
// =========================================================
export function StockWidget({ data }: WidgetProps) {
  const stocks = data?.stocks || [
    { name: 'Apple', value: 15000, change: 14.05 },
    { name: 'Tesla', value: 1500, change: 14.05 },
    { name: 'Twitter', value: 5000, change: 7.05 },
    { name: 'Google', value: 12000, change: 4.05 }
  ];

  return (
    <div className="suave-card" style={{
      background: 'var(--surface-container-lowest)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, var(--primary), var(--tertiary), var(--secondary))'
      }} />

      <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-3)' }}>
        📊 Stocks
      </h3>

      <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
        {stocks.map((stock: any, i: number) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--space-2)',
            background: 'var(--surface-container-low)',
            borderRadius: 'var(--radius-lg)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}>
            <div>
              <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface)' }}>
                {stock.name}
              </span>
              <span style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', display: 'block' }}>
                ${stock.value.toFixed(2)}
              </span>
            </div>
            <span style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--label-md)',
              fontWeight: 'var(--font-semibold)',
              background: stock.change > 0 ? 'var(--primary-container)' : 'var(--error-container)',
              color: stock.change > 0 ? 'var(--primary)' : 'var(--error)'
            }}>
              {stock.change > 0 ? '+' : ''}{stock.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =========================================================
// 🏦 5. LOAN WIDGET
// =========================================================
export function LoanWidget({ data }: WidgetProps) {
  const loan = data?.loan || {
    monthly_amount: 0,
    balance: 35000,
    apr: 12,
    min_payment: 3335
  };

  return (
    <div className="suave-card" style={{
      background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--surface-container))',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: 0 }}>
          🏦 LOAN
        </h3>
        <span style={{
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--label-md)',
          background: 'var(--secondary-container)',
          color: 'var(--on-secondary-container)'
        }}>
          APR {loan.apr}%
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)' }}>
        <div style={{
          padding: 'var(--space-2)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', margin: 0 }}>Monthly</p>
          <p style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', color: 'var(--on-surface)', margin: 0 }}>
            ${loan.monthly_amount}
          </p>
        </div>

        <div style={{
          padding: 'var(--space-2)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', margin: 0 }}>Balance</p>
          <p style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', color: 'var(--secondary)', margin: 0 }}>
            ${loan.balance.toLocaleString()}
          </p>
        </div>

        <div style={{
          padding: 'var(--space-2)',
          background: 'var(--surface-container-low)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', margin: 0 }}>Min Payment</p>
          <p style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-bold)', color: 'var(--tertiary)', margin: 0 }}>
            ${loan.min_payment.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 📝 6. TRANSACTIONS WIDGET (Suave & Minimal)
// =========================================================
export function TransactionsWidget({ data }: WidgetProps) {
  const transactions = data?.transactions || [
    { name: 'Alisa Nuri', amount: 750, date: 'Today, 2:50 PM' },
    { name: 'Lina Muller', amount: -945, date: 'Sunday, 7:02 PM' },
    { name: 'James Brown', amount: -555, date: 'Monday, 6:05 PM' }
  ];

  return (
    <div className="suave-card" style={{
      background: 'var(--surface-container-lowest)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)'
    }}>
      <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', marginBottom: 'var(--space-3)' }}>
        💳 Transactions
      </h3>

      {transactions.map((tx: any, i: number) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--space-2)',
          borderBottom: i < transactions.length - 1 ? '1px solid var(--surface-container-high)' : 'none'
        }}>
          <div>
            <span style={{ fontSize: 'var(--body-md)', fontWeight: 'var(--font-medium)', color: 'var(--on-surface)' }}>
              {tx.name}
            </span>
            <span style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', display: 'block' }}>
              {tx.date}
            </span>
          </div>
          <span style={{
            fontSize: 'var(--body-lg)',
            fontWeight: 'var(--font-semibold)',
            color: tx.amount > 0 ? 'var(--primary)' : 'var(--secondary)'
          }}>
            {tx.amount > 0 ? '+' : ''}{tx.amount}
          </span>
        </div>
      ))}
    </div>
  );
}

// =========================================================
// ✅ 7. TAX RETURN WIDGET
// =========================================================
export function TaxReturnWidget({ data }: WidgetProps) {
  const tax = data?.tax || { total: 70288, year: 2023 };

  return (
    <div className="suave-card" style={{
      background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--primary-container))',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        bottom: '-40px',
        right: '-40px',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
        opacity: 0.1,
        pointerEvents: 'none'
      }} />

      <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', margin: 0 }}>Tax Return</p>
      <p style={{
        fontSize: 'var(--headline-xl)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--primary)',
        margin: '4px 0'
      }}>
        ${tax.total.toLocaleString()}
      </p>
      <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: 0 }}>
        Your tax return in {tax.year}
      </p>
    </div>
  );
}

// =========================================================
// ⭐ 8. EXCELLENT SCORE WIDGET
// =========================================================
export function ExcellentScoreWidget({ data }: WidgetProps) {
  const score = data?.score || { value: 85, label: 'Excellent' };

  return (
    <div className="suave-card" style={{
      background: 'linear-gradient(135deg, var(--surface-container-lowest), var(--tertiary-container))',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)',
      textAlign: 'center'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'var(--tertiary-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto var(--space-2)'
      }}>
        <span style={{
          fontSize: 'var(--headline-lg)',
          fontWeight: 'var(--font-bold)',
          color: 'var(--tertiary)'
        }}>
          {score.value}
        </span>
      </div>
      <h3 style={{ fontSize: 'var(--title-md)', fontWeight: 'var(--font-semibold)', color: 'var(--tertiary)', margin: 0 }}>
        {score.label}
      </h3>
      <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: '4px 0 0' }}>
        Your score is good. Improving it can secure better interest rates.
      </p>
    </div>
  );
}

// =========================================================
// 👤 9. PROFILE WIDGET
// =========================================================
export function ProfileWidget({ data }: WidgetProps) {
  const profile = data?.profile || { name: 'James Smith', email: 'smith@gmail.com' };

  return (
    <div className="suave-card" style={{
      background: 'var(--surface-container-lowest)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'var(--primary-container)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--headline-lg)',
        fontWeight: 'var(--font-bold)',
        color: 'var(--primary)',
        flexShrink: 0
      }}>
        {profile.name.charAt(0)}
      </div>
      <div>
        <h4 style={{ fontSize: 'var(--body-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--on-surface)', margin: 0 }}>
          {profile.name}
        </h4>
        <p style={{ fontSize: 'var(--body-md)', color: 'var(--on-surface-variant)', margin: '2px 0 0' }}>
          {profile.email}
        </p>
      </div>
    </div>
  );
}

// =========================================================
// 🔐 10. PASSWORD WIDGET
// =========================================================
export function PasswordWidget({ data }: WidgetProps) {
  const [show, setShow] = useState(false);
  const password = data?.password || '••••••••';

  return (
    <div className="suave-card" style={{
      background: 'var(--surface-container-lowest)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      border: '1px solid var(--surface-container-high)'
    }}>
      <p style={{ fontSize: 'var(--label-md)', color: 'var(--on-surface-variant)', margin: '0 0 8px' }}>Password</p>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-2)',
        background: 'var(--surface-container-low)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--surface-container-high)'
      }}>
        <span style={{ fontSize: 'var(--body-lg)', color: 'var(--on-surface)', letterSpacing: '4px' }}>
          {show ? password : '••••••••'}
        </span>
        <button
          onClick={() => setShow(!show)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--on-surface-variant)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <span className="material-symbols-outlined">
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );
}