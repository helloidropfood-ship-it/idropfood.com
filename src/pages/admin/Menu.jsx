import React, { useState } from 'react';
import { useMockData } from '../../context/AppDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';

export const Menu = () => {
  const { 
    dropWindows, menuItems, assignMenu, uploadMenuImage, 
    mealTemplates, createMealTemplate, updateMealTemplate, deleteMealTemplate 
  } = useMockData();

  const [activeTab, setActiveTab] = useState('allocations'); // 'allocations' | 'templates'

  // Allocation Modal State
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Custom Meal Data for Allocation overrides or Template creation
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const resetForm = () => {
    setMealName('');
    setDescription('');
    setAllergens('');
    setImageUrl('');
    setActive(true);
    setSelectedTemplateId('');
    setError('');
  };

  const handleOpenAssign = (win) => {
    setSelectedWindow(win);
    const existingMenu = menuItems.find(m => m.drop_window_id === win.id);
    if (existingMenu) {
      // Try to find if this matches an existing template
      const matchedTemplate = mealTemplates.find(t => t.meal_name === existingMenu.meal_name);
      if (matchedTemplate) {
        setSelectedTemplateId(matchedTemplate.id);
      } else {
        setSelectedTemplateId('custom');
      }
      setMealName(existingMenu.meal_name);
      setDescription(existingMenu.description);
      setAllergens(existingMenu.allergens || '');
      setImageUrl(existingMenu.image_url || '');
      setActive(existingMenu.active !== false);
    } else {
      resetForm();
    }
  };

  const handleTemplateSelectionChange = (e) => {
    const val = e.target.value;
    setSelectedTemplateId(val);
    if (val && val !== 'custom') {
      const t = mealTemplates.find(temp => temp.id === val);
      if (t) {
        setMealName(t.meal_name);
        setDescription(t.description);
        setAllergens(t.allergens || '');
        setImageUrl(t.image_url || '');
        setActive(t.active !== false);
      }
    } else if (val === 'custom') {
      resetForm();
      setSelectedTemplateId('custom');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Meal image exceeds the 5MB limit. Please upload a smaller image.');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const fileExt = file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      setError('Only JPG, JPEG, PNG, and WEBP image files are allowed.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    try {
      const url = await uploadMenuImage(file);
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      setError('Failed to upload image. Please try again.');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!mealName || !description) {
      setError('Please enter meal name and description.');
      return;
    }
    assignMenu(selectedWindow.id, mealName, description, allergens, imageUrl, active);
    setSelectedWindow(null);
  };

  // --- TEMPLATE MANAGEMENT ---

  const handleOpenTemplateModal = (template = null) => {
    if (template) {
      setEditingTemplateId(template.id);
      setMealName(template.meal_name);
      setDescription(template.description);
      setAllergens(template.allergens || '');
      setImageUrl(template.image_url || '');
      setActive(template.active !== false);
    } else {
      setEditingTemplateId(null);
      resetForm();
    }
    setIsTemplateModalOpen(true);
  };

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    if (!mealName || !description) {
      setError('Please enter meal name and description.');
      return;
    }
    
    const payload = {
      meal_name: mealName,
      description,
      allergens,
      image_url: imageUrl,
      active
    };

    try {
      if (editingTemplateId) {
        await updateMealTemplate(editingTemplateId, payload);
      } else {
        await createMealTemplate(payload);
      }
      setIsTemplateModalOpen(false);
    } catch (err) {
      setError('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm("Are you sure you want to delete this template? Active drops using this meal will not be affected.")) {
      await deleteMealTemplate(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
          Menu Manager
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Manage your re-usable meal templates and allocate them to specific drop windows.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '24px' }}>
        <button 
          onClick={() => setActiveTab('allocations')}
          style={{ background: 'transparent', border: 'none', padding: '0 0 12px 0', color: activeTab === 'allocations' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, borderBottom: activeTab === 'allocations' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
        >
          Upcoming Allocations
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          style={{ background: 'transparent', border: 'none', padding: '0 0 12px 0', color: activeTab === 'templates' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, borderBottom: activeTab === 'templates' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
        >
          Meal Templates
        </button>
      </div>

      {activeTab === 'allocations' && (
        <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {[...dropWindows]
            .sort((a,b) => new Date(a.date) - new Date(b.date))
            .map(win => {
              const menu = menuItems.find(m => m.drop_window_id === win.id);
              const dateStr = new Date(win.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <Card
                  key={win.id}
                  hoverable={false}
                  title={`${dateStr} — ${win.window_name}`}
                  subtitle={`Duration: ${win.start_time.substring(0, 5)} - ${win.end_time.substring(0, 5)}`}
                  footer={
                    <Button variant="secondary" onClick={() => handleOpenAssign(win)} size="sm">
                      {menu ? 'Update Meal' : 'Assign Meal'}
                    </Button>
                  }
                >
                  {menu ? (
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'start' }}>
                      {menu.image_url && (
                        <img
                          src={menu.image_url}
                          alt={menu.meal_name}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            border: '1px solid var(--border-color)'
                          }}
                        />
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{menu.meal_name}</strong>
                          {menu.active === false && <Badge variant="secondary" outline>Inactive</Badge>}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{menu.description}</p>
                        {menu.allergens && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            ⚠️ Allergens: <strong>{menu.allergens}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px 0', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        No menu item allocated. Users cannot book this shift until a meal is assigned.
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      )}

      {activeTab === 'templates' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Button onClick={() => handleOpenTemplateModal()} variant="primary">
              + New Meal Template
            </Button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {mealTemplates.map(template => (
              <Card key={template.id} hoverable={false} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  {template.image_url ? (
                    <img src={template.image_url} alt={template.meal_name} style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                      <span style={{ fontSize: '24px' }}>🍽️</span>
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{template.meal_name}</h4>
                    {template.active === false && <Badge variant="secondary" outline style={{ marginBottom: '8px' }}>Inactive</Badge>}
                    {template.allergens && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        ⚠️ {template.allergens}
                      </span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>
                  {template.description}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <Button variant="secondary" size="sm" onClick={() => handleOpenTemplateModal(template)} style={{ flex: 1 }}>Edit</Button>
                  <Button variant="secondary" size="sm" onClick={() => handleDeleteTemplate(template.id)} style={{ flex: 1, color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>Delete</Button>
                </div>
              </Card>
            ))}
            {mealTemplates.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: 'var(--bg-surface-solid)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <p style={{ color: 'var(--text-muted)' }}>No meal templates defined yet.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Assign Allocation Modal */}
      {selectedWindow && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(3, 4, 6, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedWindow(null)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
              Assign Shift Meal
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Allocating for drop on {new Date(selectedWindow.date).toLocaleDateString()} ({selectedWindow.window_name})
            </p>

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>⚠️ {error}</span>}

              <div className="form-group">
                <label className="form-label">Select Meal Template</label>
                <select 
                  className="form-input" 
                  value={selectedTemplateId} 
                  onChange={handleTemplateSelectionChange}
                >
                  <option value="" disabled>-- Choose a Template --</option>
                  <option value="custom">+ Create Custom Meal for this Drop</option>
                  {mealTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.meal_name}</option>
                  ))}
                </select>
              </div>

              {(selectedTemplateId || mealName) && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <FormInput label="Meal Name" name="mealName" value={mealName} onChange={(e) => setMealName(e.target.value)} required />
                  <FormInput label="Meal Description" name="description" type="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required />
                  <FormInput label="Allergens" name="allergens" value={allergens} onChange={(e) => setAllergens(e.target.value)} />
                  
                  <div className="form-group">
                    <label className="form-label">Meal Image {uploading && <span style={{ color: 'var(--accent)' }}>(Uploading...)</span>}</label>
                    {imageUrl && (
                      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                        <img src={imageUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setImageUrl('')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}>✕</button>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="form-input" style={{ padding: '8px' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setSelectedWindow(null)}>Cancel</Button>
                <Button type="submit" variant="accent">Save Allocation</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Create/Edit Modal */}
      {isTemplateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(3, 4, 6, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsTemplateModalOpen(false)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              {editingTemplateId ? 'Edit Meal Template' : 'New Meal Template'}
            </h3>

            <form onSubmit={handleTemplateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>⚠️ {error}</span>}

              <FormInput label="Template / Meal Name" name="mealName" value={mealName} onChange={(e) => setMealName(e.target.value)} required />
              <FormInput label="Description / Ingredients" name="description" type="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
              <FormInput label="Allergens (Comma separated)" name="allergens" value={allergens} onChange={(e) => setAllergens(e.target.value)} />
              
              <div className="form-group">
                <label className="form-label">Default Image {uploading && <span style={{ color: 'var(--accent)' }}>(Uploading...)</span>}</label>
                {imageUrl && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
                    <img src={imageUrl} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                    <button type="button" onClick={() => setImageUrl('')} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} className="form-input" style={{ padding: '8px' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="template-active" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }} />
                <label htmlFor="template-active" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Template Active</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="accent">Save Template</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
