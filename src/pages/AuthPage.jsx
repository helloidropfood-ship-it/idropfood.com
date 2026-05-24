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
    signInWithOAuth,
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

  const handleOAuthLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      console.error('OAuth Error:', err);
      setError(err.message || `Failed to sign in with ${provider}.`);
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
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', marginBottom: '16px' }}>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'white', color: '#333' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => handleOAuthLogin('apple')}
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#000', color: '#fff', border: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.04 2.26-.74 3.58-.8 1.48-.06 2.76.6 3.48 1.76-3.02 1.77-2.52 5.86.37 7.07-.65 1.62-1.57 3.19-2.51 4.14M12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25"/></svg>
              Apple
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', color: 'var(--text-muted)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 12px', fontSize: '0.85rem' }}>or continue with email</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

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
      {/* Return to Main Page Link */}
      <div 
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'color var(--transition-fast)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Return to Home
      </div>

      {/* Brand Header */}
      <div style={{ textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={() => navigate('/')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.3))' }}>
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path d="M16 2C9.37 8.63 6 13.5 6 18C6 23.52 10.48 28 16 28C21.52 28 26 23.52 26 18C26 13.5 22.63 8.63 16 2ZM16 22C13.79 22 12 20.21 12 18C12 16.2 13.5 13.8 16 10.6C18.5 13.8 20 16.2 20 18C20 20.21 18.21 22 16 22Z" fill="url(#logo-grad)" />
          </svg>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)'
            }}
          >
            iDrop<span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>Food</span><span style={{ color: 'var(--accent)' }}>.</span>
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
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
