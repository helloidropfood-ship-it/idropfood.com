import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../context/AppDataContext';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { plans, dropWindows, menuItems, paymentSettings, fixedDropWindows = [] } = useMockData();

  // Get active plans
  const activePlans = plans.filter(p => p.active);

  // Group drop windows by date to show a menu preview widget
  const getWeeklyMenu = () => {
    const sorted = [...dropWindows]
      .filter(w => w.active && new Date(w.cutoff_time) > new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Take first 5 unique dates
    const dates = [];
    const dateMap = {};
    
    sorted.forEach(w => {
      if (!dateMap[w.date] && dates.length < 5) {
        dateMap[w.date] = [];
        dates.push(w.date);
      }
      if (dateMap[w.date] && dateMap[w.date].length < 2) {
        const menu = menuItems.find(m => m.drop_window_id === w.id);
        dateMap[w.date].push({
          window_name: w.window_name,
          meal_name: menu ? menu.meal_name : 'To Be Announced',
          description: menu ? menu.description : 'Chef\'s special selection.',
          image: menu ? menu.image_url : 'https://images.unsplash.com/photo-1546069901?w=200',
          remaining: w.capacity - w.booked_count
        });
      }
    });

    return dates.map(d => ({
      date: d,
      displayDate: new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      drops: dateMap[d]
    }));
  };

  const weeklyMenu = getWeeklyMenu();

  return (
    <div className="page-landing" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header/Navbar */}
      <header
        className="site-header"
        style={{
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(6, 7, 9, 0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 24px'
        }}
      >
        <div
          className="site-header-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Logo Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.3))' }}>
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
                fontSize: '1.35rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}
            >
              iDrop<span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>Food</span><span style={{ color: 'var(--accent)' }}>.</span>
            </span>
          </div>

          {/* Navigation CTAs */}
          <div className="site-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'color var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              Sign In
            </button>
            <Button variant="accent" onClick={() => navigate('/auth')} size="sm">
              Schedule Now
            </Button>
          </div>
        </div>
      </header>

      {/* Ambient Glows */}
      <div className="glow-container">
        <div className="glow-circle glow-indigo"></div>
        <div className="glow-circle glow-purple"></div>
        <div className="glow-circle glow-gold"></div>
      </div>

      {/* Hero Section */}
      <section
        className="landing-hero"
        style={{
          padding: '80px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center'
        }}
      >
        <div className="landing-hero-copy animate-slide-up" style={{ textAlign: 'left' }}>
          <Badge variant="accent" pulse style={{ marginBottom: '20px' }}>
            Launching first for Shahrah-e-Faisal Offices
          </Badge>
          
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: '1.05',
              letterSpacing: '-0.03em',
              marginBottom: '24px'
            }}
          >
            <span className="text-gradient">Your Shift.</span><br />
            <span style={{ color: 'var(--accent)' }}>Your Meal Drop.</span>
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '36px',
              fontWeight: 400
            }}
          >
            Freshly prepared, small-batch corporate meals delivered directly to your office lobby. Scheduled precisely around Day and Night shift windows.
          </p>

          <div className="landing-hero-actions" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Button variant="accent" onClick={() => navigate('/auth')}>
              Schedule Your Drops
            </Button>
            <Button variant="secondary" onClick={() => {
              const section = document.getElementById('how-it-works');
              section?.scrollIntoView({ behavior: 'smooth' });
            }}>
              How It Works
            </Button>
          </div>
        </div>

        {/* Hero Interactive Mockup Frame */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          className="animate-fade-in delay-200"
        >
          <div className="hero-mockup-wrapper">
            <div
              className="glass-panel hero-mockup-panel"
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(255, 255, 255, 0.01)',
                boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
                maxWidth: '540px',
                width: '100%',
                overflow: 'hidden',
                transform: 'perspective(1000px) rotateY(-6deg) rotateX(6deg)',
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) rotateY(2deg) rotateX(-2deg) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 40px 80px -20px rgba(99, 102, 241, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) rotateY(-6deg) rotateX(6deg)';
                e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)';
              }}
            >
            <img
              src="/dashboard_mockup.png"
              alt="iDropFood Premium Concept A Dashboard"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-md)',
                display: 'block',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            />
            </div>
          </div>
        </div>
      </section>

      {/* Info strip */}
      {paymentSettings?.launch_messaging && (
        <div
          className="launch-strip"
          style={{
            background: 'var(--primary-glow)',
            borderTop: '1px solid var(--border-color)',
            borderBottom: '1px solid var(--border-color)',
            padding: '12px 24px',
            textAlign: 'center',
            fontSize: '0.88rem',
            color: 'var(--primary)',
            fontWeight: 600,
            letterSpacing: '0.02em'
          }}
        >
          🔔 {paymentSettings.launch_messaging}
        </div>
      )}

      {/* How it Works */}
      <section
        id="how-it-works"
        className="section-pad"
        style={{
          padding: '80px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        <div className="section-pad-inner" style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              marginBottom: '12px'
            }}
          >
            How Meal Drops Work
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            A streamlined hybrid credits model designed for corporate agents on 24/7 schedules.
          </p>
        </div>

        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
          {/* Glowing Line */}
          <div style={{
            position: 'absolute',
            left: '23px', // centers behind the 48px circles
            top: '24px',
            bottom: '24px',
            width: '2px',
            background: 'linear-gradient(to bottom, var(--primary) 0%, #8b5cf6 33%, var(--accent) 66%, var(--success) 100%)',
            opacity: 0.4,
            borderRadius: '2px'
          }}></div>

          {[
            {
              num: 1,
              title: "Select Package",
              desc: "Choose from a launch Trial Drop (1 meal) or subscription credit packs (3, 8, or 16 meals per month). Flexible options, no long-term commitments.",
              color: "var(--primary)",
              colorHex: "99, 102, 241",
              icon: <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.38v-6.71L5 9.21v6.7zm14 0v-6.7l-6 3.38v6.71l6-3.39z"/>
            },
            {
              num: 2,
              title: "Schedule Dates & Shifts",
              desc: "Assign credits to the Day Drop (12:30 PM - 2:00 PM) or Night Drop (10:30 PM - 12:00 AM) window based on your rostered shifts. Dynamic calendar allocations.",
              color: "#8b5cf6",
              colorHex: "139, 92, 246",
              icon: <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            },
            {
              num: 3,
              title: "Manual Receipt Upload",
              desc: "Transfer funds via Raast, EasyPaisa, or JazzCash and upload the screenshot. Admin approves payments to activate credits quickly.",
              color: "var(--accent)",
              colorHex: "245, 158, 11",
              icon: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            },
            {
              num: 4,
              title: "Desk Drop-off",
              desc: "Meals are dropped at the designated lobby desk. You receive a notification to retrieve your hot meal when it arrives.",
              color: "var(--success)",
              colorHex: "34, 197, 94",
              icon: <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            }
          ].map((step, i) => (
            <div key={i} className={`animate-slide-up delay-${(i + 1) * 100}`} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '32px',
              marginBottom: i !== 3 ? '40px' : '0',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Number Circle Node */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: `rgba(${step.colorHex}, 0.15)`,
                border: `2px solid ${step.color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: step.color,
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                fontWeight: 800,
                boxShadow: `0 0 20px rgba(${step.colorHex}, 0.4)`,
                flexShrink: 0,
                position: 'relative',
                backdropFilter: 'blur(4px)'
              }}>
                {step.num}
              </div>

              {/* Content Card */}
              <div className="glass-card u-hover-lift" style={{
                flex: 1,
                padding: '28px 32px',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid rgba(${step.colorHex}, 0.2)`,
                background: 'linear-gradient(145deg, rgba(18, 20, 26, 0.8) 0%, rgba(18, 20, 26, 0.4) 100%)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 10px 40px rgba(${step.colorHex}, 0.15)`;
                e.currentTarget.style.borderColor = `rgba(${step.colorHex}, 0.5)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = `rgba(${step.colorHex}, 0.2)`;
              }}
              >
                {/* Subtle background glow */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  background: `radial-gradient(circle, rgba(${step.colorHex}, 0.15) 0%, transparent 70%)`,
                  borderRadius: '50%',
                  pointerEvents: 'none'
                }}></div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: `rgba(${step.colorHex}, 0.1)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: step.color
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      {step.icon}
                    </svg>
                  </div>
                  <h3 style={{
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                    margin: 0
                  }}>
                    {step.title}
                  </h3>
                </div>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.98rem',
                  lineHeight: '1.6',
                  margin: 0,
                  paddingLeft: '60px'
                }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shifts Breakdown section */}
      <section
        className="section-pad"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          padding: '80px 24px'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div className="section-pad-inner" style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
              Fixed Drop Windows
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              We do not deliver all day. We operate predictable drop windows to ensure high kitchen quality.
            </p>
          </div>

          <div className="u-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            {fixedDropWindows.sort((a,b) => a.display_order - b.display_order).map((fixedWindow, idx) => (
              <div
                key={fixedWindow.id}
                className={`glass-card animate-slide-up delay-${(idx + 1)}00`}
                style={{
                  padding: '32px',
                  textAlign: 'center'
                }}
              >
                <Badge variant={fixedWindow.window_name === 'Day Drop' ? 'primary' : 'accent'} style={{ marginBottom: '16px' }}>
                  {fixedWindow.subtitle}
                </Badge>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
                  {fixedWindow.window_name}
                </h3>
                <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '16px', fontFamily: 'var(--font-display)' }}>
                  {fixedWindow.display_time}
                </p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {fixedWindow.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Preview */}
      {weeklyMenu.length > 0 && (
        <section className="section-pad" style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="section-pad-inner" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
              Active Menu Preview
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Fresh ingredients, prepared in small batches daily. One premium option per shift window.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              paddingBottom: '20px',
              scrollSnapType: 'x mandatory'
            }}
          >
            {weeklyMenu.map((item, idx) => (
              <div
                key={item.date}
                className={`glass-card animate-slide-up delay-${Math.min(idx + 1, 5)}00`}
                style={{
                  minWidth: '280px',
                  maxWidth: '320px',
                  padding: '20px',
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent)' }}>
                    {item.displayDate}
                  </span>
                </div>

                {item.drops.map((drop, dropIdx) => (
                  <div
                    key={dropIdx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      padding: '12px 0',
                      borderTop: dropIdx > 0 ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {drop.window_name}
                      </span>
                      {drop.remaining <= 5 && drop.remaining > 0 ? (
                        <Badge variant="accent" outline>{`${drop.remaining} slots left`}</Badge>
                      ) : drop.remaining === 0 ? (
                        <Badge variant="danger" outline>Full</Badge>
                      ) : null}
                    </div>
                    <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {drop.meal_name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      {drop.description}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Package Plans */}
      <section
        className="section-pad"
        style={{
          background: 'rgba(255, 255, 255, 0.01)',
          borderTop: '1px solid var(--border-color)',
          borderBottom: '1px solid var(--border-color)',
          padding: '80px 24px',
          width: '100%'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="section-pad-inner" style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '12px' }}>
              Select Your Meal Plan
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Simple credit bundles. Schedule drops anytime. Approved first for lobby desk pickups.
            </p>
          </div>

          <div
            className="u-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
              alignItems: 'stretch'
            }}
          >
            {activePlans
              .sort((a, b) => a.display_order - b.display_order)
              .map((plan, idx) => {
                const isTrial = plan.id === 'plan-trial';
                return (
                  <div
                    key={plan.id}
                    className={`glass-card animate-slide-up delay-${Math.min(idx + 1, 5)}00`}
                    style={{
                      padding: '32px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: isTrial ? '1px solid var(--border-color)' : '2px solid rgba(99, 102, 241, 0.25)',
                      borderRadius: 'var(--radius-lg)',
                      background: isTrial ? 'var(--bg-surface)' : 'rgba(18, 20, 26, 0.75)',
                      position: 'relative'
                    }}
                  >
                    {!isTrial && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          padding: '3px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontFamily: 'var(--font-display)',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}
                      >
                        Popular Pack
                      </div>
                    )}
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {plan.name}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', minHeight: '48px', marginBottom: '20px', lineHeight: '1.4' }}>
                        {plan.description}
                      </p>
                      
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                          Rs. {plan.price.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                          / {plan.meal_credits} {plan.meal_credits === 1 ? 'Meal' : 'Meals'}
                        </span>
                      </div>

                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                        <li style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                          ✨ {plan.meal_credits} Scheduled Credits
                        </li>
                        <li style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                          🕒 {plan.validity_days} Days Expiry
                        </li>
                        <li style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                          📦 Pick up at lobby desk
                        </li>
                      </ul>
                    </div>

                    <Button
                      variant={isTrial ? 'secondary' : 'primary'}
                      onClick={() => navigate('/auth', { state: { selectedPlanId: plan.id } })}
                      style={{ width: '100%' }}
                    >
                      {isTrial ? 'Try Launch Drop' : 'Choose Package'}
                    </Button>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-pad" style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '40px' }}>
          Frequently Asked Questions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card hoverable={false} title="Where do I pick up my meal?">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              All meals are dropped off at the designated **iDropFood Lobby Counter** at the office building lobby. Drivers cannot go to office floors due to security. You will receive a WhatsApp message once the drop is complete.
            </p>
          </Card>
          <Card hoverable={false} title="What is the cutoff rule for scheduling or editing?">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              All drops lock dynamically based on the cutoff time defined by the admin (defaulting to **8:00 PM local Karachi time the day before** the drop). After this cutoff, ingredients are prepped and kitchen work begins, so drops cannot be cancelled, modified, or refunded.
            </p>
          </Card>
          <Card hoverable={false} title="Can I buy credits now and schedule them later?">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Yes! For Lite, Core, and Full packs, you can purchase the pack first (credits load to your balance upon payment approval) and allocate drops day-by-day. Trial Drop users must schedule their single meal immediately during checkout.
            </p>
          </Card>
          <Card hoverable={false} title="How do I submit payment proof?">
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Once you choose a package, checkout will show payment details for Meezan Bank Raast, EasyPaisa, and JazzCash. Transfer the package amount manually using your favorite mobile banking app, snap a screenshot of the receipt, and upload it directly inside the checkout screen.
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-color)',
          background: '#060709',
          padding: '40px 24px',
          marginTop: 'auto'
        }}
      >
        <div
          className="landing-footer-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.15rem' }}>
              iDrop<span style={{ color: 'var(--accent)' }}>Food</span>
            </span>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              © 2026 iDropFood. All rights reserved. Launching first at Shahrah-e-Faisal.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
