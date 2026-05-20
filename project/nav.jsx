// nav.jsx — Liquid glass bottom navigation variants
// Each variant exposes: <NavXxx active onChange onCreate onProfile accent collapsed dark />

// ──────────────────────────────────────────────────────────
// Shared: liquid glass surface + SVG distortion filter defs
// ──────────────────────────────────────────────────────────
function LiquidDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {/* Subtle animated warp — applied to a gradient overlay behind the glass */}
        <filter id="liquidWarp" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="3">
            <animate attributeName="baseFrequency" dur="14s"
              values="0.012 0.018; 0.018 0.012; 0.012 0.018" repeatCount="indefinite"/>
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="22" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
    </svg>
  );
}

// Wrapper that anchors nav to bottom & enables pointer-events on children only.
function NavShell({ children, gap = 0 }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 24,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 16px', gap, pointerEvents: 'none', zIndex: 70,
    }}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        const prev = child.props.style || {};
        return React.cloneElement(child, { style: { ...prev, pointerEvents: 'auto' } });
      })}
    </div>
  );
}

// Small icon button used in pills
function NavIconBtn({ active, onClick, color = '#0A0A0A', activeColor, accent, children, label, w = 56, h = 52 }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      width: w, height: h,
      border: 'none', background: 'transparent', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 3, padding: 0,
      position: 'relative', zIndex: 1,
      color: active ? (activeColor || accent) : color,
      transition: 'color 0.18s ease, transform 0.18s ease',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.32s cubic-bezier(0.34, 1.4, 0.5, 1)',
        transform: active ? 'scale(1.08)' : 'scale(1)',
      }}>{children}</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────
// VARIANT A — "iOS 26 Dock"
// Single wide floating pill: Home / Bell / Create(+) / Avatar
// ──────────────────────────────────────────────────────────
function NavDock({ active, onChange, onCreate, onProfile, accent, collapsed, dark }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: (a, c) => <Icon.Home filled={a} color={c} size={24} stroke={2}/> },
    { id: 'notif', label: 'Alerts', icon: (a, c) => <Icon.Bell filled={a} color={c} size={24} stroke={2} hasDot={!a}/> },
  ];
  const slotW = 56;
  const idx = tabs.findIndex(t => t.id === active);
  const indicatorX = idx >= 0 ? (8 + idx * slotW) : -100;
  const scale = collapsed ? 0.86 : 1;
  return (
    <NavShell>
      <div className="glass glass-refract glass-liquid dock-shadow" style={{
        display: 'inline-flex', alignItems: 'center', gap: 0,
        padding: '6px 8px', borderRadius: 999,
        transform: `scale(${scale})`, transformOrigin: 'bottom center',
        transition: 'transform 0.34s cubic-bezier(0.34, 1.4, 0.5, 1)',
      }}>
        <div className="shimmer-overlay" />
        <div className="tab-indicator" style={{
          width: slotW - 4, height: 44, top: 6,
          transform: `translateX(${indicatorX}px)`,
          opacity: idx >= 0 ? 1 : 0,
        }} />
        {tabs.map((t) => (
          <NavIconBtn key={t.id} active={t.id === active} accent={accent}
            onClick={() => onChange(t.id)} label={t.label} w={slotW} h={44}>
            {t.icon(t.id === active, t.id === active ? '#0A0A0A' : '#3a3a44')}
          </NavIconBtn>
        ))}
        <button onClick={onCreate} aria-label="Create" className="fab-purple" style={{
          width: 44, height: 44, borderRadius: 999, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', marginLeft: 6, marginRight: 4,
        }}>
          <Icon.Plus size={22} color="#fff" stroke={2.6} />
        </button>
        <button onClick={onProfile} aria-label="Profile" style={{
          width: 44, height: 44, borderRadius: 999, border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
        }}>
          <Avatar size={36} radius={999} />
        </button>
      </div>
    </NavShell>
  );
}

// ──────────────────────────────────────────────────────────
// VARIANT B — "Wabi Floating Trio"
// Center pill (Home + Bell) + side FAB (Search) + side FAB (Create)
// ──────────────────────────────────────────────────────────
function NavWabi({ active, onChange, onCreate, onProjects, onProfile, queue, onQueueClick, notifBadge, accent, collapsed, dark }) {
  // The center pill carries two full tab slots: Home and Creation
  // (a.k.a. the "Projects" tab internally — kept as the prop / id
  // name to avoid breaking the parent wiring).
  // Both swap the underlying tab (active = current tab), so
  // the white pill indicator lands on whichever is selected.
  const tabs = [
    { id: 'home',     label: 'Home',
      icon: (a, c) => <Icon.Home filled={a} color={c} size={22}/> },
    { id: 'projects', label: 'Creation',
      icon: (a, c) => <Icon.Hamburger color={c} size={20} stroke={2}/> },
  ];
  const slotW = 72;
  const scale = collapsed ? 0.88 : 1;

  // Per-tab fills per spec:
  //   inactive → transparent (the frosted container shows through)
  //   active   → 6% black overlay
  const tabActiveBg = 'rgba(0, 0, 0, 0.06)';

  return (
    <NavShell gap={12}>
      {/* Center pill — frosted glass container provides the only
          visible surface; inactive tabs are transparent so the
          container background shows through. Active tab darkens by
          6% black. */}
      <div className="glass-wabi dock-shadow" style={{
        display: 'inline-flex', alignItems: 'center', padding: 4, borderRadius: 999,
        gap: 4,
        position: 'relative', transform: `scale(${scale})`,
        transition: 'transform 0.34s cubic-bezier(0.34, 1.4, 0.5, 1)',
      }}>
        {tabs.map((t) => {
          const a = t.id === active;
          const onClick = () => onChange(t.id);
          return (
            <button key={t.id} onClick={onClick} aria-label={t.label} style={{
              width: slotW, height: 44,
              border: 'none', outline: 'none', padding: 0, margin: 0,
              boxShadow: 'none',
              background: a ? tabActiveBg : 'transparent',
              backgroundClip: 'padding-box',
              borderRadius: 999,
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              position: 'relative', zIndex: 1,
              color: a ? '#0A0A0A' : '#3a3a44',
              transition: 'background 0.18s ease, color 0.18s ease',
            }}>
              {t.icon(a, a ? '#0A0A0A' : '#3a3a44')}
              <span style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 10, fontWeight: 600, letterSpacing: -0.05,
                lineHeight: '12px',
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right FAB — Create, with an optional queue badge floating
          just above it when generation jobs are in flight. */}
      <div style={{
        position: 'relative',
        transform: `scale(${scale})`,
        transition: 'transform 0.34s cubic-bezier(0.34, 1.4, 0.5, 1)',
      }}>
        {queue && queue.length > 0 && (
          <QueueBadge queue={queue} accent={accent} onClick={onQueueClick} />
        )}
        <button onClick={onCreate} className="fab-purple dock-shadow" style={{
          width: 52, height: 52, borderRadius: 999, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
        }} aria-label="Create">
          <Icon.Plus size={24} color="#fff" stroke={2.6} />
        </button>
      </div>
    </NavShell>
  );
}

// ──────────────────────────────────────────────────────────
// QueueBadge — floating pill above the "+" FAB. Shows aggregate
// progress + count. Tap to open the QueuePanel.
// ──────────────────────────────────────────────────────────
function QueueBadge({ queue, accent, onClick }) {
  const count = queue.length;
  const avg = queue.reduce((s, q) => s + (q.progress || 0), 0) / Math.max(1, count);
  // Circumference of r=10 circle ≈ 62.8
  const C = 2 * Math.PI * 10;
  const dash = Math.min(C, Math.max(0, avg * C));
  return (
    <button onClick={onClick} aria-label={`${count} generations in queue`} style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 4px',
      borderRadius: 999, border: 'none', cursor: 'pointer',
      background: '#FFFFFF',
      boxShadow: '0 8px 20px rgba(20, 8, 60, 0.20), 0 1px 3px rgba(20, 8, 60, 0.08), inset 0 1px 1px rgba(255,255,255,0.7)',
      whiteSpace: 'nowrap',
    }}>
      <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="none"
            stroke="rgba(9, 9, 11, 0.08)" strokeWidth="2.5" />
          <circle cx="12" cy="12" r="10" fill="none"
            stroke={accent} strokeWidth="2.5"
            strokeDasharray={`${dash} ${C}`}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
            style={{ transition: 'stroke-dasharray 0.3s linear' }}
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 10, fontWeight: 700, color: '#1F1A23',
          letterSpacing: -0.2,
        }}>{count}</span>
      </div>
      <span style={{
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 12, fontWeight: 600, color: '#1F1A23',
        letterSpacing: -0.05,
      }}>Generating</span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────
// VARIANT C — "Inline Composer" (Grok-style)
// ──────────────────────────────────────────────────────────
function NavComposer({ active, onChange, onCreate, onProfile, accent, collapsed, dark }) {
  if (collapsed) {
    return (
      <NavShell>
        <div className="glass glass-refract glass-liquid dock-shadow" style={{
          display: 'inline-flex', alignItems: 'center', padding: 6, borderRadius: 999, gap: 0,
        }}>
          <div className="shimmer-overlay" />
          <NavIconBtn active={active === 'home'} onClick={() => onChange('home')} accent={accent} w={48} h={42}>
            <Icon.Home filled={active === 'home'} color={active === 'home' ? '#0A0A0A' : '#3a3a44'} size={22}/>
          </NavIconBtn>
          <NavIconBtn active={active === 'notif'} onClick={() => onChange('notif')} accent={accent} w={48} h={42}>
            <Icon.Bell filled={active === 'notif'} color={active === 'notif' ? '#0A0A0A' : '#3a3a44'} size={22} hasDot={active !== 'notif'}/>
          </NavIconBtn>
          <button onClick={onCreate} className="fab-purple" style={{
            width: 42, height: 42, borderRadius: 999, border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 2px',
          }}>
            <Icon.Plus size={20} color="#fff" stroke={2.6}/>
          </button>
          <button onClick={onProfile} style={{
            width: 42, height: 42, borderRadius: 999, border: 'none', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}>
            <Avatar size={34} radius={999}/>
          </button>
        </div>
      </NavShell>
    );
  }
  return (
    <NavShell>
      <div className="glass glass-refract glass-liquid dock-shadow" style={{
        display: 'flex', alignItems: 'center', padding: 6, borderRadius: 999,
        gap: 0, width: 'calc(100% - 8px)', maxWidth: 380,
      }}>
        <div className="shimmer-overlay" />
        <NavIconBtn active={active === 'home'} onClick={() => onChange('home')} accent={accent} w={42} h={42}>
          <Icon.Home filled={active === 'home'} color={active === 'home' ? '#0A0A0A' : '#3a3a44'} size={22}/>
        </NavIconBtn>
        <NavIconBtn active={active === 'notif'} onClick={() => onChange('notif')} accent={accent} w={42} h={42}>
          <Icon.Bell filled={active === 'notif'} color={active === 'notif' ? '#0A0A0A' : '#3a3a44'} size={22} hasDot={active !== 'notif'}/>
        </NavIconBtn>
        <div onClick={onCreate} style={{
          flex: 1, height: 42, borderRadius: 999, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
          background: 'rgba(255,255,255,0.5)',
          border: '0.5px solid rgba(255,255,255,0.7)',
          minWidth: 0,
        }}>
          <Icon.Sparkle size={14} color={accent}/>
          <div style={{ flex: 1, fontSize: 14, color: '#7a7a85', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            Type to create…
          </div>
        </div>
        <button onClick={onProfile} style={{
          width: 42, height: 42, borderRadius: 999, border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0,
          marginLeft: 4,
        }}>
          <Avatar size={34} radius={999}/>
        </button>
      </div>
    </NavShell>
  );
}

// ──────────────────────────────────────────────────────────
// VARIANT D — "Split Dock" (Instagram-flavored)
// ──────────────────────────────────────────────────────────
function NavSplit({ active, onChange, onCreate, onProfile, accent, collapsed, dark }) {
  const scale = collapsed ? 0.88 : 1;
  const tabs = [
    { id: 'home', label: 'Home', icon: (a, c) => <Icon.Home filled={a} color={c} size={20}/> },
    { id: 'notif', label: 'Alerts', icon: (a, c) => <Icon.Bell filled={a} color={c} size={20} hasDot={!a}/> },
  ];
  return (
    <NavShell gap={10}>
      <div className="glass glass-refract glass-liquid dock-shadow" style={{
        display: 'inline-flex', alignItems: 'center', padding: 5, borderRadius: 999,
        position: 'relative', transform: `scale(${scale})`,
        transition: 'transform 0.34s cubic-bezier(0.34, 1.4, 0.5, 1)',
      }}>
        <div className="shimmer-overlay" />
        {tabs.map((t) => {
          const a = t.id === active;
          return (
            <button key={t.id} onClick={() => onChange(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
              background: a ? '#fff' : 'transparent',
              boxShadow: a ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
              transition: 'all 0.22s', color: a ? '#0A0A0A' : '#3a3a44',
              fontSize: 13.5, fontWeight: 600,
            }}>
              {t.icon(a, a ? '#0A0A0A' : '#3a3a44')}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <button onClick={onCreate} className="fab-purple dock-shadow" style={{
        width: 50, height: 50, borderRadius: 999, border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transform: `scale(${scale})`,
        transition: 'transform 0.34s cubic-bezier(0.34, 1.4, 0.5, 1)',
      }} aria-label="Create">
        <Icon.Plus size={24} color="#fff" stroke={2.6}/>
      </button>

      <div onClick={onProfile} className="glass glass-refract dock-shadow" style={{
        width: 50, height: 50, borderRadius: 999, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `scale(${scale})`,
        transition: 'transform 0.34s cubic-bezier(0.34, 1.4, 0.5, 1)',
      }}>
        <Avatar size={36} radius={999}/>
      </div>
    </NavShell>
  );
}

Object.assign(window, { NavDock, NavWabi, NavComposer, NavSplit, LiquidDefs, QueueBadge });
