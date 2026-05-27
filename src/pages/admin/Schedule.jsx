import React, { useState } from 'react';
import { useMockData } from '../../context/AppDataContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import Badge from '../../components/Badge';

export const Schedule = () => {
  const { 
    dropWindows, createDropWindow, updateDropWindow,
    fixedDropWindows, createFixedWindow, updateFixedWindow, deleteFixedWindow 
  } = useMockData();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'templates'
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [selectedDrops, setSelectedDrops] = useState([]);
  
  // Specific Drops State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [date, setDate] = useState('');
  const [windowName, setWindowName] = useState('Day Drop');
  const [startTime, setStartTime] = useState('12:30');
  const [endTime, setEndTime] = useState('14:00');
  const [capacity, setCapacity] = useState('20');
  const [cutoffTime, setCutoffTime] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [selectedMealId, setSelectedMealId] = useState('');
  const [error, setError] = useState('');

  // Extract unique meals for the dropdown
  const { menuItems } = useMockData();
  const uniqueMeals = Array.from(new Map((menuItems || []).map(m => [m.meal_name, m])).values());

  // Fixed Templates State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    id: null,
    window_name: '',
    subtitle: '',
    display_time: '',
    description: '',
    display_order: 1
  });

  // Calendar Modal State
  const [selectedDateObj, setSelectedDateObj] = useState(null);

  // Calendar Helpers
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  const getDaysArray = () => {
    const days = [];
    // Padding for first week
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentYear, currentMonth, i));
    }
    return days;
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate);
    if (selectedDate) {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      setCutoffTime(`${prevDateStr}T20:00`); 
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!date || !windowName || !startTime || !endTime || !capacity || !cutoffTime) {
      setError('Please fill in all fields.');
      return;
    }
    const formattedStart = `${startTime}:00`;
    const formattedEnd = `${endTime}:00`;

    // Prepare drops array
    const dropsToCreate = [];
    const baseDate = new Date(date);
    const baseCutoff = new Date(cutoffTime);
    
    const count = repeatWeekly ? parseInt(repeatWeeks) : 1;
    
    for (let i = 0; i < count; i++) {
      const dropDate = new Date(baseDate);
      dropDate.setDate(dropDate.getDate() + (i * 7));
      
      const dropCutoff = new Date(baseCutoff);
      dropCutoff.setDate(dropCutoff.getDate() + (i * 7));
      
      dropsToCreate.push({
        date: dropDate.toISOString().split('T')[0],
        window_name: windowName,
        start_time: formattedStart,
        end_time: formattedEnd,
        capacity: parseInt(capacity),
        cutoff_time: dropCutoff.toISOString(),
        status: 'open',
        active: true
      });
    }

    let mealData = null;
    if (selectedMealId) {
      const existingMeal = uniqueMeals.find(m => m.id === selectedMealId);
      if (existingMeal) mealData = existingMeal;
    }

    try {
      await createDropWindowsBatch(dropsToCreate, mealData);
      setIsAddOpen(false);
      
      // Reset
      setDate('');
      setWindowName('Day Drop');
      setStartTime('12:30');
      setEndTime('14:00');
      setCapacity('20');
      setCutoffTime('');
      setRepeatWeekly(false);
      setRepeatWeeks(4);
      setSelectedMealId('');
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to create drops.');
    }
  };

  const handleTemplateSubmit = (e) => {
    e.preventDefault();
    if (!templateForm.window_name || !templateForm.display_time) return;

    if (templateForm.id) {
      updateFixedWindow(templateForm.id, templateForm);
    } else {
      createFixedWindow(templateForm);
    }
    setIsTemplateModalOpen(false);
  };

  const openTemplateModal = (template = null) => {
    if (template) {
      setTemplateForm(template);
    } else {
      setTemplateForm({ id: null, window_name: '', subtitle: '', display_time: '', description: '', display_order: fixedDropWindows.length + 1 });
    }
    setIsTemplateModalOpen(true);
  };

  const handleSelectDrop = (dropId) => {
    setSelectedDrops(prev => 
      prev.includes(dropId) ? prev.filter(id => id !== dropId) : [...prev, dropId]
    );
  };

  const handleSelectGroup = (drops) => {
    const dropIds = drops.map(d => d.id);
    const allSelected = dropIds.every(id => selectedDrops.includes(id));
    
    if (allSelected) {
      setSelectedDrops(prev => prev.filter(id => !dropIds.includes(id)));
    } else {
      setSelectedDrops(prev => [...new Set([...prev, ...dropIds])]);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedDrops.length === 0) return;
    
    try {
      if (action === 'delete') {
        if (window.confirm(`Are you sure you want to completely delete ${selectedDrops.length} drop(s)?`)) {
          // Use the mock data context methods
          deleteDropWindowsBatch(selectedDrops);
          setSelectedDrops([]);
        }
      } else if (action === 'enable') {
        updateDropWindowsBatch(selectedDrops, { active: true });
        setSelectedDrops([]);
      } else if (action === 'disable') {
        updateDropWindowsBatch(selectedDrops, { active: false });
        setSelectedDrops([]);
      }
    } catch (err) {
      alert(err.message || 'Bulk action failed');
    }
  };

  // Rendering
  const renderCalendarView = () => {
    const days = getDaysArray();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{today.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' }}>
          {weekdays.map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', paddingBottom: '8px' }}>
              {day}
            </div>
          ))}
          
          {days.map((dateObj, idx) => {
            if (!dateObj) return <div key={`empty-${idx}`} />;
            
            const dateStr = dateObj.toISOString().split('T')[0];
            const isToday = dateStr === today.toISOString().split('T')[0];
            const dayDrops = dropWindows.filter(w => w.date === dateStr);
            
            return (
              <div 
                key={dateStr}
                onClick={() => setSelectedDateObj(dateObj)}
                style={{
                  minHeight: '100px',
                  background: isToday ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
                  border: isToday ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'background var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isToday) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                }}
              >
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--text-secondary)' }}>
                  {dateObj.getDate()}
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                  {dayDrops.map(drop => (
                    <div 
                      key={drop.id} 
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '4px 6px', 
                        background: drop.window_name === 'Day Drop' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: drop.window_name === 'Day Drop' ? '#818cf8' : '#fbbf24',
                        borderRadius: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {drop.window_name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDropCard = (win) => {
    const cutoffDate = new Date(win.cutoff_time);
    const isSelected = selectedDrops.includes(win.id);
    
    return (
      <div key={win.id} style={{ background: isSelected ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-surface-solid)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => handleSelectDrop(win.id)}
            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {new Date(win.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <Badge variant={win.window_name === 'Day Drop' ? 'primary' : 'accent'} outline>{win.window_name}</Badge>
              {!win.active && <Badge variant="secondary">Disabled</Badge>}
            </div>
          
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span>⏰ Duration: <strong>{win.start_time.substring(0, 5)} - {win.end_time.substring(0, 5)}</strong></span>
            <span>👥 Booked: <strong>{win.booked_count} / {win.capacity}</strong> slots</span>
          </div>

          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            🛑 Cutoff locking time: <strong>{cutoffDate.toLocaleString()}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
          <FormInput
            label="Slot Status"
            name="status"
            type="select"
            value={win.status}
            onChange={(e) => updateDropWindow(win.id, { status: e.target.value })}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'locked', label: 'Locked' },
              { value: 'full', label: 'Full' },
              { value: 'completed', label: 'Completed' },
              { value: 'hidden', label: 'Hidden' },
              { value: 'cancelled', label: 'Cancelled' }
            ]}
            style={{ margin: 0, padding: '8px 12px', fontSize: '0.8rem' }}
          />

          <button
            onClick={() => updateDropWindow(win.id, { active: !win.active })}
            style={{
              background: win.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${win.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              color: win.active ? 'var(--success)' : 'var(--error)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
              height: '38px'
            }}
          >
            {win.active ? 'Disable' : 'Enable'}
          </button>
          
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to completely delete this drop window and its assigned menu? This action cannot be undone.")) {
                deleteDropWindow(win.id);
              }
            }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
              height: '38px',
              transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const renderUpcomingList = () => {
    // Group drops by "Window Name - Day of Week"
    const groupedDrops = {};
    const sortedDrops = [...dropWindows].sort((a,b) => new Date(a.date) - new Date(b.date));
    
    sortedDrops.forEach(win => {
      const d = new Date(win.date);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const key = `${win.window_name}s - ${dayName}s`;
      
      if (!groupedDrops[key]) {
        groupedDrops[key] = [];
      }
      groupedDrops[key].push(win);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.keys(groupedDrops).length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>No upcoming drop windows scheduled.</p>
        )}
        
        {Object.entries(groupedDrops).map(([groupName, drops]) => (
          <div key={groupName} style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={drops.length > 0 && drops.every(d => selectedDrops.includes(d.id))}
                  onChange={() => handleSelectGroup(drops)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{groupName}</h3>
              </div>
              <Badge variant="secondary">{drops.length} {drops.length === 1 ? 'Drop' : 'Drops'}</Badge>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {drops.map(win => renderDropCard(win))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTemplates = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--primary)' }}>
        ℹ️ These templates control the "Fixed Drop Windows" advertised on the public landing page. They tell customers what regular delivery slots are available.
      </div>
      
      {fixedDropWindows.sort((a,b) => a.display_order - b.display_order).map(template => (
        <div key={template.id} style={{ background: 'var(--bg-surface-solid)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{template.window_name}</h4>
              <Badge variant="accent" outline>{template.display_time}</Badge>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>{template.subtitle}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{template.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => openTemplateModal(template)}>Edit</Button>
            <Button variant="secondary" style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => deleteFixedWindow(template.id)}>Remove</Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>
            Drop Windows & Shifts Planner
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage the active drop schedule or configure the public-facing fixed templates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {activeTab === 'upcoming' ? (
            <>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                <button 
                  onClick={() => setViewMode('list')} 
                  style={{ padding: '6px 16px', borderRadius: '4px', background: viewMode === 'list' ? 'var(--primary)' : 'transparent', color: viewMode === 'list' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >List View</button>
                <button 
                  onClick={() => setViewMode('calendar')} 
                  style={{ padding: '6px 16px', borderRadius: '4px', background: viewMode === 'calendar' ? 'var(--primary)' : 'transparent', color: viewMode === 'calendar' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                >Calendar</button>
              </div>
              <Button variant="accent" onClick={() => setIsAddOpen(true)}>+ Schedule Drop</Button>
            </>
          ) : (
            <Button variant="accent" onClick={() => openTemplateModal()}>+ Add Template</Button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)', marginBottom: '-8px' }}>
        <button 
          onClick={() => setActiveTab('upcoming')}
          style={{ background: 'transparent', border: 'none', padding: '0 0 12px 0', color: activeTab === 'upcoming' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, borderBottom: activeTab === 'upcoming' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
        >
          Upcoming Drops
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          style={{ background: 'transparent', border: 'none', padding: '0 0 12px 0', color: activeTab === 'templates' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, borderBottom: activeTab === 'templates' ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer' }}
        >
          Default Templates (Landing Page)
        </button>
      </div>

      {activeTab === 'upcoming' && viewMode === 'calendar' && renderCalendarView()}
      {activeTab === 'upcoming' && viewMode === 'list' && renderUpcomingList()}
      {activeTab === 'templates' && renderTemplates()}

      {selectedDrops.length > 0 && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-surface-solid)', padding: '16px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '20px', zIndex: 100 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDrops.length} selected</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => handleBulkAction('enable')} size="sm">Enable</Button>
            <Button variant="secondary" onClick={() => handleBulkAction('disable')} size="sm">Disable</Button>
            <Button variant="secondary" onClick={() => handleBulkAction('delete')} style={{ color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.3)' }} size="sm">Delete</Button>
          </div>
          <button onClick={() => setSelectedDrops([])} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '8px' }}>×</button>
        </div>
      )}

      {/* Add Specific Drop Modal */}
      {isAddOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(3, 4, 6, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsAddOpen(false)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Schedule Drop Window</h3>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {error && <span style={{ color: 'var(--error)', fontSize: '0.8rem' }}>⚠️ {error}</span>}
              <FormInput label="Delivery Date" name="date" type="date" value={date} onChange={handleDateChange} required />
              <FormInput label="Window Name" name="windowName" type="select" value={windowName} onChange={(e) => setWindowName(e.target.value)} options={[{ value: 'Day Drop', label: 'Day Drop' }, { value: 'Night Drop', label: 'Night Drop' }]} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormInput label="Start Time" name="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                <FormInput label="End Time" name="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <FormInput label="Seat Capacity" name="capacity" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
                <FormInput label="Cutoff Time" name="cutoffTime" type="datetime-local" value={cutoffTime} onChange={(e) => setCutoffTime(e.target.value)} required />
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="repeatWeekly" checked={repeatWeekly} onChange={(e) => setRepeatWeekly(e.target.checked)} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                  <label htmlFor="repeatWeekly" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Repeat Weekly</label>
                </div>
                {repeatWeekly && (
                  <FormInput label="Number of Weeks" name="repeatWeeks" type="number" min="1" max="12" value={repeatWeeks} onChange={(e) => setRepeatWeeks(e.target.value)} required={repeatWeekly} />
                )}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Assign Meal Plan (Optional)</label>
                <select 
                  value={selectedMealId} 
                  onChange={(e) => setSelectedMealId(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="">-- Do not assign a meal yet --</option>
                  {uniqueMeals.map(meal => (
                    <option key={meal.id} value={meal.id}>{meal.meal_name}</option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Select an existing meal template to automatically assign it to {repeatWeekly ? 'all created drops' : 'this drop'}.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" variant="accent">Save Drop</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Template Modal */}
      {isTemplateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(3, 4, 6, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setIsTemplateModalOpen(false)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>{templateForm.id ? 'Edit Template' : 'New Template'}</h3>
            <form onSubmit={handleTemplateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <FormInput label="Window Name (e.g. Day Drop)" name="window_name" value={templateForm.window_name} onChange={(e) => setTemplateForm({...templateForm, window_name: e.target.value})} required />
              <FormInput label="Subtitle (e.g. Morning Shifts)" name="subtitle" value={templateForm.subtitle} onChange={(e) => setTemplateForm({...templateForm, subtitle: e.target.value})} />
              <FormInput label="Display Time (e.g. 12:30 PM - 2:00 PM)" name="display_time" value={templateForm.display_time} onChange={(e) => setTemplateForm({...templateForm, display_time: e.target.value})} required />
              <FormInput label="Description (Rules & Target Audience)" name="description" value={templateForm.description} onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})} />
              <FormInput label="Display Order" name="display_order" type="number" value={templateForm.display_order} onChange={(e) => setTemplateForm({...templateForm, display_order: parseInt(e.target.value)})} />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <Button variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="accent">Save Template</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Date Details Modal */}
      {selectedDateObj && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(3, 4, 6, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setSelectedDateObj(null)}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700 }}>Drops for {selectedDateObj.toLocaleDateString()}</h3>
              <Button variant="secondary" onClick={() => setSelectedDateObj(null)}>Close</Button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const dateStr = selectedDateObj.toISOString().split('T')[0];
                const dayDrops = dropWindows.filter(w => w.date === dateStr);
                
                if (dayDrops.length === 0) {
                  return <p style={{ color: 'var(--text-muted)' }}>No drop windows scheduled for this date.</p>;
                }
                
                return dayDrops.map(win => renderDropCard(win));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule;
