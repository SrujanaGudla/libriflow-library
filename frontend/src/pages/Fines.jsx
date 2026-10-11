import React, { useState, useEffect } from 'react';
import { fineService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import { 
  IndianRupee, 
  CheckCircle, 
  AlertCircle, 
  CreditCard, 
  Search, 
  Loader2, 
  Receipt, 
  Clock, 
  Download,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const Fines = () => {
  const { isStudent, isAdmin } = useAuth();
  const [fines, setFines] = useState([]);
  const [filteredFines, setFilteredFines] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNPAID' | 'PAID'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [payingFine, setPayingFine] = useState(null); // Selected fine for payment modal
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'upi'
  const [receiptModal, setReceiptModal] = useState(null); // Displays payment receipt
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadFines();
  }, [isStudent]);

  const loadFines = async () => {
    try {
      setLoading(true);
      let res;
      if (isStudent) {
        res = await fineService.getMyFines();
      } else {
        res = await fineService.getAllFines();
      }

      if (res && res.data) {
        setFines(res.data);
        setFilteredFines(res.data);
      }
    } catch (err) {
      console.error('Failed to load fines:', err);
      setNotification({ type: 'error', text: 'Failed to load fine records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...fines];

    if (statusFilter !== 'ALL') {
      result = result.filter((f) => f.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          (f.bookTitle && f.bookTitle.toLowerCase().includes(q)) ||
          (f.studentName && f.studentName.toLowerCase().includes(q)) ||
          (f.studentEmail && f.studentEmail.toLowerCase().includes(q)) ||
          (f.bookIsbn && f.bookIsbn.toLowerCase().includes(q))
      );
    }

    setFilteredFines(result);
  }, [statusFilter, searchQuery, fines]);

  // Execute Simulated Payment
  const handleConfirmSimulatedPayment = async () => {
    if (!payingFine) return;

    try {
      setIsProcessingPayment(true);
      // Simulate real gateway latency for realistic UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      const res = await fineService.payFine(payingFine.id);

      const txnId = `TXN-LF-${Date.now().toString().slice(-6)}`;
      setReceiptModal({
        fine: payingFine,
        transactionId: txnId,
        paidAt: new Date().toLocaleString(),
        paymentMethod: paymentMethod === 'card' ? 'Simulated Card (•••• 4242)' : 'Simulated UPI (@libriflow)'
      });

      setPayingFine(null);
      setNotification({
        type: 'success',
        text: res.message || `Fine of ₹${payingFine.amount?.toFixed(2)} settled successfully!`,
      });
      loadFines();
    } catch (err) {
      console.error('Payment error:', err);
      const msg = err.response?.data?.message || 'Failed to process payment.';
      setNotification({ type: 'error', text: msg });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (filteredFines.length === 0) return;

    const headers = ['Fine ID', 'Book Title', 'Student Name', 'Student Email', 'Amount (INR)', 'Status', 'Generated Date'];
    const rows = filteredFines.map(f => [
      f.id,
      `"${(f.bookTitle || '').replace(/"/g, '""')}"`,
      `"${(f.studentName || '').replace(/"/g, '""')}"`,
      f.studentEmail || '',
      f.amount || 0,
      f.status || '',
      f.createdAt || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `libriflow_fines_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <Loading message="Loading fine ledgers..." />;
  }

  const unpaidFines = fines.filter((f) => f.status === 'UNPAID');
  const paidFines = fines.filter((f) => f.status === 'PAID');
  const totalUnpaid = unpaidFines.reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalPaid = paidFines.reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div className="main-content">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#315F7B', marginBottom: '0.35rem' }}>
            {isStudent ? 'My Library Fines & Receipts' : 'Fine Management & Settlements'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            {isStudent 
              ? 'View overdue penalties accrued on late book returns and settle balances online.'
              : 'Audit library penalty charges, monitor outstanding student fees, and record payments.'}
          </p>
        </div>

        {fines.length > 0 && (
          <button 
            type="button" 
            onClick={handleExportCSV} 
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="pastel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'var(--pastel-peach)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--peach-text)' }}>
            <IndianRupee size={22} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unpaid Balance</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: totalUnpaid > 0 ? '#C05621' : '#1E7E34', display: 'block' }}>
              ₹{totalUnpaid.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{unpaidFines.length} unpaid record(s)</span>
          </div>
        </div>

        <div className="pastel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'var(--pastel-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mint-text)' }}>
            <CheckCircle size={22} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Settled</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#315F7B', display: 'block' }}>
              ₹{totalPaid.toFixed(2)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{paidFines.length} paid record(s)</span>
          </div>
        </div>

        <div className="pastel-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'var(--pastel-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#315F7B' }}>
            <Receipt size={22} strokeWidth={2.4} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fine Policy</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#315F7B', display: 'block' }}>₹10.00</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per day overdue</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.65rem' }}
            placeholder={isStudent ? 'Search by book title or ISBN...' : 'Search by book title, student name, or email...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            className={`category-chip ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Fines ({fines.length})
          </button>
          <button
            type="button"
            className={`category-chip ${statusFilter === 'UNPAID' ? 'active' : ''}`}
            onClick={() => setStatusFilter('UNPAID')}
          >
            Unpaid ({unpaidFines.length})
          </button>
          <button
            type="button"
            className={`category-chip ${statusFilter === 'PAID' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PAID')}
          >
            Paid ({paidFines.length})
          </button>
        </div>
      </div>

      {/* Fines Table */}
      {filteredFines.length === 0 ? (
        <div className="empty-state">
          <Receipt className="empty-state-icon" />
          <h3 className="empty-state-title">No fine records found</h3>
          <p className="empty-state-desc">
            {fines.length === 0 
              ? 'Great news! You have no outstanding or historical fine records.'
              : 'No fine records match the selected status filter and search query.'}
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book Title</th>
                {!isStudent && <th>Student</th>}
                <th>Penalty Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFines.map((fine) => {
                const isPaid = fine.status === 'PAID';
                return (
                  <tr key={fine.id}>
                    <td style={{ fontWeight: 700, color: '#315F7B' }}>
                      {fine.bookTitle}
                    </td>
                    {!isStudent && (
                      <td>
                        <div style={{ fontWeight: 600, color: '#315F7B' }}>{fine.studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fine.studentEmail}</div>
                      </td>
                    )}
                    <td style={{ fontWeight: 800, fontSize: '1rem', color: isPaid ? 'var(--mint-text)' : 'var(--peach-text)' }}>
                      ₹{fine.amount?.toFixed(2)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Overdue loan penalty
                    </td>
                    <td>
                      <span className={`badge ${isPaid ? 'badge-paid' : 'badge-unpaid'}`}>
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td>
                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => setPayingFine(fine)}
                          className="btn btn-primary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          <CreditCard size={14} /> Pay Fine
                        </button>
                      ) : (
                        <span style={{ color: 'var(--mint-text)', fontSize: '0.825rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <CheckCircle2 size={15} /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Simulated Payment Gateway Modal */}
      {payingFine && (
        <div className="modal-backdrop" onClick={() => setPayingFine(null)}>
          <div className="modal-dialog" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Simulated Payment Gateway</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Test Simulation Mode
                </span>
              </div>
              <button 
                type="button" 
                onClick={() => setPayingFine(null)} 
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '0.5rem 0' }}>
              <div style={{
                background: 'var(--pastel-peach)',
                border: '1px solid rgba(192, 86, 33, 0.25)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                color: 'var(--peach-text)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Safe Test Sandbox:</strong> No actual financial transactions or bank debits occur. This simulates the payment receipt workflow.
                </span>
              </div>

              {/* Bill Details */}
              <div style={{ background: '#F8FAFD', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Book Title:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#315F7B' }}>{payingFine.bookTitle}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Penalty Charge:</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Overdue return fee</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, color: '#315F7B' }}>Total Payable:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--peach-text)' }}>₹{payingFine.amount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Select Test Payment Method</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPaymentMethod('card')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <CreditCard size={15} /> Test Card
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'upi' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPaymentMethod('upi')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <IndianRupee size={15} /> Test UPI
                  </button>
                </div>
              </div>

              {paymentMethod === 'card' ? (
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.825rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Simulated Card Number:</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#315F7B' }}>4111 •••• •••• 4242</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                    <span>Expires: 12/28</span>
                    <span>CVV: 123</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.825rem' }}>
                  <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Simulated VPA / UPI ID:</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: '#315F7B' }}>student@libriflow</div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => setPayingFine(null)} 
                className="btn btn-outline"
                disabled={isProcessingPayment}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmSimulatedPayment} 
                className="btn btn-primary"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 size={16} className="spin-animation" /> Processing Simulation...
                  </>
                ) : (
                  `Pay ₹${payingFine.amount?.toFixed(2)} (Simulated)`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Payment Receipt Modal */}
      {receiptModal && (
        <div className="modal-backdrop" onClick={() => setReceiptModal(null)}>
          <div className="modal-dialog" style={{ maxWidth: '420px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--pastel-mint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: 'var(--mint-text)'
            }}>
              <CheckCircle size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#315F7B', marginBottom: '0.25rem' }}>
              Payment Successful!
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Your overdue fine has been officially settled and marked as PAID in library records.
            </p>

            <div style={{
              background: '#F8FAFD',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.825rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.45rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Receipt No:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#315F7B' }}>{receiptModal.transactionId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time:</span>
                <span style={{ color: '#315F7B' }}>{receiptModal.paidAt}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Method:</span>
                <span style={{ color: '#315F7B' }}>{receiptModal.paymentMethod}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontWeight: 700, color: '#315F7B' }}>Amount Paid:</span>
                <span style={{ fontWeight: 800, color: 'var(--mint-text)', fontSize: '1rem' }}>₹{receiptModal.fine?.amount?.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReceiptModal(null)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              Done & Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fines;
