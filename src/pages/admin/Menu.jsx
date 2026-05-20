import React, { useState } from 'react';
import { useMockData } from '../../context/MockDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';

export const Menu = () => {
  const { dropWindows, menuItems, assignMenu } = useMockData();

  // Menu Modal State
  const [selectedWindow, setSelectedWindow] = useState(null);
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [allergens, setAllergens] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleOpenAssign = (win) => {
    setSelectedWindow(win);
    const existingMenu = menuItems.find(m => m.drop_window_id === win.id);
    if (existingMenu) {
      setMealName(existingMenu.meal_name);
      setDescription(existingMenu.description);
      setAllergens(existingMenu.allergens || '');
      setImageUrl(existingMenu.image_url || '');
    } else {
      setMealName('');
      setDescription('');
      setAllergens('');
      setImageUrl('');
    }
    setError('');
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!mealName || !description) {
      setError('Please enter meal name and description.');
      return;
    }
    assignMenu(selectedWindow.id, mealName, description, allergens, imageUrl);
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
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{menu.meal_name}</strong>
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

              <FormInput
                label="Meal Image URL (Optional)"
                name="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
              />

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
