// modals.jsx — Composer overlay, Project sidebar, Profile sheet

// ──────────────────────────────────────────────
// ComposerSheet — Gizmo-style multi-section composer.
//
// Opens when the user taps the bottom-nav "+" CTA. The default
// state shows a tall prompt card on top + a row of four section
// chips (Images, Avatar, Music, AI Generation). Tapping any chip
// raises a draggable bottom sheet with that section's content —
// the sheet can be pulled all the way up to the iOS status bar,
// just like the search panes in Aippy / Gizmo.
//
// State here is intentionally minimal: a prompt string and the
// id of whichever section is currently active (or null).
// ──────────────────────────────────────────────
// Height of the prototype's FakeKeyboard. Used as the default
// resting height of every section sheet so the panel feels like a
// drop-in replacement for the keyboard, and as the bottom anchor for
// the composer + chips column.
const COMPOSER_KB_H = 257;
// Max height for the prompt textarea. The card is BOTTOM-anchored
// (sitting just above the chip row + keyboard) and grows UPWARD with
// content. Ceiling chosen so the fully expanded card's top stops just
// under the close-X button (top:60 + 40 + ~10 gap = ~110 from top).
// Avail = PHONE_H − KB − chip-row − gaps − card-chrome − 110
//       = 852 − 257 − 32 − 16 − 74 − 110 ≈ 363
const COMPOSER_TA_MAX = 360;

function ComposerSheet({ onClose, accent, navHeight = 90, onSend }) {
  const [text, setText] = React.useState('');
  const [ideas, setIdeas] = React.useState(false);
  const [active, setActive] = React.useState(null);

  // Send handler — the purple play button in the prompt card and the
  // ⏎ key both go through here. Hands the trimmed text to the parent
  // (App) which opens the generation conversation, then closes the
  // composer so the chat surface owns the foreground.
  const handleSend = React.useCallback(() => {
    const t = (text || '').trim();
    if (typeof onSend === 'function') onSend(t);
  }, [text, onSend]);

  const sections = [
    { id: 'images', label: 'Images',        icon: <Icon.Photo  size={22} color="#1F1A23" stroke={1.8} /> },
    { id: 'avatar', label: 'Avatar',        icon: <Icon.User   size={22} color="#1F1A23" stroke={1.8} /> },
    { id: 'music',  label: 'Music',         icon: <Icon.Music  size={22} color="#1F1A23" stroke={1.8} /> },
    { id: 'ai',     label: 'AI Generation', icon: <Icon.Wand   size={22} color="#1F1A23" stroke={1.8} /> },
  ];

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80 }}>
      {/* Dim backdrop — light variant since the composer surface is
          itself white. Tap to dismiss. */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20,12,40,0.36)',
        backdropFilter: 'blur(6px) saturate(140%)',
        WebkitBackdropFilter: 'blur(6px) saturate(140%)',
        animation: 'fade 0.25s ease',
      }} />

      {/* Close X — top-left glass circle. Mirrors the Gizmo layout. */}
      <button onClick={onClose} aria-label="Close" style={{
        position: 'absolute', top: 60, left: 16, zIndex: 6,
        width: 40, height: 40, borderRadius: 999,
        border: 'none', cursor: 'pointer', padding: 0,
        background: 'rgba(0,0,0,0.42)',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
      }}>
        <Icon.Close size={16} stroke={2.4} />
      </button>

      {/* Prompt card + chip row — BOTTOM-anchored stack so the chips
          hug the top of the keyboard and the card sits right above
          the chips (8px gap). The card grows UPWARD with content,
          iOS-message-input style. */}
      <div className="sheet-enter" style={{
        position: 'absolute',
        bottom: COMPOSER_KB_H + 8, left: 12, right: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 4,
        pointerEvents: 'auto',
      }}>
        <ComposerCard
          text={text}
          setText={setText}
          ideas={ideas}
          setIdeas={setIdeas}
          accent={accent}
          onInputFocus={() => setActive(null)}
          textareaMaxH={COMPOSER_TA_MAX}
          onSend={handleSend}
        />

        {/* Section chips — sit 8px below the card and ~8px above the
            keyboard. Active chip lights up with a 100% white pill. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 4px',
        }}>
          {sections.map((s) => {
            const isActive = active === s.id;
            const color = isActive ? '#1F1A23' : 'rgba(255, 255, 255, 0.92)';
            return (
              <button
                key={s.id}
                onClick={() => setActive(isActive ? null : s.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: isActive ? '8px 12px' : '8px 4px',
                  borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  boxShadow: isActive
                    ? '0 4px 14px rgba(20, 8, 60, 0.18), inset 0 1px 1px rgba(255,255,255,0.7)'
                    : 'none',
                  opacity: isActive ? 1 : 0.85,
                  transition: 'background 0.18s ease, padding 0.18s ease, opacity 0.16s ease, box-shadow 0.18s ease',
                }}
              >
                {React.cloneElement(s.icon, { color, size: 16, stroke: 1.8 })}
                <span style={{
                  fontFamily: '"Manrope", system-ui, sans-serif',
                  fontSize: 13, fontWeight: 600, letterSpacing: -0.05,
                  color, whiteSpace: 'nowrap',
                  textShadow: isActive ? 'none' : '0 1px 2px rgba(20,8,60,0.18)',
                }}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section panel — only when a chip is active. Draggable. */}
      {active && (
        <SectionSheet
          key={active}
          section={active}
          accent={accent}
          onClose={() => setActive(null)}
        />
      )}

      {/* Fake keyboard — only when no section sheet is up, so it
          doesn't compete with the draggable panel. */}
      {!active && <FakeKeyboard />}
    </div>
  );
}

// Big prompt card with bottom action row. Pulled out so the inner
// `useRef`/`useEffect` for autofocus stay close to the textarea.
// `onInputFocus` is fired whenever the textarea gains focus (or is
// tapped) so the parent can dismiss any open section sheet — that
// way refocusing the prompt always brings the keyboard back.
function ComposerCard({ text, setText, ideas, setIdeas, accent, onInputFocus, textareaMaxH = 360, onSend }) {
  const inputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  // Default rest height of the textarea — roughly 2 lines. The
  // textarea auto-grows beyond this on input, up to `textareaMaxH`.
  const minTaH = 56;
  // Local state for the Add menu (URL / file). Opens when the "+"
  // button in the left action cluster is tapped.
  const [addMenuOpen, setAddMenuOpen] = React.useState(false);
  const [urlMode, setUrlMode] = React.useState(false);
  const [urlValue, setUrlValue] = React.useState('');
  // Attached items the user has added via "+" — shown as chips inside
  // the textarea area. Each item is { id, kind: 'url'|'file', label }.
  const [attached, setAttached] = React.useState([]);

  const addUrl = () => {
    const v = urlValue.trim();
    if (!v) return;
    setAttached((a) => [...a, { id: 'a-' + Date.now(), kind: 'url', label: v }]);
    setUrlValue('');
    setUrlMode(false);
    setAddMenuOpen(false);
  };
  const onFilesPicked = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setAttached((a) => [
      ...a,
      ...files.map((f) => ({ id: 'a-' + Date.now() + '-' + f.name, kind: 'file', label: f.name })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAddMenuOpen(false);
  };
  const removeAttached = (id) => setAttached((a) => a.filter((x) => x.id !== id));

  // Recalculate height from content. Called after every keystroke and
  // on mount. We clamp between min and max; once max is reached, the
  // textarea itself becomes internally scrollable.
  const autosize = React.useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.max(minTaH, Math.min(el.scrollHeight, textareaMaxH));
    el.style.height = next + 'px';
  }, [textareaMaxH]);

  React.useEffect(() => {
    inputRef.current && inputRef.current.focus();
    autosize();
  }, [autosize]);

  return (
    <div
      onPointerDown={(e) => {
        // Close the Add menu if the tap landed outside its wrapper.
        if (addMenuOpen && !e.target.closest('[data-add-menu-root]')) {
          setAddMenuOpen(false);
          setUrlMode(false);
        }
        if (e.target.closest('button')) return;
        onInputFocus && onInputFocus();
      }}
      style={{
        background: '#FFFFFF',
        borderRadius: 24,
        padding: '14px 16px 12px',
        display: 'flex', flexDirection: 'column',
        border: '0.5px solid rgba(0, 0, 0, 0.04)',
        boxShadow: '0 24px 60px rgba(20, 8, 60, 0.18), 0 4px 12px rgba(20, 8, 60, 0.06)',
      }}>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => { setText(e.target.value); autosize(); }}
        onFocus={() => onInputFocus && onInputFocus()}
        onKeyDown={(e) => {
          // Enter sends; Shift+Enter keeps native newline behaviour.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (typeof onSend === 'function') onSend();
          }
        }}
        placeholder="Type anything..."
        rows={1}
        style={{
          width: '100%',
          height: minTaH, minHeight: minTaH, maxHeight: textareaMaxH,
          border: 'none', outline: 'none', background: 'transparent', resize: 'none',
          padding: 0, overflow: 'auto',
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 17, lineHeight: '24px', fontWeight: 500,
          color: '#1F1A23', letterSpacing: 0.1,
        }}
      />

      {/* Attached items — small pills shown between textarea and the
          action row when the user has added URL(s) or file(s). */}
      {attached.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6,
        }}>
          {attached.map((a) => (
            <div key={a.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 6px 4px 10px', borderRadius: 999,
              background: 'rgba(124, 91, 253, 0.08)',
              border: '0.5px solid rgba(124, 91, 253, 0.20)',
              maxWidth: 200,
            }}>
              {a.kind === 'url'
                ? <Icon.Sparkle size={12} color={accent} />
                : <Icon.Photo size={12} color={accent} stroke={2} />}
              <span style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 12, fontWeight: 500, color: '#1F1A23',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 140,
              }}>{a.label}</span>
              <button onClick={() => removeAttached(a.id)} aria-label="Remove" style={{
                width: 16, height: 16, borderRadius: 999,
                background: 'rgba(9, 9, 11, 0.10)', border: 'none', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, color: '#3F3F46', flexShrink: 0,
              }}>
                <Icon.Close size={8} stroke={2.4} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input — triggered by the Add menu "Add file" option. */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFilesPicked}
        style={{ display: 'none' }}
      />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 8, gap: 8,
      }}>
        {/* Left cluster — Add ("+"), 3D, aspect ratio pill, overflow.
            The "+" anchors a small popover for URL / file attachments. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div data-add-menu-root style={{ position: 'relative' }}>
            <button
              aria-label="Add attachment"
              onClick={(e) => {
                e.stopPropagation();
                setAddMenuOpen((v) => !v);
                setUrlMode(false);
              }}
              style={{
                ...composerIconBtn,
                background: addMenuOpen ? 'rgba(124, 91, 253, 0.12)' : composerIconBtn.background,
              }}
            >
              <Icon.Plus size={16} color="#3F3F46" stroke={2.2} />
            </button>

            {/* Popover — URL/File picker. Opens above the "+" button so
                it doesn't get clipped by the card edge. */}
            {addMenuOpen && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)', left: 0,
                  minWidth: 240,
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: '0.5px solid rgba(0, 0, 0, 0.06)',
                  boxShadow: '0 18px 40px rgba(20, 8, 60, 0.20), 0 4px 12px rgba(20, 8, 60, 0.08)',
                  padding: urlMode ? 10 : 6,
                  zIndex: 12,
                }}
              >
                {!urlMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => setUrlMode(true)} style={addMenuRowStyle}>
                      <span style={addMenuIconWrap}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#1F1A23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1"/>
                          <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1"/>
                        </svg>
                      </span>
                      <span style={addMenuLabel}>Upload URL</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      style={addMenuRowStyle}
                    >
                      <span style={addMenuIconWrap}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="#1F1A23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                      </span>
                      <span style={addMenuLabel}>Add file</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      fontFamily: '"Manrope", system-ui, sans-serif',
                      fontSize: 12, fontWeight: 600, color: '#5C5C66',
                      padding: '0 2px',
                    }}>Paste a link</div>
                    <input
                      autoFocus
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addUrl(); }}
                      placeholder="https://…"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '0.5px solid rgba(0, 0, 0, 0.12)',
                        borderRadius: 10,
                        outline: 'none',
                        fontFamily: '"Manrope", system-ui, sans-serif',
                        fontSize: 13, color: '#1F1A23',
                        background: '#F4F4F5',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setUrlMode(false); setUrlValue(''); }} style={{
                        padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
                        background: 'rgba(9, 9, 11, 0.06)', color: '#1F1A23',
                        fontFamily: '"Manrope", system-ui, sans-serif',
                        fontSize: 12, fontWeight: 600,
                      }}>Cancel</button>
                      <button onClick={addUrl} disabled={!urlValue.trim()} style={{
                        padding: '6px 14px', borderRadius: 999, border: 'none',
                        cursor: urlValue.trim() ? 'pointer' : 'default',
                        background: urlValue.trim() ? accent : 'rgba(9, 9, 11, 0.12)',
                        color: '#FFFFFF',
                        fontFamily: '"Manrope", system-ui, sans-serif',
                        fontSize: 12, fontWeight: 600,
                      }}>Add</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button aria-label="3D" style={composerIconBtn}>
            <Icon.Cube size={16} color="#3F3F46" stroke={1.8} />
          </button>
          <button aria-label="Aspect ratio" style={{
            ...composerIconBtn,
            width: 'auto', gap: 4, padding: '0 10px',
          }}>
            <Icon.Ratio size={16} color="#3F3F46" stroke={1.8} />
            <span style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 13, fontWeight: 500, color: '#3F3F46',
              letterSpacing: 0.1,
            }}>16:9</span>
          </button>
          <button aria-label="More" style={composerIconBtn}>
            <Icon.Dots size={16} color="#3F3F46" />
          </button>
        </div>

        {/* Right — primary send / play. Always-active so an empty
            prompt still lets the user jump into a blank conversation,
            matching the screenshot's filled purple affordance. */}
        <button
          aria-label="Send"
          onClick={() => onSend && onSend()}
          style={{
            width: 38, height: 38, borderRadius: 999,
            background: accent,
            color: '#FFFFFF',
            border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 6px 16px ${accent}55, inset 0 1px 1px rgba(255,255,255,0.4)`,
            transition: 'background 0.18s ease, box-shadow 0.18s ease, transform 0.12s ease',
          }}
          onPointerDown={(e) => { e.currentTarget.style.transform = 'scale(0.94)'; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerCancel={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onPointerLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Icon.Play2 size={14} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
}

const composerIconBtn = {
  width: 34, height: 34, borderRadius: 999,
  border: 'none', cursor: 'pointer', padding: 0,
  background: 'rgba(9, 9, 11, 0.04)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

// Styles for the Add (URL / file) popover rows. Two-row vertical menu.
const addMenuRowStyle = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 12px',
  border: 'none', background: 'transparent', cursor: 'pointer',
  borderRadius: 10, textAlign: 'left',
};
const addMenuIconWrap = {
  width: 28, height: 28, borderRadius: 8,
  background: 'rgba(9, 9, 11, 0.05)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
const addMenuLabel = {
  fontFamily: '"Manrope", system-ui, sans-serif',
  fontSize: 14, fontWeight: 600, color: '#1F1A23',
  letterSpacing: -0.05,
};

// ──────────────────────────────────────────────
// SectionSheet — draggable bottom panel, content varies per section.
// Snaps between MID (peek) and FULL (just under the iOS status bar).
// Dragging past PHONE_H closes the sheet entirely.
// ──────────────────────────────────────────────
function SectionSheet({ section, accent, onClose }) {
  const PHONE_H = 852;
  const STATUS_H = 62;
  // Default rest position — same Y the keyboard's top edge would
  // occupy, so the panel reads as a one-for-one swap of the keyboard.
  const MID_TOP = PHONE_H - COMPOSER_KB_H;
  const FULL_TOP = STATUS_H + 20;
  const DISMISS_TOP = PHONE_H - 60;

  const [sheetTop, setSheetTop] = React.useState(PHONE_H);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef(null);
  const closingRef = React.useRef(false);

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setSheetTop(MID_TOP));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setSheetTop(PHONE_H);
    window.setTimeout(onClose, 280);
  };

  const beginDrag = (clientY) => {
    dragRef.current = { startY: clientY, startTop: sheetTop };
    setDragging(true);
  };
  const moveDrag = (clientY) => {
    if (!dragRef.current) return;
    const dy = clientY - dragRef.current.startY;
    const next = Math.max(FULL_TOP,
      Math.min(PHONE_H, dragRef.current.startTop + dy));
    setSheetTop(next);
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    setSheetTop((t) => {
      if (t > DISMISS_TOP) {
        window.setTimeout(requestClose, 0);
        return t;
      }
      const mid = (MID_TOP + FULL_TOP) / 2;
      return t < mid ? FULL_TOP : MID_TOP;
    });
    dragRef.current = null;
    setDragging(false);
  };

  const pointerHandlers = {
    onPointerDown: (e) => {
      if (e.target.closest && e.target.closest('[data-no-drag]')) return;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      beginDrag(e.clientY);
    },
    onPointerMove: (e) => {
      if (!dragRef.current) return;
      e.preventDefault();
      moveDrag(e.clientY);
    },
    onPointerUp: (e) => {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      endDrag();
    },
    onPointerCancel: (e) => {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      endDrag();
    },
  };

  const snapTransition = dragging ? 'none' : 'top 0.34s cubic-bezier(0.32, 0.72, 0, 1)';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 82,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        top: sheetTop, left: 0, right: 0, bottom: 0,
        background: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06), 0 -16px 48px rgba(0, 0, 0, 0.14)',
        overflow: 'hidden',
        transition: snapTransition,
        pointerEvents: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Drag handle row */}
        <div {...pointerHandlers} style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: 28, paddingTop: 12, flexShrink: 0,
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
        }}>
          <div style={{
            width: 48, height: 4, borderRadius: 7,
            background: 'rgba(9, 9, 11, 0.16)',
          }} />
        </div>

        {/* Section content — fills the rest, scrollable. */}
        <div data-no-drag className="phone-scroll" style={{
          flex: 1, minHeight: 0, overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '4px 0 24px',
        }}>
          {section === 'images' && <ImagesPanel />}
          {section === 'avatar' && <AvatarPanel />}
          {section === 'music'  && <MusicPanel  accent={accent} />}
          {section === 'ai'     && <AIPanel     accent={accent} />}
        </div>
      </div>
    </div>
  );
}

// ── Shared: Segmented control ───────────────────────────────────
// iOS-style 2-up pill. `tabs` is an array of { id, label }. Used by
// Music / Images / Avatar / AI panels so all section sheets share the
// same picker affordance.
function SegmentedControl({ tabs, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: 4, borderRadius: 999,
      background: 'rgba(9, 9, 11, 0.05)',
    }}>
      {tabs.map((s) => {
        const a = s.id === value;
        return (
          <button key={s.id} onClick={() => onChange(s.id)} style={{
            padding: '6px 14px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: a ? '#FFFFFF' : 'transparent',
            color: a ? '#1F1A23' : '#5C5C66',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 13, fontWeight: 600,
            boxShadow: a ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'background 0.16s ease, color 0.16s ease',
          }}>{s.label}</button>
        );
      })}
    </div>
  );
}

// ── Section: Images ─────────────────────────────────────────────
// Two sources: the user's camera roll (with a camera-launch tile)
// and content they've generated on Medeo. Switching tabs swaps the
// grid in place. A "Recents" filter pill is permanently anchored
// at the bottom of the panel via position:sticky so it stays in view
// at both MID and FULL sheet heights and across both tabs.
function ImagesPanel() {
  const [tab, setTab] = React.useState('album');
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('Recents');
  const recipes = window.RECIPES || [];
  // For the prototype, we treat the recipe images (which we already
  // have on disk) as the user's camera-roll thumbnails, and the
  // theme-gradient placeholders as "Medeo generations".
  const albumThumbs = recipes.filter((r) => r.image).map((r) => r.image);
  const medeoItems = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    image: r.image,
    bg: (window.CARD_THEMES && window.CARD_THEMES[r.theme] && window.CARD_THEMES[r.theme].bg) || '#EEEEF0',
  }));

  // Filter options differ by tab so the same pill makes sense in
  // either context (camera-roll albums vs Medeo-generated buckets).
  const filterOptions = tab === 'album'
    ? ['Recents', 'Favorites', 'Screenshots', 'Selfies', 'All photos']
    : ['Recents', 'My creations', 'Remixes', 'Drafts', 'All on Medeo'];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      minHeight: '100%',
      position: 'relative',
    }}>
      {/* Segmented control — centered. */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 12px' }}>
        <SegmentedControl
          tabs={[
            { id: 'album',  label: 'My album'    },
            { id: 'medeo',  label: 'On Medeo'    },
          ]}
          value={tab}
          onChange={(id) => { setTab(id); setFilter('Recents'); setFilterOpen(false); }}
        />
      </div>

      {/* Grid — natural height. Bottom padding leaves room for the
          sticky Recents pill so the last row never hides behind it. */}
      <div style={{ padding: '0 16px 76px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
        }}>
          {tab === 'album' && (
            <>
              <button style={{
                aspectRatio: '1', borderRadius: 14,
                background: 'rgba(9, 9, 11, 0.05)',
                border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 6,
                color: '#3F3F46',
              }}>
                <Icon.Camera size={26} stroke={1.6} />
                <span style={{
                  fontFamily: '"Manrope", system-ui, sans-serif',
                  fontSize: 12, fontWeight: 500,
                }}>Camera</span>
              </button>
              {albumThumbs.slice(0, 11).map((src, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: 14, overflow: 'hidden',
                  background: '#EEEEF0', cursor: 'pointer',
                }}>
                  <img src={src} alt="" draggable={false}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ))}
            </>
          )}

          {tab === 'medeo' && medeoItems.map((it) => (
            <div key={it.id} style={{
              aspectRatio: '1', borderRadius: 14, overflow: 'hidden',
              background: it.bg, cursor: 'pointer',
              position: 'relative',
              boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.04)',
            }}>
              {it.image && (
                <img src={it.image} alt="" draggable={false}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              )}
              {/* Tiny "Medeo" badge so generated items are visually
                  distinguishable from camera-roll items. */}
              <div style={{
                position: 'absolute', top: 6, left: 6,
                padding: '2px 6px', borderRadius: 6,
                background: 'rgba(20, 8, 60, 0.55)',
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 9, fontWeight: 700, color: '#FFFFFF',
                letterSpacing: 0.4, textTransform: 'uppercase',
              }}>Medeo</div>
            </div>
          ))}
        </div>
      </div>

      {/* Permanent filter pill — sticks to the bottom of the panel.
          `marginTop: auto` pushes it down when the grid is short;
          `position: sticky; bottom: 0` keeps it visible while the
          user scrolls through a long grid. Tap to open a small popup
          listing filter options. */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        marginTop: 'auto',
        display: 'flex', justifyContent: 'center',
        padding: '14px 16px 18px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 45%, #FFFFFF 100%)',
        pointerEvents: 'none',
      }}>
        <div style={{ position: 'relative', pointerEvents: 'auto' }}>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 18px',
              background: '#FFFFFF',
              border: '0.5px solid rgba(9, 9, 11, 0.10)',
              borderRadius: 999,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(20, 8, 60, 0.14), 0 1px 3px rgba(20, 8, 60, 0.06)',
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 14, fontWeight: 600, color: '#1F1A23',
            }}>
            <span>{filter}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#1F1A23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{
                transition: 'transform 0.18s ease',
                transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>
              <path d="M7 10l5 5 5-5"/>
            </svg>
          </button>

          {/* Popup — opens above the pill so it doesn't get clipped
              by the panel bottom edge. */}
          {filterOpen && (
            <>
              <div onClick={() => setFilterOpen(false)} style={{
                position: 'fixed', inset: 0, zIndex: 1,
              }} />
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)', left: '50%',
                transform: 'translateX(-50%)',
                minWidth: 200,
                background: '#FFFFFF',
                borderRadius: 14,
                border: '0.5px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 18px 40px rgba(20, 8, 60, 0.22), 0 4px 12px rgba(20, 8, 60, 0.08)',
                padding: 4,
                zIndex: 2,
                display: 'flex', flexDirection: 'column',
              }}>
                {filterOptions.map((opt) => {
                  const a = opt === filter;
                  return (
                    <button key={opt}
                      onClick={() => { setFilter(opt); setFilterOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 10,
                        border: 'none', cursor: 'pointer',
                        background: a ? 'rgba(124, 91, 253, 0.08)' : 'transparent',
                        fontFamily: '"Manrope", system-ui, sans-serif',
                        fontSize: 13.5, fontWeight: a ? 700 : 500,
                        color: '#1F1A23', textAlign: 'left',
                      }}>
                      <span>{opt}</span>
                      {a && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="#7C5BFD" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section: Avatar (Digital humans) ────────────────────────────
// Two sources: platform-curated "Featured" avatars and the user's
// own custom avatars ("My avatars"). The segmented control flips
// between the two grids; layout otherwise unchanged.
function AvatarPanel() {
  const [tab, setTab] = React.useState('featured');
  const featured = [
    { id: 'aria', name: 'Aria',  grad: 'linear-gradient(160deg, #FFD3A5 0%, #FD6585 100%)' },
    { id: 'jin',  name: 'Jin',   grad: 'linear-gradient(160deg, #84FAB0 0%, #8FD3F4 100%)' },
    { id: 'mira', name: 'Mira',  grad: 'linear-gradient(160deg, #A18CD1 0%, #FBC2EB 100%)' },
    { id: 'noah', name: 'Noah',  grad: 'linear-gradient(160deg, #4FACFE 0%, #00F2FE 100%)' },
    { id: 'sora', name: 'Sora',  grad: 'linear-gradient(160deg, #FF9A9E 0%, #FECFEF 100%)' },
    { id: 'kai',  name: 'Kai',   grad: 'linear-gradient(160deg, #FAD0C4 0%, #FFD1FF 100%)' },
    { id: 'iris', name: 'Iris',  grad: 'linear-gradient(160deg, #FBC2EB 0%, #A6C1EE 100%)' },
    { id: 'theo', name: 'Theo',  grad: 'linear-gradient(160deg, #C2E9FB 0%, #A1C4FD 100%)' },
    { id: 'luna', name: 'Luna',  grad: 'linear-gradient(160deg, #FFEDBC 0%, #ED4264 100%)' },
  ];
  const mine = [
    { id: 'me-1', name: 'My selfie', grad: 'linear-gradient(160deg, #C8B6A2 0%, #8E6F50 100%)' },
    { id: 'me-2', name: 'Studio',    grad: 'linear-gradient(160deg, #2E2A35 0%, #5B4E6A 100%)' },
    { id: 'me-3', name: 'Pastel',    grad: 'linear-gradient(160deg, #FFE5EC 0%, #D5C6FF 100%)' },
  ];
  const items = tab === 'featured' ? featured : mine;

  return (
    <div style={{ padding: '0 16px' }}>
      {/* Header — title + caption stacked, then segmented control
          centered on its own row. */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8, padding: '4px 0 10px',
      }}>
        <div style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 13, fontWeight: 600, color: '#1F1A23',
        }}>Digital humans</div>
        <div style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 12, color: '#9BA0AB',
        }}>Pick a character voice</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 14 }}>
        <SegmentedControl
          tabs={[
            { id: 'featured', label: 'Featured'   },
            { id: 'mine',     label: 'My avatars' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {/* "Create new" tile only appears under "My avatars". */}
        {tab === 'mine' && (
          <button style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: '50%',
              background: 'rgba(9, 9, 11, 0.05)',
              border: '1px dashed rgba(9, 9, 11, 0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#5C5C66',
            }}>
              <Icon.Plus size={22} stroke={2.2} />
            </div>
            <span style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 12, fontWeight: 600, color: '#5C5C66',
            }}>Create new</span>
          </button>
        )}
        {items.map((a) => (
          <button key={a.id} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          }}>
            <div style={{
              width: '100%', aspectRatio: '1', borderRadius: '50%',
              background: a.grad,
              boxShadow: '0 4px 12px rgba(20, 8, 60, 0.10), inset 0 2px 6px rgba(255,255,255,0.4)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', inset: '24% 28% 36%',
                background: 'rgba(255,255,255,0.85)', borderRadius: '50%',
              }} />
              <div style={{
                position: 'absolute', inset: '22% 22% 18%',
                background: 'rgba(0,0,0,0.18)', borderRadius: '50% 50% 40% 40%',
                clipPath: 'inset(50% 0 0 0)',
              }} />
            </div>
            <span style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 12, fontWeight: 600, color: '#1F1A23',
            }}>{a.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Section: Music ──────────────────────────────────────────────
// Segmented control (Trending / My Library) + list of tracks with
// play icon, name, length, and add (+) button. Sticky "Import audio"
// CTA pinned to the bottom.
function MusicPanel({ accent }) {
  const [tab, setTab] = React.useState('trending');
  const tracks = tab === 'trending'
    ? [
        { id: 1, title: 'Skeleton Banging Shield', kind: 'Sfx', len: '00:06' },
        { id: 2, title: 'Ronaldo Meme',            kind: 'Bgm', len: '00:15' },
        { id: 3, title: 'I Got Like Hella Money',  kind: 'Bgm', len: '00:20' },
        { id: 4, title: 'Cityboy Meme',            kind: 'Sfx', len: '00:02' },
        { id: 5, title: 'Banana Cat Crying',       kind: 'Sfx', len: '00:05' },
        { id: 6, title: 'Cat Dilemma',             kind: 'Bgm', len: '00:23' },
        { id: 7, title: 'AI Baby',                 kind: 'Bgm', len: '00:14' },
        { id: 8, title: 'Cityboy Rap',             kind: 'Bgm', len: '00:33' },
      ]
    : [
        { id: 'u1', title: 'voicenote-monday.m4a', kind: 'Upload', len: '01:12' },
        { id: 'u2', title: 'office-ambience.mp3',  kind: 'Upload', len: '02:40' },
      ];

  const swatches = [
    'linear-gradient(160deg, #FFD3A5 0%, #FD6585 100%)',
    'linear-gradient(160deg, #84FAB0 0%, #8FD3F4 100%)',
    'linear-gradient(160deg, #FFEDBC 0%, #ED4264 100%)',
    'linear-gradient(160deg, #A18CD1 0%, #FBC2EB 100%)',
    'linear-gradient(160deg, #4FACFE 0%, #00F2FE 100%)',
    'linear-gradient(160deg, #FAD0C4 0%, #FFD1FF 100%)',
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0,
      position: 'relative',
    }}>
      {/* Segmented control — centered. */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 12px' }}>
        <SegmentedControl
          tabs={[
            { id: 'trending', label: 'Trending'   },
            { id: 'library',  label: 'My Library' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {/* Track list */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        paddingBottom: 80,
      }}>
        {tracks.map((tr, i) => (
          <div key={tr.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: swatches[i % swatches.length],
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <Icon.Play2 size={14} color="#FFFFFF" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 14, fontWeight: 600, color: '#1F1A23',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{tr.title}</div>
              <div style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 12, color: '#9BA0AB', marginTop: 2,
              }}>{tr.kind} · {tr.len}</div>
            </div>
            <button aria-label="Add" style={{
              width: 30, height: 30, borderRadius: 999,
              background: 'rgba(9, 9, 11, 0.06)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#3F3F46', padding: 0,
            }}>
              <Icon.Plus size={16} stroke={2.2} />
            </button>
          </div>
        ))}
      </div>

      {/* Import audio CTA — sticky bottom */}
      <div style={{
        position: 'sticky', bottom: 0, left: 0, right: 0,
        padding: '8px 0 16px',
        display: 'flex', justifyContent: 'center',
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 50%, #FFFFFF 100%)',
      }}>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 18px',
          background: '#1F1A23', color: '#FFFFFF',
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 14, fontWeight: 600, letterSpacing: 0.1,
          boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12"/>
            <path d="M7 8l5-5 5 5"/>
            <path d="M5 21h14"/>
          </svg>
          <span>Import Audio</span>
        </button>
      </div>
    </div>
  );
}

// ── Section: AI Generation ──────────────────────────────────────
// "Describe what you'd like to make" pattern: small describe field
// at the bottom, soft image placeholder + Cutout/Original segmented
// control on top.
function AIPanel({ accent }) {
  const [mode, setMode] = React.useState('cutout');
  const [prompt, setPrompt] = React.useState('');
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0,
      padding: '4px 16px 0',
    }}>
      {/* Segmented control */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 16 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: 4, borderRadius: 999,
          background: 'rgba(9, 9, 11, 0.05)',
        }}>
          {[
            { id: 'cutout',   label: 'Cutout' },
            { id: 'original', label: 'Original' },
          ].map((s) => {
            const a = s.id === mode;
            return (
              <button key={s.id} onClick={() => setMode(s.id)} style={{
                padding: '6px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: a ? '#FFFFFF' : 'transparent',
                color: a ? '#1F1A23' : '#5C5C66',
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 13, fontWeight: 600,
                boxShadow: a ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'background 0.16s ease, color 0.16s ease',
              }}>{s.label}</button>
            );
          })}
        </div>
      </div>

      {/* Image placeholder */}
      <div style={{ display: 'flex', justifyContent: 'center', flex: 1, alignItems: 'center' }}>
        <div style={{
          width: 120, height: 120, borderRadius: 24,
          background: 'rgba(9, 9, 11, 0.05)',
          border: '1px dashed rgba(9,9,11,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(9, 9, 11, 0.35)',
        }}>
          <Icon.Photo size={36} stroke={1.6} />
        </div>
      </div>

      {/* Describe input — pill */}
      <div style={{ padding: '16px 0 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 8px 8px 14px',
          background: 'rgba(9, 9, 11, 0.05)',
          borderRadius: 999,
        }}>
          <Icon.Wand size={18} color="#5C5C66" stroke={1.8} />
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="a green slime baby..."
            style={{
              flex: 1, minWidth: 0,
              border: 'none', outline: 'none', background: 'transparent',
              padding: 0,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 14, color: '#1F1A23',
            }}
          />
          <button aria-label="Generate" disabled={!prompt.trim()} style={{
            width: 32, height: 32, borderRadius: 999,
            border: 'none', padding: 0,
            background: prompt.trim() ? accent : 'rgba(9,9,11,0.10)',
            color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: prompt.trim() ? 'pointer' : 'default',
            boxShadow: prompt.trim() ? `0 4px 12px ${accent}55` : 'none',
            transition: 'background 0.16s ease',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="M13 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function FakeKeyboard() {
  // Minimal iOS-look keyboard. Pure decorative.
  const rows = [
    ['q','w','e','r','t','y','u','i','o','p'],
    ['a','s','d','f','g','h','j','k','l'],
    ['z','x','c','v','b','n','m'],
  ];
  return (
    <div className="sheet-enter" style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      paddingTop: 8, paddingBottom: 34, background: 'rgba(210,213,219,0.92)',
      backdropFilter: 'blur(20px)',
    }}>
      <div style={{ padding: '6px 4px 8px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{
            display: 'flex', gap: 6, padding: ri === 1 ? '0 18px' : (ri === 2 ? '0 4px' : '0 4px'),
            justifyContent: 'center',
          }}>
            {ri === 2 && <Key wide><Icon.Chevron dir="up" size={14} color="#000"/></Key>}
            {row.map((c) => <Key key={c}>{c}</Key>)}
            {ri === 2 && <Key wide><Icon.Close size={14} color="#000"/></Key>}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
          <Key style={{ width: 72, fontSize: 14 }}>123</Key>
          <Key style={{ width: 38 }}>😀</Key>
          <Key style={{ flex: 1, fontSize: 14 }}>space</Key>
          <Key style={{ width: 110, fontSize: 14, background: '#fff' }}>return</Key>
        </div>
      </div>
    </div>
  );
}

function Key({ children, wide, style = {} }) {
  return (
    <div style={{
      flex: wide ? undefined : 1,
      width: wide ? 38 : undefined,
      height: 42, borderRadius: 6,
      background: '#fff', boxShadow: '0 1px 0 rgba(0,0,0,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 21, fontFamily: '-apple-system, system-ui', color: '#000',
      ...style,
    }}>{children}</div>
  );
}

// ──────────────────────────────────────────────
// Projects sidebar (slides in from right)
// ──────────────────────────────────────────────
function ProjectsSheet({ onClose, onOpenProfile, accent }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)',
        animation: 'fade 0.25s ease',
      }} />
      <div className="slide-in-right" style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '86%',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        borderRadius: '28px 0 0 28px',
        padding: '56px 18px 24px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-12px 0 40px rgba(40,20,90,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={onClose} style={{
            width: 38, height: 38, borderRadius: 999, border: 'none',
            background: 'rgba(255,255,255,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.06)',
          }}>
            <Icon.Close size={16} color="#0A0A0A" />
          </button>
        </div>

        <div style={{ padding: '0 4px', marginBottom: 14, fontSize: 14, color: '#5C5C66', fontWeight: 500 }}>
          Recent projects
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 4px', overflow: 'auto' }} className="phone-scroll">
          {window.PROJECTS.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 14,
                background: window.CARD_THEMES[p.theme]?.bg || '#eee',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 600, color: '#0A0A0A', marginBottom: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{p.title}</div>
                <div style={{ fontSize: 12.5, color: '#9BA0AB' }}>{p.when}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
          <button style={{
            padding: '10px 22px', fontSize: 14.5, fontWeight: 600, color: '#0A0A0A',
            background: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>View all projects</button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Upgrade banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: 16, borderRadius: 20, marginBottom: 12,
          background: 'linear-gradient(135deg, #EDE6FF 0%, #DCD0FF 100%)',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent,
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill={accent}>
              <path d="M12 2l2.5 3.8 4.5.7-3.3 3.2.8 4.5L12 12l-4.5 2.2.8-4.5-3.3-3.2 4.5-.7L12 2z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#4a30c4' }}>Upgrade</div>
            <div style={{ fontSize: 12.5, color: '#5a4a90', marginTop: 1, lineHeight: 1.4 }}>
              Get full access to premium features and higher usage
            </div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 999, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accent,
          }}>
            <Icon.Chevron color={accent} size={14} stroke={2.4} />
          </div>
        </div>

        {/* User row */}
        <div onClick={onOpenProfile} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', borderRadius: 18,
          background: '#fff', cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}>
          <Avatar size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: '#0A0A0A' }}>Hi, Yvonne Zhan</div>
            <div style={{ fontSize: 12.5, color: '#9BA0AB' }}>UID: 26860</div>
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: accent,
            background: '#EDE6FF', padding: '4px 10px', borderRadius: 8,
          }}>Pro</div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Profile sheet
// ──────────────────────────────────────────────
function ProfileSheet({ onClose, accent }) {
  const items = [
    { icon: <Icon.Sparkle size={18} color="#0A0A0A" />, label: 'My subscription' },
    { icon: <Icon.Refresh size={18} color="#0A0A0A" />, label: 'Restore Purchases' },
    { icon: <Icon.User size={20} color="#0A0A0A" />, label: 'Account' },
    { icon: <Icon.Settings size={19} color="#0A0A0A" />, label: 'Settings' },
    { icon: <Icon.Chat size={19} color="#0A0A0A" />, label: 'Get support' },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 85 }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.2)',
        animation: 'fade 0.25s ease',
      }} />
      <div className="sheet-enter screen-fade phone-scroll" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(170deg, #E9DEF7 0%, #F4EEFC 28%, #FBFAFE 60%)',
        paddingTop: 56, overflow: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', marginBottom: 12,
        }}>
          <button onClick={onClose} style={{
            width: 40, height: 40, borderRadius: 999, border: 'none',
            background: 'rgba(255,255,255,0.6)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 0 0 0.5px rgba(0,0,0,0.07)',
          }}>
            <Icon.Back size={20} color="#0A0A0A" />
          </button>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0A0A0A' }}>Profile</div>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 8px' }}>
          <Avatar size={104} radius={26} />
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0A0A0A', marginTop: 14, letterSpacing: -0.4 }}>Yvonne Zhan</div>
          <div style={{ fontSize: 14, color: '#9BA0AB', marginTop: 4 }}>UID: 26860</div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: accent,
            background: '#EDE6FF', padding: '5px 14px', borderRadius: 10,
            marginTop: 10,
          }}>Pro</div>
        </div>

        <div style={{ padding: '24px 16px 120px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((it) => (
            <button key={it.label} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px', border: 'none', background: 'transparent',
              cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 999,
                background: 'rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 0 0.5px rgba(0,0,0,0.06)',
              }}>{it.icon}</div>
              <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{it.label}</div>
              <Icon.Chevron size={16} color="#9BA0AB" />
            </button>
          ))}
          <button style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', border: 'none', background: 'transparent',
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 999,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 0.5px rgba(0,0,0,0.06)',
            }}>
              <Icon.Logout size={18} color="#E53935" />
            </div>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#E53935' }}>Logout</div>
            <Icon.Chevron size={16} color="#9BA0AB" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Avatar — placeholder mask figure
function Avatar({ size = 38, radius }) {
  const r = radius != null ? radius : Math.round(size * 0.28);
  return (
    <div style={{
      width: size, height: size, borderRadius: r,
      background: 'linear-gradient(160deg, #C8B6A2 0%, #8E6F50 100%)',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 0 0 0.5px rgba(0,0,0,0.06)',
    }}>
      {/* hoodie shape */}
      <div style={{
        position: 'absolute', top: '14%', left: '14%', right: '14%', bottom: 0,
        background: '#5B432E', borderRadius: '50% 50% 0 0 / 60% 60% 0 0',
      }} />
      {/* face (mask area) */}
      <div style={{
        position: 'absolute', top: '38%', left: '32%', width: '36%', aspectRatio: 1,
        background: '#fff', borderRadius: '50%',
      }} />
      {/* sunglasses */}
      <div style={{
        position: 'absolute', top: '34%', left: '24%', right: '24%', height: '14%',
        background: '#1A1A22', borderRadius: 999,
      }} />
    </div>
  );
}

// ──────────────────────────────────────────────
// QueuePanel — floating panel anchored above the bottom-nav "+" FAB.
// Lists the in-flight generation jobs (thumb, title, progress bar,
// cancel). Renders a click-outside backdrop so taps elsewhere close it.
// ──────────────────────────────────────────────
function QueuePanel({ queue, accent, onCancel, onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 78 }}>
      {/* Click-outside layer — fully transparent, just intercepts taps. */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />

      {/* Panel — anchored just above the bottom nav (nav lives at
          bottom: 24, FAB ~52 tall + queue badge ~28). Place panel at
          bottom: 24 + 52 + 28 + 12 = 116. Right-aligned with the FAB. */}
      <div className="sheet-enter" style={{
        position: 'absolute',
        bottom: 132, right: 20,
        width: 280, maxHeight: 360,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRadius: 22,
        boxShadow: '0 24px 60px rgba(20, 8, 60, 0.24), 0 4px 12px rgba(20, 8, 60, 0.10), inset 0 1px 1px rgba(255,255,255,0.7)',
        border: '0.5px solid rgba(0, 0, 0, 0.06)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 8px',
        }}>
          <div style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14, fontWeight: 700, color: '#1F1A23',
            letterSpacing: -0.1,
          }}>Generating <span style={{ color: accent }}>{queue.length}</span></div>
          <button onClick={onClose} aria-label="Close queue" style={{
            width: 26, height: 26, borderRadius: 999,
            background: 'rgba(9, 9, 11, 0.06)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
          }}>
            <Icon.Close size={12} color="#3F3F46" stroke={2.2} />
          </button>
        </div>

        {/* Item list */}
        <div className="phone-scroll" style={{
          flex: 1, overflow: 'auto', padding: '4px 8px 12px',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          {queue.map((it) => {
            const pct = Math.round((it.progress || 0) * 100);
            const theme = (window.CARD_THEMES && window.CARD_THEMES[it.theme]) || null;
            return (
              <div key={it.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px',
                borderRadius: 14,
              }}>
                {/* Thumb */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: theme ? theme.bg : '#EEEEF0',
                  flexShrink: 0, overflow: 'hidden', position: 'relative',
                }}>
                  {it.image && (
                    <img src={it.image} alt=""
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>

                {/* Title + progress bar */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: '"Manrope", system-ui, sans-serif',
                    fontSize: 13, fontWeight: 600, color: '#1F1A23',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    letterSpacing: -0.05,
                  }}>{it.title}</div>
                  <div style={{
                    marginTop: 4,
                    height: 4, borderRadius: 999,
                    background: 'rgba(9, 9, 11, 0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: accent,
                      borderRadius: 999,
                      transition: 'width 0.3s linear',
                    }} />
                  </div>
                  <div style={{
                    fontFamily: '"Manrope", system-ui, sans-serif',
                    fontSize: 11, color: '#9BA0AB', marginTop: 3,
                  }}>{pct}% · ~{Math.max(1, Math.ceil((1 - (it.progress || 0)) * 30))}s left</div>
                </div>

                {/* Cancel */}
                <button onClick={() => onCancel && onCancel(it.id)} aria-label="Cancel" style={{
                  width: 26, height: 26, borderRadius: 999,
                  background: 'rgba(9, 9, 11, 0.06)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, flexShrink: 0, color: '#3F3F46',
                }}>
                  <Icon.Close size={11} stroke={2.2} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.ComposerSheet = ComposerSheet;
window.ProjectsSheet = ProjectsSheet;
window.ProfileSheet = ProfileSheet;
window.QueuePanel = QueuePanel;
window.Avatar = Avatar;
