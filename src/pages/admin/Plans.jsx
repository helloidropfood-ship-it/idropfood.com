import React, { useState } from 'react';
import { useMockData } from '../../context/AppDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';

export const Plans = () => {
  const { currentAdmin, plans, updatePlans, createPlan } = useMockData();
  const isOwner = currentAdmin?.role === 'owner';

  // Modal / Add Plan State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [credits, setCredits] = useState('');
  const [price, setPrice] = useState('');
  const [validity, setValidity] = useState('30');
  const [error, setError] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleAddPlanSubmit = (e) => {
    e.preventDefault();
    if (!name || !credits || !price || !validity) {
      setError('Please fill in all required fields.');
      return;
    }
    createPlan(name, description, credits, price, validity);
    setIsAddOpen(false);
    // Reset form
    setName('');
    setDescription('');
    setCredits('');
    setPrice('');
    setValidity('30');
    setError('');
  };

  const handleToggleActive = (planId, currentStatus) => {
    if (!isOwner) return;
    updatePlans(planId, { active: !currentStatus });
  };

  const startEdit = (plan) => {
    setEditingId(plan.id);
    setEditPrice(plan.price.toString());
    setEditDesc(plan.description);
  };

  const saveEdit = (planId) => {
    updatePlans(planId, { price: parseFloat(editPrice), description: editDesc });
    setEditingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            Package Pricing Manager
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Configure credit bundles and prices for the iDropFood subscription portal.
          </p>
        </div>
        
        {isOwner && (
          <Button variant="accent" onClick={() => setIsAddOpen(true)}>
            Add New Package
          </Button>
        )}
      </div>

      {!isOwner && (
        <div
          style={{
            background: 'var(--warning-glow)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '0.88rem',
            color: 'var(--warning)'
          }}
        >
          🔒 <strong>Read-Only Mode:</strong> Only administrative roles with <strong>Owner</strong> level privileges are authorized to change packages, credits, or pricing.
        </div>
      )}

      {/* Grid of Plans */}
      <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {plans
          .sort((a,b) => a.display_order - b.display_order)
          .map(plan => {
            const isEditing = editingId === plan.id;
            return (
              <Card
                key={plan.id}
                hoverable={false}
                title={plan.name}
                subtitle={`Credits: ${plan.meal_credits} • Validity: ${plan.validity_days} Days`}
                footer={
                  isOwner ? (
                    <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(plan.id, plan.active)}
                        style={{
                          background: plan.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${plan.active ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-color)'}`,
                          color: plan.active ? 'var(--success)' : 'var(--text-muted)',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {plan.active ? '● Active' : '○ Inactive'}
                      </button>
                      
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="secondary" onClick={() => setEditingId(null)} size="sm" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                            Cancel
                          </Button>
                          <Button variant="primary" onClick={() => saveEdit(plan.id)} size="sm" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
                            Save
                          </Button>
                        </div>
                      ) : (
                        <Button variant="secondary" onClick={() => startEdit(plan)} size="sm" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                          Modify
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Badge variant={plan.active ? 'success' : 'secondary'} outline>
                      {plan.active ? 'Active' : 'Inactive'}
                    </Badge>
                  )
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  {isEditing ? (
                    <>
                      <FormInput
                        label="Price (PKR)"
                        type="number"
                        name="editPrice"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        required
                      />
                      <FormInput
                        label="Description"
                        type="textarea"
                        name="editDesc"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={2}
                      />
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                          Rs. {plan.price.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Total package cost
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {plan.description}
                      </p>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
      </div>

      {/* Add Plan Modal */}
      {isAddOpen && (
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
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              Add New Pricing Package
            </h3>

            <form onSubmit={handleAddPlanSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>⚠️ {error}</span>}

              <FormInput
                label="Package Name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Starter Pack"
                required
              />

              <div className="u-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormInput
                  label="Meal Credits"
                  name="credits"
                  type="number"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  placeholder="e.g. 5"
                  required
                />
                <FormInput
                  label="Price (PKR)"
                  name="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 2000"
                  required
                />
              </div>

              <FormInput
                label="Validity (Days)"
                name="validity"
                type="number"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                placeholder="30"
                required
              />

              <FormInput
                label="Description"
                name="description"
                type="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a summary of who this is ideal for..."
                rows={3}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent">
                  Create Package
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
