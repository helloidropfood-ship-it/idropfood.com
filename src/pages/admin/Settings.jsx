import React, { useState, useEffect } from 'react';
import { useMockData } from '../../context/AppDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';

export const Settings = () => {
  const { currentAdmin, paymentSettings, updateGlobalSettings } = useMockData();
  const hasAccess = ['owner', 'admin'].includes(currentAdmin?.role);

  // Form State
  const [bankName, setBankName] = useState('');
  const [bankTitle, setBankTitle] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [raastId, setRaastId] = useState('');
  const [jazzNumber, setJazzNumber] = useState('');
  const [epNumber, setEpNumber] = useState('');
  const [instructionText, setInstructionText] = useState('');
  const [trialActive, setTrialActive] = useState(true);
  const [launchMessage, setLaunchMessage] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (paymentSettings) {
      setBankName(paymentSettings.bank_name || '');
      setBankTitle(paymentSettings.bank_account_title || '');
      setBankNumber(paymentSettings.bank_account_number || '');
      setBankIban(paymentSettings.bank_iban || '');
      setRaastId(paymentSettings.raast_id || '');
      setJazzNumber(paymentSettings.jazzcash_number || '');
      setEpNumber(paymentSettings.easypaisa_number || '');
      setInstructionText(paymentSettings.instruction_text || '');
      setTrialActive(paymentSettings.trial_drop_active);
      setLaunchMessage(paymentSettings.launch_messaging || '');
      setWhatsapp(paymentSettings.contact_whatsapp || '');
    }
  }, [paymentSettings]);

  if (!hasAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800 }}>
          System Settings
        </h2>
        <Card hoverable={false} title="Access Unauthorized">
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            🔐 administrative roles with <strong>Operations</strong> level permissions are not allowed to view or modify general business bank details, instruction guides, or feature toggles.
          </p>
        </Card>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    updateGlobalSettings({
      bank_name: bankName,
      bank_account_title: bankTitle,
      bank_account_number: bankNumber,
      bank_iban: bankIban,
      raast_id: raastId,
      jazzcash_number: jazzNumber,
      easypaisa_number: epNumber,
      instruction_text: instructionText,
      trial_drop_active: trialActive,
      launch_messaging: launchMessage,
      contact_whatsapp: whatsapp
    });
    setSuccess('Settings saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
          System Settings
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configure bank account credentials, checkout manuals, launch strip notices, and features toggles.
        </p>
      </div>

      {success && (
        <div style={{ background: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--success)', fontSize: '0.88rem' }}>
          ✅ {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Trial Drop Feature Toggle */}
        <Card title="Feature Toggles" subtitle="Control visibility of MVP scheduling options.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>Trial Drop Package Active</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Toggle to enable/disable the 1-meal Trial Drop offer for new users.
              </p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={trialActive}
                onChange={(e) => setTrialActive(e.target.checked)}
                style={{
                  width: '50px',
                  height: '26px',
                  appearance: 'none',
                  background: trialActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  position: 'relative',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                className="toggle-switch-checkbox"
              />
              <style>{`
                .toggle-switch-checkbox::before {
                  content: '';
                  position: absolute;
                  top: 2px;
                  left: ${trialActive ? '26px' : '2px'};
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: white;
                  transition: all 0.3s cubic-bezier(0.1, 0.8, 0.2, 1);
                }
              `}</style>
            </label>
          </div>
        </Card>

        {/* Bank Credentials */}
        <Card title="Manual Payment Gateways" subtitle="Bank accounts details displayed to users in the checkout portal.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FormInput
                label="Bank Name"
                name="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Meezan Bank Ltd."
              />
              <FormInput
                label="Account Title"
                name="bankTitle"
                value={bankTitle}
                onChange={(e) => setBankTitle(e.target.value)}
                placeholder="e.g. iDropFood"
              />
            </div>

            <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FormInput
                label="Account Number"
                name="bankNumber"
                value={bankNumber}
                onChange={(e) => setBankNumber(e.target.value)}
                placeholder="e.g. 1201-123456"
              />
              <FormInput
                label="IBAN Code"
                name="bankIban"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                placeholder="e.g. PK00MEZN00..."
              />
            </div>

            <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <FormInput
                label="Raast Phone ID"
                name="raastId"
                value={raastId}
                onChange={(e) => setRaastId(e.target.value)}
                placeholder="e.g. idropfood@meezan"
              />
              <FormInput
                label="JazzCash Number"
                name="jazzNumber"
                value={jazzNumber}
                onChange={(e) => setJazzNumber(e.target.value)}
                placeholder="e.g. 0300-1234567"
              />
              <FormInput
                label="EasyPaisa Number"
                name="epNumber"
                value={epNumber}
                onChange={(e) => setEpNumber(e.target.value)}
                placeholder="e.g. 0345-1234567"
              />
            </div>

            <FormInput
              label="Checkout Subtext Instructions"
              name="instructionText"
              type="textarea"
              value={instructionText}
              onChange={(e) => setInstructionText(e.target.value)}
              placeholder="Provide directions on payment reference inputs, time frames..."
              rows={3}
            />
          </div>
        </Card>

        {/* Global branding details */}
        <Card title="Marketing & Support" subtitle="Configure notice headlines and support routes.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <FormInput
              label="Global Launch Notice Headline"
              name="launchMessage"
              value={launchMessage}
              onChange={(e) => setLaunchMessage(e.target.value)}
              placeholder="e.g. Special Offer: 20% discount on first core pack!"
            />

            <FormInput
              label="Support WhatsApp Number"
              name="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="e.g. 0321-9876543"
              helperText="Displayed in customer footer links."
            />
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button type="submit" variant="accent" style={{ padding: '12px 32px' }}>
            Save Settings Profile
          </Button>
        </div>

      </form>
    </div>
  );
};

export default Settings;
