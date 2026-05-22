import React, { useState } from 'react';
import { useMockData } from '../../context/AppDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';

export const Menu = () => {
  const { dropWindows, menuItems, assignMenu, uploadMenuImage } = useMockData();

  // Menu Modal State
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [active, setActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenAssign = (win) => {
    setSelectedWindow(win);
    const existingMenu = menuItems.find(m => m.drop_window_id === win.id);
    if (existingMenu) {
      setMealName(existingMenu.meal_name);
      setDescription(existingMenu.description);
      setAllergens(existingMenu.allergens || '');
      setImageUrl(existingMenu.image_url || '');
      setActive(existingMenu.active !== false);
    } else {
      setMealName('');
      setDescription('');
      setAllergens('');
      setImageUrl('');
      setActive(true);
    }
    setError('');
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    // 5MB Size Limit
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Meal image exceeds the 5MB limit. Please upload a smaller image.');
      e.target.value = '';
      return;
    }

    // Format Restrictions: JPG, JPEG, PNG, WEBP
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
          Menu Allocations Manager
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Assign daily corporate meal options to specific shift drop windows.
        </p>
      </div>

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

      {/* Assign Modal */}
      {selectedWindow && (
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
          onClick={() => setSelectedWindow(null)}
        >
          <div
            className="glass-panel"
            style={{ width: '100%', maxWidth: '480px', padding: '24px', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
              Assign Shift Meal
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Allocating for drop on {new Date(selectedWindow.date).toLocaleDateString()} ({selectedWindow.window_name})
            </p>

            <form onSubmit={handleAssignSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>⚠️ {error}</span>}

              <FormInput
                label="Meal Name"
                name="mealName"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="e.g. Teriyaki Glazed Chicken Bowl"
                required
              />

              <FormInput
                label="Meal Description / Ingredients"
                name="description"
                type="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe key ingredients, preparation styles..."
                rows={3}
                required
              />

              <FormInput
                label="Allergens (Comma separated)"
                name="allergens"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                placeholder="e.g. Soy, Gluten, Peanuts"
              />

              <div className="form-group">
                <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
                  Meal Image {uploading && <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginLeft: '8px' }}>(Uploading...)</span>}
                </label>
                {imageUrl && (
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
                    <img
                      src={imageUrl}
                      alt="Meal Preview"
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        border: '1px solid var(--border-color)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--error)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="form-input"
                  style={{
                    padding: '8px',
                    height: 'auto',
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                <input
                  id="menu-active-checkbox"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: 'var(--accent)'
                  }}
                />
                <label htmlFor="menu-active-checkbox" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', cursor: 'pointer', userSelect: 'none' }}>
                  Meal Available for Booking (Active)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setSelectedWindow(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="accent">
                  Save Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
