import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMockData } from '../context/AppDataContext';
import Button from '../components/Button';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import Badge from '../components/Badge';

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isRealSupabase,
    currentUser,
    currentAdmin,
    sendMagicLink,
    completeProfile,
    loginAdmin,
    adminUsers
  } = useMockData();
  const selectedPlanId = location.state?.selectedPlanId || '';

  // Auth/Email State
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Customer Profile Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [floor, setFloor] = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Handle Auth Errors from URL
  useEffect(() => {
    let errorDesc = null;
    if (location.hash.includes('error_description')) {
      const hashParams = new URLSearchParams(location.hash.substring(1));
      errorDesc = hashParams.get('error_description');
    } else if (location.search.includes('error_description')) {
      const searchParams = new URLSearchParams(location.search);
      errorDesc = searchParams.get('error_description');
    }

    if (errorDesc) {
      setError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
      setIsEmailSent(false);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Redirect if logged in and profile is complete
  useEffect(() => {
    if (currentUser && !currentUser.needsProfile) {
      if (selectedPlanId) {
        navigate('/dashboard', { state: { checkoutPlanId: selectedPlanId } });
      } else {
        navigate('/dashboard');
      }
    }
  }, [currentUser, navigate, selectedPlanId]);

  // Redirect if admin
  useEffect(() => {
    if (currentAdmin) {
      navigate('/admin/overview');
    }
  }, [currentAdmin, navigate]);

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendMagicLink(email);
      setIsEmailSent(true);
    } catch (err) {
      console.error('Magic Link Error:', err);
      let errorMsg = err.message || 'Failed to send magic link. Please try again.';
      if (errorMsg === '{}') {
        errorMsg = 'SMTP Error: Failed to send email. Check your Supabase Resend settings (e.g. unverified domain or invalid API key).';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!name || !phone || !floor || !department) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await completeProfile({
        name,
        phone,
        floor,
        department,
        delivery_notes: notes
      });
      // Redirect will be handled by useEffect
    } catch (err) {
      setError(err.message || 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRoleSelection = (role) => {
    loginAdmin(role);
    navigate('/admin/overview');
  };

  const renderLoginForm = () => (
    <form onSubmit={handleSendMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && (
        <div
          style={{
            background: 'var(--error-glow)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: 'var(--error)'
          }}
        >
          ⚠️ {error}
        </div>
      )}
      
      {isEmailSent ? (
        <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '2.5rem' }}>📧</div>
          <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Check your inbox</h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            We've sent a magic login link to <strong style={{ color: 'var(--accent)' }}>{email}</strong>. 
            Click the link in your email to instantly sign in and return here.
          </p>
          <Button type="button" variant="secondary" onClick={() => setIsEmailSent(false)} style={{ marginTop: '8px' }}>
            Try another email
          </Button>
        </div>
      ) : (
        <>
          <FormInput
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. name@company.com"
            helperText="We will email you a magic login link. No password required."
            required
            disabled={loading}
          />
          <Button type="submit" variant="accent" style={{ marginTop: '8px' }} disabled={loading}>
            {loading ? 'Sending link...' : 'Send Magic Login Link'}
          </Button>
        </>
      )}
    </form>
  );

  const renderProfileCompletionForm = () => (
    <form onSubmit={handleCompleteProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          fontSize: '0.82rem',
          color: 'var(--primary)',
          lineHeight: '1.5'
        }}
      >
        ℹ️ Almost there! Complete your delivery profile details for <strong>{currentUser?.email}</strong> to finish signing up.
      </div>

      {error && (
        <div
          style={{
            background: 'var(--error-glow)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            fontSize: '0.82rem',
            color: 'var(--error)'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <FormInput
        label="Name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Hammad Ali"
        required
        disabled={loading}
      />
      
      <FormInput
        label="WhatsApp Number"
        name="phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="e.g. 03001234567"
        helperText="Used for automated lobby drop notifications."
        required
        disabled={loading}
      />

      <div className="auth-form-row u-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <FormInput
          label="Office Floor"
          name="floor"
          type="select"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          placeholder="Select Floor"
          options={[
            { value: 'Ground Floor', label: 'Ground Floor' },
            { value: '1st Floor', label: '1st Floor' },
            { value: '2nd Floor', label: '2nd Floor' },
            { value: '3rd Floor', label: '3rd Floor' },
            { value: '4th Floor', label: '4th Floor' },
            { value: '5th Floor', label: '5th Floor' },
            { value: 'Mezzanine', label: 'Mezzanine' }
          ]}
          required
          disabled={loading}
        />
        <FormInput
          label="Department"
          name="department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Operation QA"
          required
          disabled={loading}
        />
      </div>

      <FormInput
        label="Specific Delivery Notes (Optional)"
        name="notes"
        type="textarea"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Leave at Lobby Desk A. Do not call, on night shift call."
        rows={2}
        disabled={loading}
      />

      <Button type="submit" variant="accent" style={{ marginTop: '8px' }} disabled={loading}>
        {loading ? 'Saving Profile...' : 'Save & Continue'}
      </Button>
    </form>
  );

  return (
    <div
      className="page-auth"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(circle at center, #0a0c10 0%, #030406 100%)',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            letterSpacing: '-0.02em'
          }}
        >
          iDrop<span style={{ color: 'var(--accent)' }}>Food</span>
        </span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Your Shift. Your Meal Drop.
        </p>
      </div>

      <div
        className="auth-cards-grid u-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          width: '100%',
          maxWidth: '840px',
          alignItems: 'start'
        }}
      >
        {/* Customer Login Card */}
        <Card 
          hoverable={false} 
          className="animate-slide-up delay-100" 
          title={currentUser?.needsProfile ? "Complete Profile" : "Customer Shift Portal"} 
          subtitle={currentUser?.needsProfile ? "Configure your delivery options." : "Enter your email to receive a magic login link."}
        >
          {currentUser?.needsProfile ? renderProfileCompletionForm() : renderLoginForm()}
        </Card>

        {/* Sandbox Admin Login Card (Hidden in Production) */}
        {!import.meta.env.PROD && (
          isRealSupabase ? (
            <Card
              hoverable={false}
              className="animate-slide-up delay-200"
              title="Dev Test Accounts"
              subtitle="Real Auth Mode (Local Dev Helper)"
              style={{ height: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Request a Magic Link using one of these test emails for local validation:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>owner@idropfood.com</span>
                      <Badge variant="accent">Owner</Badge>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>admin@idropfood.com</span>
                      <Badge variant="primary">Admin</Badge>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>operations@idropfood.com</span>
                      <Badge variant="success">Operations</Badge>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>customer.test1@idropfood.com</span>
                      <Badge variant="secondary" outline>Customer 1</Badge>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>customer.test2@idropfood.com</span>
                      <Badge variant="secondary" outline>Customer 2</Badge>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 500, lineHeight: '1.4' }}>
                    ⚠️ <strong>Seeding Required:</strong> After logging in with the magic link, you must run the development seed script to promote the auth user to the administrative role:
                  </p>
                  <code style={{ display: 'block', margin: '8px 0 0', padding: '6px 10px', background: '#000', color: '#38bdf8', borderRadius: '4px', fontSize: '0.72rem', wordBreak: 'break-all' }}>
                    -- Run seed_dev_admin_users.sql in your Supabase SQL Editor
                  </code>
                </div>
              </div>
            </Card>
          ) : (
            <Card
              hoverable={false}
              className="animate-slide-up delay-200"
              title="Sandbox Administration"
              subtitle="Testing Roles - Switch identity to test different workflow constraints."
              style={{ height: '100%' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Since database verification is mock, you can select one of the following roles to test the administrative workflows, payment approvals, kitchen manifests, and settings controls.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div
                    onClick={() => handleAdminRoleSelection('owner')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Owner Role</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Full access to pricing plans, settings, and approvals.</p>
                    </div>
                    <Badge variant="accent">Owner</Badge>
                  </div>

                  <div
                    onClick={() => handleAdminRoleSelection('admin')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin Role</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Manage windows, menu dishes, and payment proofs.</p>
                    </div>
                    <Badge variant="primary">Admin</Badge>
                  </div>

                  <div
                    onClick={() => handleAdminRoleSelection('operations')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--success)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Operations Role</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>View preparation lists, delivery rosters, and mark logs.</p>
                    </div>
                    <Badge variant="success">Ops</Badge>
                  </div>
                </div>
              </div>
            </Card>
          )
        )}
      </div>
    </div>
  );
};

export default AuthPage;
