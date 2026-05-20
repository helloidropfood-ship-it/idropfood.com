import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import StatusPill from '../../components/StatusPill';

export const Approvals = () => {
  const {
    currentAdmin,
    users,
    plans,
    purchases,
    paymentProofs,
    approvePurchase,
    rejectPurchase
  } = useMockData();

  // Rejection Notes Modal State
  const [rejectingPurchaseId, setRejectingPurchaseId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [modalError, setModalError] = useState('');

  // Zoom Receipt Modal State
  const [zoomUrl, setZoomUrl] = useState('');

  const pendingProofs = paymentProofs.filter(p => p.status === 'pending');
  const reviewedProofs = paymentProofs.filter(p => p.status !== 'pending');

  const handleApprove = (purchaseId) => {
    if (!currentAdmin) return;
    if (window.confirm("Approve this payment? Credits will load immediately and associated draft bookings will schedule.")) {
      approvePurchase(purchaseId, currentAdmin.id);
    }
  };

  const handleOpenReject = (purchaseId) => {
    setRejectingPurchaseId(purchaseId);
    setRejectNotes('');
    setModalError('');
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectNotes) {
      setModalError('Please enter a reason for rejection (e.g. invalid receipt, incorrect amount).');
      return;
    }
    rejectPurchase(rejectingPurchaseId, currentAdmin.id, rejectNotes);
    setRejectingPurchaseId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 className="admin-page-title" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
          Payment Verification Queue
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Verify incoming manual bank receipts, EasyPaisa screenshot deposits, and credit activations.
        </p>
      </div>

      {/* Pending approvals section */}
      <Card title="Awaiting Manual Approvals" subtitle={`${pendingProofs.length} transactions pending review.`} hoverable={false}>
        {pendingProofs.length === 0 ? (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
            🎉 Verification queue is clear. No pending payments.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingProofs.map(proof => {
              const purchase = purchases.find(p => p.id === proof.purchase_id);
              const user = purchase ? users.find(u => u.id === purchase.user_id) : null;
              const plan = purchase ? plans.find(p => p.id === purchase.plan_id) : null;

              return (
                <div
                  key={proof.id}
                  className="approval-card u-grid"
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.01)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '20px',
                    alignItems: 'start'
                  }}
                >
                  {/* Receipt image thumbnail */}
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      Payment Receipt Preview
                    </span>
                    <img
                      src={proof.proof_image_url}
                      alt="Receipt Screenshot"
                      onClick={() => setZoomUrl(proof.proof_image_url)}
                      style={{
                        width: '120px',
                        height: '160px',
                        objectFit: 'contain',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        cursor: 'zoom-in',
                        background: '#060709'
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      🔍 Click to inspect detail
                    </span>
                  </div>

                  {/* Customer and package details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Customer Details</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{user?.name}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>📞 {user?.phone}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>🏢 {user?.floor} | {user?.department}</span>
                  </div>

                  {/* Payment numbers details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.88rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Transaction Details</span>
                    <div>Package: <strong>{plan?.name}</strong></div>
                    <div>Ref: <code>{proof.transaction_reference}</code></div>
                    <div>Method: <strong>{proof.payment_method.toUpperCase()}</strong></div>
                    <div>Amount: <strong style={{ color: 'var(--accent)' }}>Rs. {proof.submitted_amount.toLocaleString()}</strong></div>
                  </div>

                  {/* Action Review Buttons */}
                  <div className="approval-card-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignSelf: 'center' }}>
                    <Button variant="primary" onClick={() => handleApprove(proof.purchase_id)} style={{ width: '100%' }}>
                      Approve Payment
                    </Button>
                    <Button variant="danger" onClick={() => handleOpenReject(proof.purchase_id)} style={{ width: '100%' }}>
                      Reject Payment
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Historic verifications logs */}
      <Card title="Reviewed Submissions Log" subtitle="History of payment decisions." hoverable={false}>
        {reviewedProofs.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
            No transaction records processed yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {reviewedProofs.map(proof => {
              const purchase = purchases.find(p => p.id === proof.purchase_id);
              const user = purchase ? users.find(u => u.id === purchase.user_id) : null;
              const plan = purchase ? plans.find(p => p.id === purchase.plan_id) : null;

              return (
                <div
                  key={proof.id}
                  className="review-log-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255,255,255,0.005)',
                    fontSize: '0.85rem',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <strong>{user?.name}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}> • {plan?.name} • Rs. {proof.submitted_amount.toLocaleString()}</span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Reference: {proof.transaction_reference} • Reviewed on: {new Date(proof.reviewed_at).toLocaleDateString()}
                    </p>
                    {proof.admin_notes && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '4px', fontStyle: 'italic' }}>
                        Rejection reason: {proof.admin_notes}
                      </p>
                    )}
                  </div>

                  <StatusPill status={proof.status} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Rejection Notes Input Modal */}
      {rejectingPurchaseId && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'rgba(3, 4, 6, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setRejectingPurchaseId(null)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '440px', padding: '24px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, marginBottom: '12px' }}>
              Confirm Payment Rejection
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Specify the reason for payment denial. This is shown to the user in their activity history.
            </p>

            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {modalError && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>⚠️ {modalError}</span>}

              <FormInput
                label="Rejection Reason Notes"
                name="rejectNotes"
                type="textarea"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="e.g. Uploaded screenshot is illegible. Re-submit transaction proof showing date/reference."
                rows={3}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Button variant="secondary" onClick={() => setRejectingPurchaseId(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="danger">
                  Reject & Cancel Bookings
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image zoom modal overlay */}
      {zoomUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1100,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            cursor: 'zoom-out'
          }}
          onClick={() => setZoomUrl('')}
        >
          <img
            src={zoomUrl}
            alt="Enlarged Receipt"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 'var(--radius-md)'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Approvals;
