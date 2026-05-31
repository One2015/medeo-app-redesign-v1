// screens.jsx — Home, Notification, InputActive, Projects, Profile

// ──────────────────────────────────────────────
// Recipe card — Figma RecipeCoverCard (node 18606:24555 et al.).
// Thumbnail height comes from either `recipe.thumbHeight` (fixed px,
// matching Figma "h-[145px]" / "h-[177px]") or `recipe.thumbAspect`
// (CSS aspect-ratio string, matching "aspect-[240/402]"). The "New" tag
// sits inside the thumbnail. Information section below uses Manrope 12px.
// ──────────────────────────────────────────────
function RecipeCard({ recipe, onClick, onLongPress }) {
  const theme = window.CARD_THEMES[recipe.theme] || window.CARD_THEMES.jelly;
  const [imageFailed, setImageFailed] = React.useState(false);
  const hasImage = recipe.image && !imageFailed;

  const thumbStyle = recipe.thumbHeight
    ? { height: recipe.thumbHeight }
    : { aspectRatio: recipe.thumbAspect || '240/402' };

  // Long-press → open the share/view page (mimics native share-link landing).
  // We disable the regular onClick when a long-press fires so a single
  // gesture can't both open the detail page and the share view.
  const longRef = React.useRef({ timer: null, fired: false, startX: 0, startY: 0 });
  const startLongPress = React.useCallback((e) => {
    if (!onLongPress) return;
    longRef.current.fired = false;
    const p = e.touches ? e.touches[0] : e;
    longRef.current.startX = p.clientX;
    longRef.current.startY = p.clientY;
    longRef.current.timer = window.setTimeout(() => {
      longRef.current.fired = true;
      onLongPress();
    }, 450);
  }, [onLongPress]);
  const moveLongPress = React.useCallback((e) => {
    if (!longRef.current.timer) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = Math.abs(p.clientX - longRef.current.startX);
    const dy = Math.abs(p.clientY - longRef.current.startY);
    if (dx > 8 || dy > 8) {
      window.clearTimeout(longRef.current.timer);
      longRef.current.timer = null;
    }
  }, []);
  const endLongPress = React.useCallback(() => {
    if (longRef.current.timer) {
      window.clearTimeout(longRef.current.timer);
      longRef.current.timer = null;
    }
  }, []);

  const handleClick = (e) => {
    if (longRef.current.fired) {
      longRef.current.fired = false;
      e && e.preventDefault && e.preventDefault();
      return;
    }
    onClick && onClick(e);
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onPointerDown={startLongPress}
      onPointerMove={moveLongPress}
      onPointerUp={endLongPress}
      onPointerCancel={endLongPress}
      onPointerLeave={endLongPress}
      onContextMenu={onLongPress ? (e) => { e.preventDefault(); onLongPress(); } : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      } : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none', WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      <div className="recipe-card" style={{
        ...thumbStyle,
        background: hasImage ? '#f0eaf6' : theme.bg,
      }}>
        {hasImage ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            onError={() => setImageFailed(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <>
            {/* Subtle stripes — gives the gradient placeholder some texture. */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 14px)',
            }} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'ui-monospace, Menlo, monospace',
              fontSize: 11, color: 'rgba(0,0,0,0.32)', textAlign: 'center', padding: 12, lineHeight: 1.4,
              mixBlendMode: 'multiply',
            }}>
              {theme.label}
            </div>
          </>
        )}
        {recipe.isNew && (
          <div className="badge-new">
            <Icon.Sparkle size={11} color="#fff" />
            <span>New</span>
          </div>
        )}
      </div>
      {/* Information section — Figma node 18606:24560.
          padding 4px/8px (vertical/horizontal), 8px gap, title (Manrope
          SemiBold 12px #1f1a23, ellipsis) + price (16px bolt + 12px num). */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 8px', width: '100%',
      }}>
        <div style={{
          flex: 1, minWidth: 0,
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 12, lineHeight: '17px', fontWeight: 600, letterSpacing: 0.2,
          color: '#1F1A23',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{recipe.title}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}>
          <Icon.Bolt size={16} />
          <span style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 12, lineHeight: '17px', fontWeight: 500, letterSpacing: 0.2,
            color: '#3F3F46',
          }}>{recipe.credits}</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Home — 1:1 Figma node 17430:15227 (Homepage).
//   Top section (absolute, top:0) houses the status bar, header (Recipe
//   title + credits pill + menu circle), and chip row. Content section
//   (absolute, top:161px) hosts the showcaseFeeds masonry — two columns,
//   8px gap between, 4px gap inside each column.
//   We render the chips inside the sticky top so they stay visible while
//   cards scroll under them, matching the Figma "fixed top, scrolling body"
//   composition.
// ──────────────────────────────────────────────
function HeaderCreditsPill({ value = 333, reward, onClick }) {
  const [displayValue, setDisplayValue] = React.useState(value);
  const [rolling, setRolling] = React.useState(false);
  const prevRewardId = React.useRef(null);

  React.useEffect(() => {
    if (!reward || prevRewardId.current === reward.id) {
      setDisplayValue(value);
      return;
    }
    prevRewardId.current = reward.id;
    const amount = typeof reward.amount === 'number' ? reward.amount : 0;
    const start = Math.max(0, value - amount);
    const end = value;
    let frame = 0;
    const frames = 18;
    setRolling(true);
    setDisplayValue(start);

    const id = window.setInterval(() => {
      frame += 1;
      const t = frame / frames;
      // Ease-out count-up with a tiny slot-machine jitter in the first
      // half, then settle exactly on the final balance.
      const eased = 1 - Math.pow(1 - Math.min(1, t), 3);
      const jitter = t < 0.55 ? Math.floor(Math.random() * 7) - 3 : 0;
      const next = frame >= frames
        ? end
        : Math.min(end, Math.max(start, Math.round(start + (end - start) * eased + jitter)));
      setDisplayValue(next);
      if (frame >= frames) {
        window.clearInterval(id);
        setDisplayValue(end);
        window.setTimeout(() => setRolling(false), 280);
      }
    }, 52);

    return () => window.clearInterval(id);
  }, [value, reward && reward.id, reward && reward.amount]);

  // Figma node I17430:15248;2215:20288. Pill button with frosted-glass
  // backdrop and a soft inner highlight — the "liquid glass" look.
  return (
    <button onClick={onClick} aria-label="Open credits" style={{
      position: 'relative', display: 'inline-flex',
      borderRadius: 1000, overflow: 'hidden',
      border: rolling
        ? '1px solid rgba(134,61,251,0.42)'
        : '1px solid rgba(255,255,255,0.16)',
      transform: rolling ? 'translateY(-1px) scale(1.035)' : 'translateY(0) scale(1)',
      transition: 'transform 0.18s ease, border-color 0.18s ease',
      background: 'transparent',
      padding: 0,
      cursor: 'pointer',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: rolling
          ? 'rgba(134,61,251,0.14)'
          : 'rgba(29,27,32,0.12)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        pointerEvents: 'none',
        transition: 'background 0.18s ease',
      }} />
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '12px 16px 12px 12px',
      }}>
        <Icon.Bolt size={18} color={rolling ? 'var(--color-schemes-primary)' : undefined} />
        <span style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 12, lineHeight: '17px', fontWeight: 600, letterSpacing: 0.2,
          color: rolling ? 'var(--color-schemes-primary)' : '#09090B',
          fontVariantNumeric: 'tabular-nums',
          minWidth: 32,
          textAlign: 'right',
          display: 'inline-block',
          transform: rolling ? 'translateY(-1px)' : 'translateY(0)',
          transition: 'transform 0.16s ease, color 0.18s ease',
        }}>{displayValue.toLocaleString()}</span>
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: rolling
          ? 'inset 0 1px 1px rgba(255,255,255,0.7), inset 0 5px 10px rgba(255,255,255,0.4), 0 0 18px rgba(134,61,251,0.26)'
          : 'inset 0 1px 1px rgba(255,255,255,0.5), inset 0 5px 10px rgba(255,255,255,0.4)',
        transition: 'box-shadow 0.18s ease',
      }} />
    </button>
  );
}

// Header avatar button — replaces the hamburger as the top-right
// affordance. Project access has moved to the bottom nav's left FAB,
// so this slot is now the user's profile entry point.
function HeaderProfileButton({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Open profile" style={{
      position: 'relative', width: 50, height: 50, borderRadius: 1000,
      border: '1px solid rgba(255,255,255,0.16)',
      background: 'transparent', padding: 0,
      cursor: 'pointer', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'rgba(244,244,245,0.16)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        pointerEvents: 'none',
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 5px 10px rgba(255,255,255,0.15)',
      }} />
      <div style={{
        position: 'relative', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Avatar size={38} radius={999} />
      </div>
    </button>
  );
}

function HomeScreen({ onTapInput, onOpenProjects, onOpenProfile, onOpenCredits, onOpenRecipe, onLongPressRecipe, scrollRef, onScroll, activeChip, setActiveChip, accent, credits = 333, creditsReward }) {
  const [discordDismissed, setDiscordDismissed] = React.useState(false);
  const openDiscord = React.useCallback(() => {
    if (typeof window.__toast === 'function') {
      window.__toast({ kind: 'announce', title: 'Opening Discord…', body: 'Taking you to the Medeo community' });
    }
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F4F4F5' }}>
      {/* Decorative bg blob — Figma's BG node uses a 209px blurred image at
          20% opacity to tint the top. We don't have the asset so we fake the
          same visual outcome with a soft radial wash plus the Figma "top"
          gradient overlay (rgba(254,247,255,0.16) → 0). */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 209,
        background: 'radial-gradient(120% 100% at 15% 0%, rgba(220, 200, 255, 0.55) 0%, rgba(255, 220, 235, 0.35) 35%, rgba(244,244,245,0) 75%)',
        filter: 'blur(50px)', opacity: 0.9, pointerEvents: 'none',
      }} />

      {/* Sticky top section — Figma node 17430:15231 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        background: 'linear-gradient(180deg, rgba(254,247,255,0.16) 0%, rgba(254,247,255,0) 100%)',
      }}>
        {/* Header — Figma node 17430:15248. padding 12px vertical, 20px horizontal */}
        <div style={{
          paddingTop: 54, // status bar height (Figma 17430:15232)
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px',
          }}>
            <h1 className="h-recipe" style={{ margin: 0 }}>Recipe</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeaderCreditsPill value={credits} reward={creditsReward} onClick={onOpenCredits} />
              <HeaderProfileButton onClick={onOpenProfile} />
            </div>
          </div>

          {/* Discord community banner — sits between the title and the
              chip tabs. Dismissible so it doesn't nag members who've
              joined. Discord brand blurple accent; DS card radius/shadow. */}
          {!discordDismissed && (
            <div style={{ padding: '4px 20px 10px' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={openDiscord}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDiscord(); } }}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 12px 12px 12px',
                  borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(88,101,242,0.12) 0%, rgba(255,255,255,0.94) 60%)',
                  border: '0.5px solid rgba(88,101,242,0.22)',
                  boxShadow: '0 6px 18px rgba(60,40,140,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: '#5865F2',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(88,101,242,0.36)',
                }}>
                  <Icon.Discord size={24} color="#FFFFFF" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: '"Manrope", system-ui, sans-serif',
                    fontSize: 13.5, fontWeight: 800, letterSpacing: -0.2,
                    color: '#1F1A23', lineHeight: '18px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>Join the Discord community</div>
                  <div style={{
                    fontFamily: '"Manrope", system-ui, sans-serif',
                    fontSize: 12, fontWeight: 500,
                    color: '#6B6670', lineHeight: '16px', marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>Earn 50 credits when you join</div>
                </div>
                <span style={{
                  flexShrink: 0,
                  height: 32, padding: '0 16px',
                  borderRadius: 999,
                  background: accent || '#863dfb',
                  color: '#FFFFFF',
                  fontFamily: '"Manrope", system-ui, sans-serif',
                  fontSize: 13, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(134,61,251,0.30)',
                }}>Join</span>
                <button
                  aria-label="Dismiss"
                  onClick={(e) => { e.stopPropagation(); setDiscordDismissed(true); }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 22, height: 22, borderRadius: 999,
                    border: 'none', background: 'rgba(31,26,35,0.06)',
                    color: '#6B6670', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, lineHeight: 1, padding: 0,
                  }}
                >×</button>
              </div>
            </div>
          )}

          {/* RecipeChipGroups — text tabs with underline indicator.
              16px gap between items, 20px outer padding, items align
              along their baseline so the underline reads as a row rule. */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 16,
            padding: '0 20px', overflow: 'hidden',
          }}>
            {window.CHIPS.map((c) => {
              const isActive = c === activeChip;
              return (
                <button
                  key={c}
                  onClick={() => setActiveChip(c)}
                  className={'chip' + (isActive ? ' active' : '')}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scroll body — content area, Figma node 17430:15229.
          padding 12px vertical, 20px horizontal. Sits below sticky top. */}
      <div ref={scrollRef} onScroll={onScroll} className="phone-scroll screen-fade" style={{
        position: 'absolute', inset: 0, overflow: 'auto',
        paddingTop: discordDismissed ? 161 : 235, paddingBottom: 140,
        transition: 'padding-top 0.2s ease',
      }}>
        {/* showcaseFeeds — Figma node 18606:24553. 2 columns, 8px gap. */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-start',
          padding: '12px 20px 0',
        }}>
          {['L', 'R'].map((col) => (
            <div key={col} style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              {window.RECIPES.filter((r) => r.col === col).map((r) => (
                <RecipeCard
                  key={r.id}
                  recipe={r}
                  onClick={onOpenRecipe ? () => onOpenRecipe(r) : undefined}
                  onLongPress={onLongPressRecipe ? () => onLongPressRecipe(r) : undefined}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Notification screen
// ──────────────────────────────────────────────
// Badge that overlays the bottom-right of each notification thumbnail.
// `kind` picks the glyph; the bg is always the brand accent so the badge
// reads as a single visual system across notification types.
function NotifBadge({ kind, accent }) {
  const glyph = kind === 'ready'    ? <Icon.Sparkle size={12} color="#fff" />
              : kind === 'failed'   ? <Icon.Warning size={13} color="#fff" />
              : kind === 'announce' ? <Icon.Megaphone size={13} color="#fff" />
              : null;
  // Failed badges flip to a red wash to distinguish error states from
  // happy-path completions / official template announcements.
  const bg = kind === 'failed'
    ? 'linear-gradient(160deg, #FF4D4F 0%, #C8261D 100%)'
    : `linear-gradient(160deg, ${accent} 0%, ${accent}cc 100%)`;
  const shadow = kind === 'failed'
    ? '0 4px 10px rgba(200, 38, 29, 0.35), 0 0 0 2px #fff'
    : `0 4px 10px ${accent}55, 0 0 0 2px #fff`;
  return (
    <div style={{
      position: 'absolute', right: -4, bottom: -4,
      width: 26, height: 26, borderRadius: 999,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: shadow,
    }}>
      {glyph}
    </div>
  );
}

function NotificationScreen({ scrollRef, onScroll, onOpenRecipe, onOpenShareView, onOpenSharePage, onGoHome, onBack, accent, notifications }) {
  const list = notifications || window.NOTIFICATIONS || [];
  // Build a recipe-shaped object for a "Try it now" notification.
  // We prefer an existing recipe sharing the same theme (so the detail
  // page gets real imagery + description), and fall back to a synthetic
  // object derived from the notification copy when no match exists.
  const recipeForNotif = React.useCallback((n) => {
    const recipes = window.RECIPES || [];
    const match = recipes.find((r) => r.theme === n.theme);
    // 'ready' / 'failed' = the user's own creation (success vs. error).
    // Use the source recipe unchanged so the next screen shows the real
    // recipe title and prompt instead of the notification announcement
    // copy ("Your creation is ready!", "Generation failed", ...).
    if ((n.kind === 'ready' || n.kind === 'failed') && match) {
      return match;
    }
    if (match) {
      return {
        ...match,
        title: n.title.replace(/\s+(is here|is now live)\.?$/i, '').trim() || match.title,
        description: n.body || match.description,
      };
    }
    return {
      id: n.id, theme: n.theme, credits: 12, isNew: true,
      title: n.title.replace(/\s+(is here|is now live)\.?$/i, '').trim(),
      description: n.body,
    };
  }, []);

  // Route the tap based on what the notification represents:
  //   • kind === 'ready'  → "View creation" → the share-view page that
  //                          plays the finished video full-bleed.
  //   • kind === 'failed' → tap card body → the recipe detail page with
  //                          the config sheet auto-open so the user
  //                          lands directly on the form to tweak inputs
  //                          and retry (matches PRD § 7.1.2 matrix).
  //                          The inline Retry link now routes to the
  //                          same config sheet — no direct re-enqueue.
  //   • kind === 'announce' → "Try it now" → the recipe detail
  //                          page so the user can review and try.
  const handleNotifTap = React.useCallback((n) => {
    const recipe = recipeForNotif(n);
    if (n.kind === 'ready' && onOpenShareView) {
      onOpenShareView(recipe);
    } else if (onOpenRecipe) {
      const opts = n.kind === 'failed' ? { autoOpenConfig: true } : undefined;
      onOpenRecipe(recipe, opts);
    }
  }, [onOpenRecipe, onOpenShareView, recipeForNotif]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Glass back button — only rendered when this screen is reused
          as a pushed secondary page. In the main tab bar this prop is
          omitted, so Notification is a first-level destination. */}
      {onBack && <DetailBackButton onBack={onBack} />}

      {/* Sticky header — title + descriptive subtitle. Title shifts
          right when the back button is present so they don't collide. */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: 56, paddingBottom: 14,
        background: 'linear-gradient(180deg, rgba(247,242,253,0.94) 0%, rgba(247,242,253,0.82) 60%, rgba(247,242,253,0) 100%)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
      }}>
        <div style={{ padding: onBack ? '0 20px 0 68px' : '0 20px' }}>
          <h1 className="h-recipe" style={{ margin: 0 }}>Notification</h1>
          <div style={{ fontSize: 13.5, color: '#5C5C66', marginTop: 6, fontWeight: 400, lineHeight: 1.35 }}>
            Updates about your creations and new ideas.
          </div>
        </div>
      </div>

      {/* Scroll body */}
      <div ref={scrollRef} onScroll={onScroll} className="phone-scroll screen-fade" style={{
        position: 'absolute', inset: 0, overflow: 'auto',
        paddingTop: 130, paddingBottom: onBack ? 48 : 140,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 16px 0' }}>
          {list.map((n) => {
            const theme = window.CARD_THEMES[n.theme] || window.CARD_THEMES.jelly;
            const isFailed = n.kind === 'failed';
            // Failed notifications render with a soft red wash so they
            // read as an actionable error at-a-glance, not just another
            // grey card. Success and official template announcements stay
            // on plain white.
            const cardBg = isFailed
              ? 'linear-gradient(180deg, rgba(255, 235, 234, 0.92) 0%, #FFFFFF 70%)'
              : '#fff';
            // All cards share the same inline text-link CTA pattern
            // (no bordered button row). Color shifts by kind so the
            // visual register matches the wash: failed → red, others →
            // brand accent.
            const ctaColor = isFailed
              ? '#C8261D'
              : accent;
            // Retry link uses the same destination as tapping the failed
            // card body: Recipe Detail + Config Sheet auto-open. We do
            // not re-enqueue directly here, so there is no extra retry
            // toast before the user reviews their inputs.
            const onRetry = (e) => {
              e.stopPropagation();
              handleNotifTap(n);
            };
            return (
              <div
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNotifTap(n)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotifTap(n);
                  }
                }}
                style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                padding: 12,
                background: cardBg, borderRadius: 18,
                boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(60,40,140,0.05), 0 1px 2px rgba(60,40,140,0.04)',
                cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
              }}>
                {/* Top row — thumbnail + content (the whole tap target
                    for Detail / ShareView routing). */}
                <div style={{ display: 'flex', gap: 14 }}>
                  {/* Thumbnail with badge */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 76, height: 76, borderRadius: 14, overflow: 'hidden',
                      background: theme.bg,
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {/* Real artwork when available — falls back to the
                          theme gradient + subtle stripe overlay so empty
                          thumbnails still feel like art. */}
                      {n.image ? (
                        <img src={n.image} alt="" style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          display: 'block',
                          filter: isFailed ? 'saturate(0.5) brightness(0.85)' : 'none',
                        }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div style={{
                          position: 'absolute', inset: 0,
                          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)',
                        }} />
                      )}
                    </div>
                    <NotifBadge kind={n.kind} accent={accent} />
                  </div>

                  {/* Content — title / body + inline CTA hyperlink.
                      All kinds share the same shape: a left-aligned
                      text link (kind-tinted color) and a trailing
                      unread dot on the right. Failed kinds prepend a
                      ↺ retry glyph + invoke onRetry (re-enqueue);
                      other kinds use a trailing → arrow + invoke
                      handleNotifTap (navigate). */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{
                        fontSize: 15.5, fontWeight: 700, color: '#0A0A0A', letterSpacing: -0.2,
                        lineHeight: 1.25, flex: 1,
                      }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#9BA0AB', fontWeight: 500, whiteSpace: 'nowrap' }}>{n.when}</div>
                    </div>
                    <div style={{
                      fontSize: 13.5, color: '#5C5C66', lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{n.body}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFailed) {
                            onRetry(e);
                          } else {
                            handleNotifTap(n);
                          }
                        }}
                        aria-label={isFailed ? 'Retry generation' : undefined}
                        style={{
                          padding: 0, border: 'none', background: 'transparent',
                          fontSize: 13.5, fontWeight: 600, color: ctaColor,
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          cursor: 'pointer',
                        }}
                      >
                        {isFailed && <Icon.Retry size={13} color={ctaColor} />}
                        {n.cta}
                        {!isFailed && <span style={{ fontWeight: 500 }}>→</span>}
                      </button>
                      {n.unread && (
                        <div style={{
                          width: 7, height: 7, borderRadius: 999, background: accent, flexShrink: 0,
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: 'center', padding: '20px 0 4px', color: '#9BA0AB', fontSize: 13 }}>
            You're all caught up ✨
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Projects — full-screen tab. Reached from the bottom nav's middle
// slot. No backdrop / sheet chrome and no upgrade banner or profile
// row (those live exclusively on the profile page now).
// ──────────────────────────────────────────────
function ProjectsScreen({ scrollRef, onScroll, onOpenProject, onOpenShareView, onBack, accent, queue, completedCreations }) {
  const projects = window.PROJECTS || [];
  const liveQueue = Array.isArray(queue) ? queue : [];
  const liveCompleted = Array.isArray(completedCreations) ? completedCreations : [];
  const [deleteMode, setDeleteMode] = React.useState(false);
  const [deletedIds, setDeletedIds] = React.useState(() => new Set());
  const [selectedIds, setSelectedIds] = React.useState(() => new Set());
  const visibleCompleted = liveCompleted.filter((c) => !deletedIds.has(`completed:${c.id}`));
  const visibleProjects = projects.filter((p) => !deletedIds.has(`project:${p.id}`));
  const recentCount = visibleCompleted.length + visibleProjects.length;
  const selectedCount = selectedIds.size;

  // Timeline grouping — merge finished generations + saved projects into a
  // single list, sort newest-first, then group by calendar day. Today keeps
  // a friendly "Today" label; every older day is labelled with its actual
  // date. (The "Generating" section is rendered separately above and only
  // appears when there are in-flight jobs.)
  const now = Date.now();
  const DAY = 86400000;
  const dayStart = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const todayStart = dayStart(now);
  const fmtDate = (ts) => {
    const d = new Date(ts);
    const opts = { month: 'short', day: 'numeric' };
    if (d.getFullYear() !== new Date(now).getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-US', opts);
  };
  const records = [];
  visibleCompleted.forEach((c) => {
    records.push({
      key: `completed:${c.id}`,
      ts: c.completedAt || now,
      item: c,
      onTap: () => {
        if (onOpenShareView) {
          onOpenShareView({
            ...(c.recipe || c),
            id: c.id, title: c.title, image: c.image, theme: c.theme,
            fromRecipe: !!c.fromRecipe,
          });
        }
      },
    });
  });
  visibleProjects.forEach((p) => {
    records.push({
      key: `project:${p.id}`,
      ts: p.ts || (now - DAY),
      item: p,
      onTap: () => onOpenShareView && onOpenShareView(p),
    });
  });
  records.sort((a, b) => b.ts - a.ts);
  const byDay = new Map();
  records.forEach((rec) => {
    const k = dayStart(rec.ts);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(rec);
  });
  const groups = Array.from(byDay.keys())
    .sort((a, b) => b - a)
    .map((k) => ({ label: k === todayStart ? 'Today' : fmtDate(k), items: byDay.get(k) }));
  const toggleSelection = React.useCallback((key) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  const deleteSelected = React.useCallback(() => {
    if (selectedIds.size === 0) return;
    setDeletedIds((prev) => {
      const next = new Set(prev);
      selectedIds.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());
  }, [selectedIds]);
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Glass back button — only rendered when the screen is reused
          as a pushed secondary page. In the main tab bar this prop is
          omitted, so Creation is a first-level destination. */}
      {onBack && <DetailBackButton onBack={onBack} />}

      {/* Sticky header — title only. Title shifts right when the back
          button is present so they don't collide. */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: 56, paddingBottom: 14,
        background: 'linear-gradient(180deg, rgba(247,242,253,0.94) 0%, rgba(247,242,253,0.82) 60%, rgba(247,242,253,0) 100%)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
      }}>
        <div style={{ padding: onBack ? '0 20px 0 68px' : '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h1 className="h-recipe" style={{ margin: 0 }}>CreateSpace</h1>
              <div style={{ fontSize: 13.5, color: '#5C5C66', marginTop: 6, fontWeight: 400, lineHeight: 1.35 }}>
                {deleteMode ? 'Select thumbnails to delete.' : 'Your generations and saved drafts.'}
              </div>
            </div>
            {recentCount > 0 && (
              <button
                onClick={() => {
                  setDeleteMode((v) => !v);
                  setSelectedIds(new Set());
                }}
                style={{
                  height: 34,
                  padding: '0 13px',
                  borderRadius: 999,
                  border: '0.5px solid rgba(134, 61, 251, 0.20)',
                  background: 'rgba(255,255,255,0.72)',
                  color: accent || '#863dfb',
                  fontFamily: '"Manrope", system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(20,8,60,0.08)',
                }}
              >
                {deleteMode ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scroll body */}
      <div ref={scrollRef} onScroll={onScroll} className="phone-scroll screen-fade" style={{
        position: 'absolute', inset: 0, overflow: 'auto',
        paddingTop: 124, paddingBottom: onBack ? 48 : 140,
      }}>
        {/* Generating section — only renders when there are in-flight
            jobs. Cards show progress + ETA. Tapping opens the result page
            in its "creating" state; the chat icon there leads to the
            conversation/log. */}
        {liveQueue.length > 0 && (
          <div style={{ padding: '4px 16px 0' }}>
            <ProjectsSectionLabel text="Generating" count={liveQueue.length} accent={accent} />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
            }}>
              {liveQueue.map((q) => (
                <CreationGridCard
                  key={q.id}
                  item={q}
                  accent={accent}
                  isGenerating
                  onTap={() => onOpenShareView && onOpenShareView({
                    id: q.id, title: q.title, theme: q.theme, image: q.image,
                    fromRecipe: !!q.fromRecipe,
                    __generating: true,
                    progress: q.progress,
                    __userPrompt: q.title,
                  })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent — finished thumbnails grouped along a timeline. Each
            bucket is its own labelled section; tapping a card opens the
            generated result page. Delete mode turns each square into a
            direct delete target. */}
        <div style={{ padding: liveQueue.length ? '18px 16px 0' : '4px 16px 0' }}>
          {groups.map((g, gi) => (
            <div key={g.label} style={{ marginTop: gi === 0 ? 0 : 18 }}>
              <ProjectsSectionLabel text={g.label} />
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
              }}>
                {g.items.map((rec) => (
                  <CreationGridCard
                    key={rec.key}
                    item={rec.item}
                    deleteMode={deleteMode}
                    selected={selectedIds.has(rec.key)}
                    onSelect={() => toggleSelection(rec.key)}
                    onTap={rec.onTap}
                  />
                ))}
              </div>
            </div>
          ))}
          {recentCount > 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0 4px', color: '#9BA0AB', fontSize: 13 }}>
              That's everything you've made.
            </div>
          )}
        </div>
      </div>
      {deleteMode && selectedCount > 0 && (
        <div style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 118,
          zIndex: 25,
          pointerEvents: 'none',
        }}>
          <button
            onClick={deleteSelected}
            style={{
              width: '100%',
              height: 46,
              borderRadius: 999,
              border: 'none',
              background: '#C8261D',
              color: '#FFFFFF',
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 14px 34px rgba(200,38,29,0.26), 0 3px 10px rgba(0,0,0,0.10)',
              pointerEvents: 'auto',
            }}
          >
            Delete selected ({selectedCount})
          </button>
        </div>
      )}
    </div>
  );
}

// Section label used inside ProjectsScreen — small caps + optional count
// pill in accent. Sits flush-left of the card list.
function ProjectsSectionLabel({ text, count, accent }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '2px 4px 10px',
    }}>
      <span style={{
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 12, fontWeight: 700, letterSpacing: 0.6,
        color: '#5C5C66', textTransform: 'uppercase',
      }}>{text}</span>
      {count != null && (
        <span style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 11, fontWeight: 700, letterSpacing: 0,
          color: '#fff',
          background: accent || '#7C5BFD',
          padding: '1px 7px', borderRadius: 999,
          lineHeight: 1.5,
        }}>{count}</span>
      )}
    </div>
  );
}

// Square thumbnail used by the Creation tab. The page should read as a
// visual gallery, not a task list; title/progress are secondary overlays.
function CreationGridCard({ item, accent, isGenerating = false, deleteMode = false, selected = false, onSelect, onTap }) {
  const theme = window.CARD_THEMES[item.theme] || window.CARD_THEMES.jelly;
  const pct = Math.round((item.progress || 0) * 100);
  const hasImage = !!item.image;
  return (
    <button
      onClick={(e) => {
        if (deleteMode && !isGenerating && onSelect) {
          e.preventDefault();
          onSelect();
          return;
        }
        onTap && onTap();
      }}
      aria-label={item.title || 'Open creation'}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        border: 'none',
        borderRadius: 18,
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        background: theme.bg || '#EEEEF0',
        boxShadow: selected
          ? '0 0 0 2px rgba(134, 61, 251, 0.72), 0 8px 22px rgba(134,61,251,0.18)'
          : '0 0 0 0.5px rgba(0,0,0,0.05), 0 6px 18px rgba(60,40,140,0.08)',
        cursor: 'pointer',
      }}
    >
      {hasImage ? (
        <img
          src={item.image}
          alt=""
          draggable={false}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isGenerating ? 'saturate(0.75) brightness(0.72)' : 'none',
          }}
        />
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 12px)',
        }} />
      )}

      <div style={{
        position: 'absolute',
        inset: 0,
        background: isGenerating
          ? 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.48) 100%)'
          : deleteMode
            ? 'linear-gradient(180deg, rgba(134,61,251,0.10) 0%, rgba(0,0,0,0.50) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0) 42%, rgba(0,0,0,0.48) 100%)',
      }} />

      {item.fromRecipe && !deleteMode && (
        <span aria-label="Made from a recipe" style={{
          position: 'absolute',
          top: 8,
          left: 8,
          width: 26,
          height: 26,
          borderRadius: 9,
          background: 'rgba(20, 18, 24, 0.34)',
          backdropFilter: 'blur(8px) saturate(150%)',
          WebkitBackdropFilter: 'blur(8px) saturate(150%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0.5px 0.5px rgba(255,255,255,0.4)',
          pointerEvents: 'none',
        }}>
          <Icon.Sparkles size={15} color="#FFFFFF" />
        </span>
      )}

      {deleteMode && !isGenerating && (
        <span style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: 999,
          background: selected ? (accent || '#863dfb') : 'rgba(255,255,255,0.78)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: selected
            ? '0 4px 12px rgba(134,61,251,0.28), 0 0 0 2px rgba(255,255,255,0.9)'
            : '0 4px 12px rgba(0,0,0,0.12), 0 0 0 2px rgba(255,255,255,0.75)',
          pointerEvents: 'none',
        }}>
          <span style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            border: selected ? 'none' : '1.5px solid rgba(31,26,35,0.42)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            lineHeight: 1,
            fontWeight: 900,
          }}>{selected ? '✓' : ''}</span>
        </span>
      )}

      {isGenerating && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div className="proj-spinner" style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            border: '2px solid rgba(255,255,255,0.35)',
            borderTopColor: '#fff',
          }} />
        </div>
      )}

      {isGenerating && (
        <div style={{
          position: 'absolute',
          left: 8,
          right: 8,
          bottom: 30,
          height: 3,
          borderRadius: 999,
          background: 'rgba(255,255,255,0.28)',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: accent || '#7C5BFD',
            transition: 'width 0.3s linear',
          }} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minWidth: 0,
      }}>
        <div style={{
          flex: 1,
          minWidth: 0,
          color: '#FFFFFF',
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 11.5,
          lineHeight: '15px',
          fontWeight: 700,
          letterSpacing: -0.1,
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: '0 1px 2px rgba(0,0,0,0.35)',
        }}>
          {isGenerating ? `${pct}%` : (item.title || 'Untitled')}
        </div>
        {!isGenerating && !deleteMode && (
          <span style={{
            width: 20,
            height: 20,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.86)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
          }}>
            <svg width="8" height="9" viewBox="0 0 10 11" aria-hidden="true">
              <polygon points="1,0.5 9,5.5 1,10.5" fill="#0A0A0A" />
            </svg>
          </span>
        )}
      </div>
    </button>
  );
}

// Card row for an in-flight generation job. Thumbnail + name + ETA +
// thin progress bar. Tapping enters the chat / log so the user can
// watch the loading state in the conversation (per feedback: "对话里
// 看到 loading 态"). Not clickable as a "play" target — there's no
// finished media yet.
function GeneratingRow({ item, accent, onTap }) {
  const theme = window.CARD_THEMES[item.theme] || window.CARD_THEMES.jelly;
  const pct = Math.round((item.progress || 0) * 100);
  // Crude ETA: assume ~30s total to mirror the queue popover copy.
  const remaining = Math.max(1, Math.round(30 * (1 - (item.progress || 0))));
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap && onTap(); }
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 12,
        background: '#fff', borderRadius: 18,
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(60,40,140,0.05), 0 1px 2px rgba(60,40,140,0.04)',
        cursor: 'pointer',
      }}>
      {/* Thumbnail — dimmed + pulsing while in flight, with a small
          dot-spinner badge at center to read as "rendering". */}
      <div style={{
        width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
        background: theme.bg, position: 'relative', flexShrink: 0,
      }}>
        {item.image ? (
          <img src={item.image} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover',
            display: 'block', filter: 'saturate(0.7) brightness(0.7)',
          }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)',
          }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="proj-spinner" style={{
            width: 24, height: 24, borderRadius: 999,
            border: '2px solid rgba(255,255,255,0.35)',
            borderTopColor: '#fff',
          }} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15.5, fontWeight: 600, color: '#0A0A0A', letterSpacing: -0.1,
          lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{item.title}</div>
        <div style={{
          fontSize: 12.5, color: '#9BA0AB', marginTop: 4, fontWeight: 500,
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontVariantNumeric: 'tabular-nums',
        }}>{pct}% · ~{remaining}s left</div>
        {/* Thin progress track */}
        <div style={{
          height: 3, borderRadius: 999, marginTop: 8,
          background: 'rgba(9, 9, 11, 0.06)', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: accent || '#7C5BFD', borderRadius: 999,
            transition: 'width 0.3s linear',
          }} />
        </div>
      </div>
    </div>
  );
}

// Card row for a completed creation. Same shape as a project row, but
// the thumbnail wears a small white "play" glass disc so the affordance
// reads as "tap to watch". Tap → ShareView.
function CompletedRow({ item, onTap }) {
  const theme = window.CARD_THEMES[item.theme] || window.CARD_THEMES.jelly;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap && onTap(); }
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: 12,
        background: '#fff', borderRadius: 18,
        boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(60,40,140,0.05), 0 1px 2px rgba(60,40,140,0.04)',
        cursor: 'pointer',
      }}>
      <div style={{
        width: 64, height: 64, borderRadius: 14, overflow: 'hidden',
        background: theme.bg, position: 'relative', flexShrink: 0,
      }}>
        {item.image ? (
          <img src={item.image} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)',
          }} />
        )}
        {/* Play glass disc */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 999,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            paddingLeft: 2,
          }}>
            <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true">
              <polygon points="1,0.5 9,5.5 1,10.5" fill="#0A0A0A" />
            </svg>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15.5, fontWeight: 600, color: '#0A0A0A', letterSpacing: -0.1,
          lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{item.title}</div>
        <div style={{
          fontSize: 12.5, color: '#9BA0AB', marginTop: 4, fontWeight: 500,
        }}>{item.when || 'Just now'}</div>
      </div>
      <Icon.Chevron size={16} color="#9BA0AB" />
    </div>
  );
}

// ──────────────────────────────────────────────
// Recipe Detail — full-screen page that opens when a card is tapped.
// Composition (top to bottom): soft pink/lavender header area with the
// recipe image, a drag-handle bar, then a white sheet with title +
// Advertise pill + description + Upload section + Describe section, and
// finally a sticky action bar (primary CTA + share). Matches the layout
// across the three reference screenshots — image visible at top, full
// cook form revealed below.
// ──────────────────────────────────────────────
// Outlined Advertise tag per Figma (node 14173:60463 / 18606:26509).
// Hairline border, tight padding, 12px radius, 11px Manrope Medium
// with 60% opacity. No icon — keeps it clean and unobtrusive.
function AdvertisePill() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px',
      background: 'transparent',
      border: '0.5px solid rgba(9, 9, 11, 0.16)',
      borderRadius: 12,
      fontFamily: '"Manrope", system-ui, sans-serif',
      fontSize: 11, lineHeight: '16px', fontWeight: 500,
      letterSpacing: 0.3,
      color: '#09090B',
      opacity: 0.6,
      fontFeatureSettings: '"zero" 1',
    }}>
      <span>Advertise</span>
    </div>
  );
}

// Kept for backwards compatibility — no longer used by RecipeDetailScreen
// (the unified detail view renders its own back button inline so it can
// adapt color/glass as the sheet rises). Safe to delete if nothing else
// references it.
function DetailBackButton({ onBack }) {
  return (
    <button onClick={onBack} aria-label="Back" style={{
      // z-index needs to clear the sticky page header (zIndex: 20 on
      // Projects / Notification screens) so the button isn't hidden
      // behind the header's translucent wash.
      position: 'absolute', top: 58, left: 16, zIndex: 30,
      width: 40, height: 40, borderRadius: 999,
      border: '0.5px solid rgba(255,255,255,0.6)',
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(18px) saturate(160%)',
      WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(60,40,140,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', padding: 0,
    }}>
      <Icon.Back size={18} color="#1A1A22" stroke={2} />
    </button>
  );
}

// Primary CTA pill per Figma Button component (M3 filled style).
//   enabled (default + ready)   → black bg #09090B, white text/icon
//   !enabled (waiting for form) → translucent dark wash on light bg,
//                                  text + icon at 38% opacity
// The pill flex-fills the available space in the action bar.
function PrimaryCTA({ label, enabled = false, onClick }) {
  const fg = enabled ? '#FFFFFF' : 'rgba(9, 9, 11, 0.38)';
  return (
    <button
      onClick={onClick}
      disabled={!enabled}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 999,
        border: '0.5px solid rgba(9, 9, 11, 0.12)',
        background: enabled ? '#09090B' : 'rgba(9, 9, 11, 0.12)',
        color: fg,
        padding: '12px 24px 12px 16px',
        cursor: enabled ? 'pointer' : 'not-allowed',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 14, lineHeight: '20px', fontWeight: 500, letterSpacing: 0.1,
        fontFeatureSettings: '"zero" 1',
        transition: 'background 0.18s ease, color 0.18s ease',
      }}
    >
      <Icon.ChefHat size={18} color={fg} />
      <span>{label}</span>
    </button>
  );
}

// Inline source-file pill per Figma (node 19524:20442).
// Lavender wash + purple hairline + 6px radius + 20px rounded thumb.
// Flows inside the description copy via React.Fragment splitting.
function FileChip({ thumb, name }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: 2,
      background: 'rgba(208, 188, 255, 0.12)',
      border: '0.5px solid rgba(134, 61, 251, 0.16)',
      borderRadius: 6,
      verticalAlign: '-5px',
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      {thumb && (
        <img src={thumb} alt="" style={{
          width: 20, height: 20, borderRadius: 4,
          objectFit: 'cover', display: 'block',
        }} />
      )}
      <span style={{
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 12, fontWeight: 500, lineHeight: '17px',
        color: '#3F3F46', letterSpacing: 0.2,
        padding: '0 4px',
        fontFeatureSettings: '"zero" 1',
      }}>{name}</span>
    </span>
  );
}

// Static video controls bar — purely decorative for the prototype.
// Sits absolutely positioned at the bottom of the preview image.
function VideoControlsOverlay() {
  const PROGRESS = 0.07; // ~0:01 of 0:16
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', left: 0, right: 0, bottom: 12,
      padding: '0 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      color: '#FFFFFF',
      textShadow: '0 1px 2px rgba(0,0,0,0.35)',
    }}>
      <span style={{
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 11, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
      }}>0:01</span>
      <div style={{
        flex: 1, position: 'relative',
        height: 3, borderRadius: 999,
        background: 'rgba(255,255,255,0.35)',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0,
          height: '100%', width: `${PROGRESS * 100}%`,
          background: '#FFFFFF', borderRadius: 999,
        }} />
        <div style={{
          position: 'absolute', left: `${PROGRESS * 100}%`, top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 12, height: 12, borderRadius: 999,
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }} />
      </div>
      <span style={{
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 11, fontWeight: 600,
        fontVariantNumeric: 'tabular-nums',
        opacity: 0.85,
      }}>0:16</span>
      <Icon.MicMuted size={16} color="#FFFFFF" />
    </div>
  );
}

// Splits a description string on its `{FILE}` token and weaves in a
// FileChip wherever the token appears. Returns a fragment-safe array.
function renderDescriptionWithFile(text, file) {
  if (!text) return null;
  if (!file || text.indexOf('{FILE}') === -1) return text;
  const parts = text.split('{FILE}');
  const out = [];
  parts.forEach((part, i) => {
    out.push(<React.Fragment key={`t${i}`}>{part}</React.Fragment>);
    if (i < parts.length - 1) {
      out.push(<FileChip key={`f${i}`} thumb={file.thumb} name={file.name} />);
    }
  });
  return out;
}

// ── Recipe preview video ─────────────────────────────────────────
// Placeholder media component used by the detail page hero and by
// the config sheet when it's been expanded to full-page mode.
//
// Mirrors RecipeCard's gradient + mono label aesthetic so the
// "video" reads as a continuation of the home browse card — the
// card has "opened up" into a preview. Bottom overlay carries
// fake player chrome (time pill / scrubber / mute) for that
// "this is a video" cue.
function RecipePreviewVideo({ recipe, height = 480, onBack }) {
  const theme = window.CARD_THEMES[recipe.theme] || window.CARD_THEMES.jelly;
  const [imageFailed, setImageFailed] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [progress, setProgress] = React.useState(6);
  const hasImage = recipe.image && !imageFailed;
  const duration = 16;
  const currentSecond = Math.max(1, Math.min(duration - 1, Math.round((progress / 100) * duration)));

  React.useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? 6 : p + 0.7));
    }, 260);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={isPlaying ? 'Pause preview video' : 'Play preview video'}
      onClick={() => setIsPlaying((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setIsPlaying((v) => !v);
        }
      }}
      style={{
      position: 'relative', width: '100%', height, overflow: 'hidden',
      background: hasImage ? '#000' : theme.bg, flexShrink: 0,
      cursor: 'pointer',
    }}>
      {hasImage ? (
        <img
          src={recipe.image}
          alt=""
          draggable={false}
          onError={() => setImageFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <>
          {/* Diagonal stripe texture — same trick the home cards use
              to keep flat gradients from reading as empty. */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 14px)',
          }} />
          {/* Centered mono label — the "fake video" placeholder cue
              from the home browse surface. */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 13, letterSpacing: 0.4,
            color: 'rgba(0,0,0,0.30)',
            mixBlendMode: 'multiply',
          }}>
            {theme.label}
          </div>
        </>
      )}

      {/* Glass back button — overlays on the video, top-left. Only
          rendered when an onBack handler is provided (i.e. when the
          video is the page itself; not when embedded inside a sheet
          that already has its own back affordance). */}
      {onBack && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          aria-label="Back"
          style={{
            position: 'absolute', top: 58, left: 16, zIndex: 2,
            width: 40, height: 40, borderRadius: 999,
            border: '0.5px solid rgba(255,255,255,0.5)',
            background: 'rgba(255,255,255,0.4)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}
        >
          <Icon.Back size={18} color="#1A1A22" stroke={2} />
        </button>
      )}

      {/* Pause state affordance — only visible when paused, so the
          video still feels calm while playing. */}
      {!isPlaying && (
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(9,9,11,0.06)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999,
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(16px) saturate(160%)',
            WebkitBackdropFilter: 'blur(16px) saturate(160%)',
            boxShadow: '0 12px 36px rgba(20,20,28,0.16), inset 0 1px 1px rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon.Play2 size={22} color="#1A1A22" />
          </div>
        </div>
      )}

      {/* Player chrome — bottom scrubber + time + mute icon. Pure
          prototype playback chrome. Tapping the video toggles between
          play / pause and the scrubber progresses while playing. */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0 16px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 12, fontWeight: 600, color: 'rgba(20,20,28,0.72)',
        }}>0:{String(currentSecond).padStart(2, '0')}</div>
        <div style={{
          position: 'relative', flex: 1, height: 4, borderRadius: 999,
          background: 'rgba(20,20,28,0.18)',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: `${progress}%`, borderRadius: 999, background: 'rgba(20,20,28,0.85)',
            transition: isPlaying ? 'width 0.26s linear' : 'none',
          }} />
          <div style={{
            position: 'absolute', top: '50%', left: `${progress}%`,
            width: 11, height: 11, borderRadius: 999,
            background: '#FFFFFF',
            border: '0.5px solid rgba(20,20,28,0.4)',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            transition: isPlaying ? 'left 0.26s linear' : 'none',
          }} />
        </div>
        <div style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 12, fontWeight: 600, color: 'rgba(20,20,28,0.6)',
        }}>0:16</div>
        <Icon.VolumeOff size={16} color="rgba(20,20,28,0.7)" stroke={1.8} />
      </div>
    </div>
  );
}

// ── Detail screen ────────────────────────────────────────────────
// Recipe detail page (image 1 reference). Layout:
//
//   ┌────────────────────────┐
//   │  [back glass btn]      │
//   │     VIDEO PREVIEW      │
//   │  (gradient + label)    │
//   │   ▌▌▌▌ scrubber 🔇    │
//   ├────────────────────────┤
//   │  Title                 │
//   │  [Advertise]           │
//   │  Description w/ chip   │
//   │  Upload image (label)  │
//   ├────────────────────────┤
//   │ [Try this recipe] [↗] │
//   └────────────────────────┘
//
// "Upload image" appears as a teaser heading only — the actual
// form (dropzone + describe textarea) lives in the Config Sheet
// modal that opens on tap of "Try this recipe". This keeps the
// detail page purely "browse / decide", and the sheet purely
// "commit / edit inputs" — see § 7.1.5 of PRD-Notification.md.
//
// When entered via a failed-notification retry path, parent
// passes `autoOpenConfig` so the Config Sheet rises on mount with
// the original inputs prefilled.
function RecipeDetailScreen({ recipe, onBack, onOpenShareView, autoOpenConfig }) {
  const [configOpen, setConfigOpen] = React.useState(!!autoOpenConfig);
  const [shareOpen, setShareOpen] = React.useState(false);
  React.useEffect(() => {
    setConfigOpen(!!autoOpenConfig);
    setShareOpen(false);
  }, [recipe && recipe.id, autoOpenConfig]);

  const onSubmit = React.useCallback(() => {
    if (typeof window.__enqueueGeneration === 'function') {
      window.__enqueueGeneration({ ...recipe, fromRecipe: true });
    }
    setConfigOpen(false);
    if (typeof onBack === 'function') onBack();
  }, [recipe, onBack]);

  // Related recipes — everything except the current one, split into
  // the same two columns the home browse surface uses so the detail
  // page reads as a continuation of "discover more like this" rather
  // than a separate visual system.
  const related = React.useMemo(() => {
    const all = (window.RECIPES || []).filter((r) => r.id !== recipe.id);
    return { L: all.filter((r) => r.col === 'L'), R: all.filter((r) => r.col === 'R') };
  }, [recipe && recipe.id, recipe && recipe.image, recipe && recipe.title]);

  const credits = typeof recipe.credits === 'number' ? recipe.credits : 12;
  const VIDEO_H = 480;
  const ACTIONS_H = 96;

  return (
    <div className="screen-fade" style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {/* Pinterest-style detail flow: video, description and related
          templates live in one scroll container. When the user pushes
          up to see more, the whole page moves together instead of the
          lower panel scrolling independently under a fixed video. */}
      <div className="phone-scroll" style={{
        position: 'absolute', inset: 0,
        background: '#FFFFFF',
        overflow: 'auto',
        paddingBottom: ACTIONS_H + 24,
        WebkitOverflowScrolling: 'touch',
      }}>
        {/* Hero video preview — part of the scroll flow, not fixed. */}
        <RecipePreviewVideo recipe={recipe} height={VIDEO_H} onBack={onBack} />

        <div style={{ padding: '20px 20px 0' }}>
          <h2 style={{
            margin: 0,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 24, lineHeight: '30px', fontWeight: 700,
            color: '#09090B', letterSpacing: -0.3,
            fontFeatureSettings: '"zero" 1',
          }}>{recipe.title}</h2>

          <div style={{ marginTop: 8 }}><AdvertisePill /></div>

          <p style={{
            margin: '14px 0 0',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14, lineHeight: '21px', fontWeight: 500,
            color: '#3F3F46', letterSpacing: 0.2,
            fontFeatureSettings: '"zero" 1',
          }}>
            {renderDescriptionWithFile(
              recipe.previewDescription || recipe.description || '',
              recipe.previewFile
            )}
          </p>

          {/* "More like this" — section header + recipe count */}
          <div style={{
            marginTop: 28, marginBottom: 10,
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          }}>
            <h3 style={{
              margin: 0,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 17, lineHeight: '22px', fontWeight: 700,
              color: '#09090B', letterSpacing: -0.1,
              fontFeatureSettings: '"zero" 1',
            }}>More like this</h3>
            <span style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 12, lineHeight: '16px', fontWeight: 500,
              color: '#71717A', letterSpacing: 0.2,
            }}>{related.L.length + related.R.length} templates</span>
          </div>

          {/* Pinterest-style masonry — two columns reuse RecipeCard so
              the visual grammar stays consistent with the home browse
              surface. Tapping any card opens that recipe's detail page
              (re-uses window.__openRecipeDetail set by the app). */}
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            {['L', 'R'].map((col) => (
              <div key={col} style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
                {related[col].map((r) => (
                  <RecipeCard
                    key={r.id}
                    recipe={r}
                    onClick={() => {
                      if (typeof window.__openRecipeDetail === 'function') {
                        window.__openRecipeDetail(r);
                      }
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating native-style action controls — detached from the
          content like iOS floating tabs. No full-width gradient bar:
          the page scrolls underneath while the actions hover above
          the home indicator. */}
      <div style={{
        position: 'absolute', bottom: 34, left: 20, right: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        zIndex: 6,
        pointerEvents: 'none',
      }}>
        <button
          onClick={() => setConfigOpen(true)}
          style={{
            flex: 1, height: 48, borderRadius: 'var(--shape-radius-full)',
            border: 'none',
            background: 'var(--color-schemes-primary)',
            color: 'var(--color-schemes-on-primary)',
            padding: '0 var(--space-s5)',
            cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-s2)',
            fontFamily: 'var(--font-family-plain, "Manrope", system-ui, sans-serif)',
            fontFeatureSettings: '"zero" 1',
            fontSize: 'var(--type-label-large-prominent-size)',
            lineHeight: 'var(--type-label-large-prominent-leading)',
            fontWeight: 'var(--type-label-large-prominent-weight)',
            letterSpacing: 'var(--type-label-large-prominent-tracking)',
            boxShadow: '0 10px 26px rgba(134,61,251,0.28), 0 2px 6px rgba(134,61,251,0.18)',
            pointerEvents: 'auto',
          }}
        >
          <Icon.ChefHat size={18} color="var(--color-schemes-on-primary)" />
          Try this recipe
        </button>
        <button
          onClick={() => setShareOpen(true)}
          aria-label="Share"
          className="glass-wabi"
          style={{
            width: 48, height: 48, borderRadius: 'var(--shape-radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0, flexShrink: 0,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            boxShadow: '0 10px 26px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
            pointerEvents: 'auto',
          }}>
          <Icon.Share size={18} color="var(--color-surface-on-surface)" />
        </button>
      </div>

      {/* Config sheet — opens on CTA tap. Single-detent modal:
          form only, drag down past threshold to dismiss. */}
      {configOpen && (
        <RecipeConfigSheet
          recipe={recipe}
          credits={credits}
          onClose={() => setConfigOpen(false)}
          onSubmit={onSubmit}
        />
      )}

      {shareOpen && (
        <SharePage
          recipe={recipe}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function RemixTextInputOverlay({ value, onChange, onClose }) {
  const inputRef = React.useRef(null);
  const Keyboard = window.FakeKeyboard;

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      inputRef.current && inputRef.current.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 42,
      pointerEvents: 'auto',
    }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20, 18, 24, 0.16)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }} />

      {/* Global free-text input — same family as the composer, but no
          prefilled prompt / no asset slot sentence. It starts with the
          neutral "Type anything..." placeholder from the global input
          pattern; the homepage composer remains the only surface with
          "Create a short video with..." + resource slots. */}
      <div className="sheet-enter" style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 247,
        zIndex: 2,
        background: 'rgba(255,255,255,0.62)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTop: '0.5px solid rgba(255,255,255,0.76)',
        boxShadow: '0 -18px 60px rgba(20, 8, 60, 0.16), inset 0 1px 1px rgba(255,255,255,0.62)',
        backdropFilter: 'blur(26px) saturate(180%)',
        WebkitBackdropFilter: 'blur(26px) saturate(180%)',
        padding: '18px 14px 14px',
        overflow: 'hidden',
      }}>
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => onChange && onChange(e.target.value)}
          rows={4}
          placeholder="Type anything..."
          style={{
            width: '100%',
            minHeight: 118,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            resize: 'none',
            padding: 0,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 17,
            lineHeight: '25px',
            fontWeight: 500,
            color: '#1F1A23',
            letterSpacing: 0.1,
          }}
        />

      </div>

      {Keyboard ? <Keyboard /> : null}
    </div>
  );
}

const globalInputIconBtn = {
  width: 44,
  height: 44,
  borderRadius: 'var(--shape-radius-full)',
  border: '0.5px solid rgba(255,255,255,0.68)',
  background: 'rgba(255,255,255,0.72)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  boxShadow: '0 4px 14px rgba(20,8,60,0.10), inset 0 1px 1px rgba(255,255,255,0.8)',
  backdropFilter: 'blur(14px) saturate(160%)',
  WebkitBackdropFilter: 'blur(14px) saturate(160%)',
};

// ── Recipe config sheet ──────────────────────────────────────────
// Single-detent modal bottom sheet for the cook form.
//
// Layout (locked, no expand-to-show-video state): drag handle +
// back chevron + small thumbnail + title + Advertise pill row,
// description, upload dropzone, describe textarea, sticky CTA
// with credits chip.
//
// Drag past PHONE_H - 80 → dismiss. There is intentionally no
// "expand up to reveal a hero video" detent — the recipe video
// lives on the Recipe Detail page; the sheet is committed
// strictly to "enter inputs and submit." Keeps the two surfaces
// semantically distinct (browse vs. commit).
function RecipeConfigSheet({ recipe, credits = 12, onClose, onSubmit }) {
  const theme = window.CARD_THEMES[recipe.theme] || window.CARD_THEMES.jelly;
  const [imageFailed, setImageFailed] = React.useState(false);
  const hasImage = recipe.image && !imageFailed;

  const PHONE_H = 852;
  const STATUS_H = 62;
  const EXPANDED_TOP = 0;                   // full-page mode covers the old page
  const DEFAULT_TOP = STATUS_H + 58;        // resting sheet mode
  const DISMISS_TOP = PHONE_H - 80;         // drag past → close

  const [text, setText] = React.useState('');
  const [uploaded, setUploaded] = React.useState(false);
  const [textFocused, setTextFocused] = React.useState(false);
  const [remixInputOpen, setRemixInputOpen] = React.useState(false);
  const uploadInputRef = React.useRef(null);
  const ready = true;

  // Inline missing-field hint — lives inside the sheet so it
  // doesn't fight the global app toast for the same real estate.
  const [hint, setHint] = React.useState(null);
  React.useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(null), 2400);
    return () => window.clearTimeout(id);
  }, [hint]);

  // Sheet top position drives the slide-in, drag-to-expand and
  // drag-to-dismiss gestures. Starts off-screen at PHONE_H, animates
  // up to DEFAULT_TOP on mount. Drag up to EXPANDED_TOP turns the
  // sheet into a standalone full-page config surface.
  const [sheetTop, setSheetTop] = React.useState(PHONE_H);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef(null);
  const closingRef = React.useRef(false);

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setSheetTop(DEFAULT_TOP));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const requestClose = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setSheetTop(PHONE_H);
    window.setTimeout(onClose, 280);
  }, [onClose]);

  // Drag handlers — only the handle row is draggable so the form
  // inside behaves naturally (textarea / buttons / scroll all work).
  // Release picks the nearest semantic state: expanded page, default
  // sheet, or dismiss if pulled far enough downward.
  const beginDrag = (clientY) => {
    dragRef.current = { startY: clientY, startTop: sheetTop };
    setDragging(true);
  };
  const moveDrag = (clientY) => {
    if (!dragRef.current) return;
    const dy = clientY - dragRef.current.startY;
    const next = Math.max(EXPANDED_TOP,
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
      const expandThreshold = DEFAULT_TOP - (DEFAULT_TOP - EXPANDED_TOP) * 0.35;
      return t < expandThreshold ? EXPANDED_TOP : DEFAULT_TOP;
    });
    dragRef.current = null;
    setDragging(false);
  };

  const handlePointerHandlers = {
    onPointerDown: (e) => {
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

  const snapTransition = dragging
    ? 'none'
    : 'top 0.34s cubic-bezier(0.32, 0.72, 0, 1)';

  const onCta = () => {
    onSubmit && onSubmit({ text, uploaded });
  };

  // enterProgress: 0 when off-screen, 1 when at DEFAULT_TOP.
  // expandProgress: 0 at default sheet, 1 at full-page mode.
  // These drive the backdrop, top radius and shadow so the sheet
  // visually becomes a page when pushed to the top.
  const enterProgress = Math.max(0, Math.min(1,
    (PHONE_H - sheetTop) / (PHONE_H - DEFAULT_TOP)));
  const expandProgress = Math.max(0, Math.min(1,
    (DEFAULT_TOP - sheetTop) / (DEFAULT_TOP - EXPANDED_TOP)));
  const sheetRadius = 28 * (1 - expandProgress);
  const horizontalPad = 20 + 8 * expandProgress;
  // In full-page mode the sheet covers the status-bar area, so the
  // content itself needs a safe top inset. This avoids the old page
  // peeking through above the sheet while keeping the title below
  // the iOS status bar.
  const headerPadTop = 4 + 54 * expandProgress;
  const formBottomPad = 120 + 28 * expandProgress;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90,
      pointerEvents: 'none',
    }}>
      <div
        onClick={requestClose}
        style={{
          position: 'absolute', inset: 0,
          background: '#000',
          opacity: 0.42 * enterProgress,
          pointerEvents: enterProgress > 0.05 ? 'auto' : 'none',
          transition: dragging ? 'none' : 'opacity 0.24s ease',
        }}
      />

      <div style={{
        position: 'absolute',
        top: sheetTop, left: 0, right: 0, bottom: 0,
        background: '#FFFFFF',
        borderTopLeftRadius: sheetRadius,
        borderTopRightRadius: sheetRadius,
        boxShadow: expandProgress > 0.98
          ? 'none'
          : '0 -2px 12px rgba(0, 0, 0, 0.06), 0 -16px 48px rgba(0, 0, 0, 0.18)',
        overflow: 'hidden',
        transition: dragging
          ? 'none'
          : 'top 0.34s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.34s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.18s ease',
        pointerEvents: 'auto',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Drag handle row — visible only in sheet mode. Once the
            surface is pushed to the top, it becomes a full page and
            the sheet affordance disappears. */}
        <div
          {...handlePointerHandlers}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: expandProgress > 0.98 ? 0 : 28,
            paddingTop: expandProgress > 0.98 ? 0 : 12,
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            flexShrink: 0,
            background: '#FFFFFF',
            position: 'relative', zIndex: 2,
            overflow: 'hidden',
            transition: dragging ? 'none' : 'height 0.24s ease, padding-top 0.24s ease, opacity 0.18s ease',
            opacity: 1 - expandProgress,
          }}
        >
          <div style={{
            width: 48, height: 4, borderRadius: 7,
            background: 'rgba(9, 9, 11, 0.16)',
          }} />
        </div>

        {/* Sheet header — back chevron + small thumbnail + title +
            advertise pill. No video here; the recipe's hero video
            lives on the Recipe Detail page. */}
        <div style={{
          padding: `${headerPadTop}px ${horizontalPad}px 12px`,
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
          transition: dragging ? 'none' : 'padding 0.24s ease',
        }}>
          <button
            onClick={requestClose}
            aria-label="Close"
            style={{
              width: 32, height: 32, borderRadius: 999,
              border: 'none',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, flexShrink: 0,
              color: '#1A1A22',
            }}
          >
            <Icon.Back size={16} stroke={2.2} />
          </button>
          <div style={{
            width: 48, height: 48, borderRadius: 12, overflow: 'hidden',
            background: hasImage ? '#000' : theme.bg,
            flexShrink: 0,
          }}>
            {hasImage ? (
              <img
                src={recipe.image}
                alt=""
                draggable={false}
                onError={() => setImageFailed(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : null}
          </div>
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{
              margin: 0,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 20, lineHeight: '26px', fontWeight: 700,
              color: '#09090B', letterSpacing: -0.2,
              fontFeatureSettings: '"zero" 1',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{recipe.title}</h2>
            <div><AdvertisePill /></div>
          </div>
        </div>

        {/* Description — appears once inside the sheet so the user
            keeps full context without leaving. */}
        <div style={{
          padding: `0 ${horizontalPad}px 12px`,
          flexShrink: 0,
          transition: dragging ? 'none' : 'padding 0.24s ease',
        }}>
          <p style={{
            margin: 0,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14, lineHeight: '20px', fontWeight: 500,
            color: '#3F3F46', letterSpacing: 0.2,
            fontFeatureSettings: '"zero" 1',
          }}>
            {renderDescriptionWithFile(
              recipe.previewDescription || recipe.description || '',
              recipe.previewFile
            )}
          </p>
        </div>

        {/* Scrollable form */}
        <div className="phone-scroll" style={{
          flex: 1, overflow: 'auto',
          padding: `12px 0 ${formBottomPad}px`,
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{
            padding: `0 ${horizontalPad}px`,
            display: 'flex', flexDirection: 'column', gap: 8,
            transition: dragging ? 'none' : 'padding 0.24s ease',
          }}>
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 16, lineHeight: '24px', fontWeight: 600,
              color: '#3F3F46', letterSpacing: 0.15,
              fontFeatureSettings: '"zero" 1',
            }}>Upload image</div>
            <button
              onClick={() => {
                if (uploadInputRef.current) {
                  uploadInputRef.current.click();
                }
              }}
              style={{
                width: 120, height: 120,
                background: uploaded ? 'rgba(124, 91, 253, 0.06)' : 'transparent',
                border: uploaded
                  ? '1.5px dashed rgba(124, 91, 253, 0.4)'
                  : '1px dashed rgba(74, 68, 89, 0.16)',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2,
                color: uploaded ? '#5A3DD8' : 'rgba(63, 63, 70, 0.4)',
                padding: '4px 12px',
                transition: 'all 0.18s ease',
              }}
            >
              <Icon.Plus size={24} stroke={2} />
              <div style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 12, lineHeight: '17px', fontWeight: 500,
                letterSpacing: 0.2,
                fontFeatureSettings: '"zero" 1',
              }}>{uploaded ? 'Attached' : 'Character'}</div>
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if ((e.target.files || []).length > 0) setUploaded(true);
              }}
              style={{ display: 'none' }}
            />
          </div>

          <div
            onClick={() => {
              setTextFocused(true);
              setRemixInputOpen(true);
            }}
            style={{
            marginTop: 16, padding: `0 ${horizontalPad}px`,
            display: 'flex', flexDirection: 'column', gap: 8,
            cursor: 'text',
            transition: dragging ? 'none' : 'padding 0.24s ease',
          }}>
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 16, lineHeight: '24px', fontWeight: 600,
              color: '#3F3F46', letterSpacing: 0.15,
              fontFeatureSettings: '"zero" 1',
            }}>Describe your idea to remix it</div>
            <textarea
              value={text}
              readOnly
              onClick={() => {
                setTextFocused(true);
                setRemixInputOpen(true);
              }}
              onPointerDown={() => {
                setTextFocused(true);
                setRemixInputOpen(true);
              }}
              onFocus={(e) => {
                e.currentTarget.blur();
                setTextFocused(true);
                setRemixInputOpen(true);
              }}
              placeholder={textFocused ? '' : 'Input text'}
              rows={6}
              style={{
                width: '100%', height: 136,
                border: '0.5px solid #D4D4D8',
                borderRadius: 8,
                padding: '6px 8px',
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 14, lineHeight: '20px', fontWeight: 500,
                color: '#3F3F46', letterSpacing: 0.2,
                background: '#FAFAFA',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                fontFeatureSettings: '"zero" 1',
              }}
            />
          </div>
        </div>

        {remixInputOpen && (
          <RemixTextInputOverlay
            value={text}
            onChange={setText}
            onClose={() => setRemixInputOpen(false)}
          />
        )}

        {hint && (
          <div
            key={hint.id}
            role="status"
            aria-live="polite"
            style={{
              position: 'absolute', left: 16, right: 16,
              bottom: 96 + 8,
              zIndex: 7,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: 'rgba(20, 18, 24, 0.92)',
              color: '#FFFFFF',
              borderRadius: 12,
              border: '0.5px solid rgba(255, 255, 255, 0.10)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.18)',
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 13.5, lineHeight: '20px', fontWeight: 500,
              letterSpacing: 0.1,
              animation: 'detailToastIn 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            <span aria-hidden="true" style={{
              width: 18, height: 18, borderRadius: 999,
              background: 'rgba(157, 121, 255, 0.20)',
              color: '#C6ABFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>!</span>
            <span style={{ flex: 1, minWidth: 0 }}>{hint.message}</span>
          </div>
        )}

        {/* Sticky CTA — same shape and credits chip as the detail
            page used to have; on the sheet this is where the cost
            commitment surfaces. */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.92) 30%, rgba(255, 255, 255, 0.96) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '8px 20px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <button
            onClick={onCta}
            style={{
              flex: 1, height: 48, borderRadius: 'var(--shape-radius-full)',
              border: 'none',
              background: 'var(--color-schemes-primary)',
              color: 'var(--color-schemes-on-primary)',
              padding: '6px 6px 6px 18px',
              cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              fontFamily: 'var(--font-family-plain, "Manrope", system-ui, sans-serif)',
              fontFeatureSettings: '"zero" 1',
              opacity: ready ? 1 : 0.72,
              transition: 'opacity 0.18s ease, background 0.18s ease',
              boxShadow: '0 10px 26px rgba(134,61,251,0.22), 0 2px 6px rgba(134,61,251,0.14)',
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontSize: 'var(--type-label-large-prominent-size)',
              lineHeight: 'var(--type-label-large-prominent-leading)',
              fontWeight: 'var(--type-label-large-prominent-weight)',
              letterSpacing: 'var(--type-label-large-prominent-tracking)',
            }}>
              <Icon.ChefHat size={18} color="var(--color-schemes-on-primary)" />
              Try this recipe
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              height: 32, padding: '0 12px 0 10px', borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.16)',
              border: '0.5px solid rgba(255, 255, 255, 0.18)',
              color: '#FFFFFF',
              fontSize: 13, fontWeight: 700, letterSpacing: 0.1,
            }}>
              <Icon.Bolt size={14} color="#F4B400" />
              {credits}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Conversation page ─────────────────────────────────────────────
// Full-screen page that opens after the user submits the cook form
// from the recipe detail. Mirrors the agent-style "chat + tool
// trace" UI from the reference screenshot: lavender user bubble at
// the top, agent narration interleaved with check-marked tool
// pills (Wrote Script → Load Knowledge → Generated Images), a
// rendered preview, and a sticky input row at the bottom.
//
// All content is prototype-static so the page reads as a finished
// run. The user's typed prompt + uploaded character chip flow into
// the first user message so it feels personalised.

// Outlined tool pill (icon + label + checkmark, optional trailing
// timestamp). Used for "Wrote Script", "Load Knowledge", etc.
function ToolPill({ icon, label }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 10px 5px 8px',
      border: '0.5px solid rgba(9, 9, 11, 0.14)',
      borderRadius: 999,
      background: 'rgba(250, 250, 250, 0.9)',
      color: '#3F3F46',
      fontFamily: '"Manrope", system-ui, sans-serif',
      fontSize: 12, lineHeight: '16px', fontWeight: 500,
      letterSpacing: 0.1,
    }}>
      <span style={{ display: 'inline-flex', color: '#6B7280' }}>{icon}</span>
      <span>{label}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#16A34A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5L20 7"/>
      </svg>
    </div>
  );
}

// Tiny inline glyphs for the tool pills.
const ToolGlyph = {
  Script: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h10"/><path d="M4 12h10"/><path d="M4 18h7"/>
      <path d="M17 4l3 3-7 7-3 1 1-3 6-8z"/>
    </svg>
  ),
  Brain: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4a3 3 0 0 0-3 3v0a3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 3 3 3 0 0 0 3-2"/>
      <path d="M15 4a3 3 0 0 1 3 3v0a3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 3 3 3 0 0 1-3-2"/>
      <path d="M12 6v14"/>
    </svg>
  ),
  Image: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3"/>
      <circle cx="9" cy="10" r="2"/>
      <path d="M21 17l-5-5-9 8"/>
    </svg>
  ),
};

function ConversationScreen({ recipe, userText, userFile, onClose, onOpenShareView }) {
  const title = recipe.title;
  const aspect = '16:9';

  // Compose user's first message — their typed prompt always leads;
  // the uploaded file chip follows inline if present.
  const renderUserMessage = () => {
    const t = (userText || '').trim() || `Make this ${recipe.title}.`;
    return (
      <span>
        {t}
        {userFile && (
          <>
            {' '}
            <FileChip thumb={userFile.thumb} name={userFile.name} />
          </>
        )}
      </span>
    );
  };

  // Lifted message bubble — user-side rounded pill, lavender wash.
  const UserBubble = ({ children }) => (
    <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        background: '#E8DEF8',
        borderRadius: 18,
        borderBottomRightRadius: 6,
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 14, lineHeight: '20px', color: '#1F1A23',
        letterSpacing: 0.1,
      }}>{children}</div>
    </div>
  );

  // Agent-side prose — no bubble, just full-bleed copy.
  const AgentLine = ({ children }) => (
    <div style={{
      padding: '8px 20px',
      fontFamily: '"Manrope", system-ui, sans-serif',
      fontSize: 14, lineHeight: '22px', color: '#1F1A23',
      letterSpacing: 0.1,
    }}>{children}</div>
  );

  return (
    <div className="screen-fade" style={{
      position: 'absolute', inset: 0, zIndex: 95,
      background: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {/* Status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <IOSStatusBar />
      </div>

      {/* Header — back, title, more. Sits above the scroll body and
          fades the content beneath as it scrolls under. */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, zIndex: 25,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0.92) 70%, rgba(255,255,255,0) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>
        <button onClick={onClose} aria-label="Back" style={{
          width: 40, height: 40, borderRadius: 999,
          border: 'none', background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, color: '#1A1A22',
        }}>
          <Icon.Back size={20} stroke={2.2} />
        </button>
        <div style={{
          flex: 1, minWidth: 0, textAlign: 'center',
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 16, lineHeight: '22px', fontWeight: 600,
          color: '#09090B', letterSpacing: -0.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          padding: '0 6px',
        }}>{title}</div>
        <button aria-label="More" style={{
          width: 40, height: 40, borderRadius: 999,
          border: '0.5px solid rgba(9,9,11,0.10)',
          background: 'rgba(250,250,250,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, color: '#1A1A22',
        }}>
          <Icon.Dots size={18} color="#1A1A22" />
        </button>
      </div>

      {/* Scroll body */}
      <div className="phone-scroll" style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'auto',
        paddingTop: 110,
        paddingBottom: 132,
        WebkitOverflowScrolling: 'touch',
      }}>
        <UserBubble>{renderUserMessage()}</UserBubble>

        {/* Aspect ratio chip — right-aligned under the user bubble */}
        <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 10px',
            border: '0.5px solid rgba(9,9,11,0.16)',
            borderRadius: 999,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 11, color: '#3F3F46', letterSpacing: 0.2,
            background: '#FFFFFF',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="#3F3F46" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="12" rx="2"/>
            </svg>
            <span>{aspect}</span>
          </div>
        </div>

        <AgentLine>
          I'll craft a <strong style={{ fontWeight: 600 }}>{recipe.title}</strong> for you —
          a satisfying ASMR-style transformation that's built to stop the scroll.
          Let me plan it out:
        </AgentLine>

        <div style={{ padding: '4px 20px 12px' }}>
          <ToolPill icon={<ToolGlyph.Script />} label="Wrote Script" />
        </div>

        <AgentLine>
          Starting production now. I'll load the Seedance 2.0 production
          knowledge and generate the reference shots.
        </AgentLine>

        <div style={{ padding: '4px 20px 12px' }}>
          <ToolPill icon={<ToolGlyph.Brain />} label="Load Knowledge" />
        </div>

        <AgentLine>Knowledge loaded. Generating reference frames:</AgentLine>

        <div style={{
          padding: '4px 20px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8,
        }}>
          <ToolPill icon={<ToolGlyph.Image />} label="Generated Images" />
          <span style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 12, color: '#9BA0AB', fontWeight: 500,
          }}>35s</span>
        </div>

        {/* Generated reference preview — uses the recipe image as a
            stand-in for the freshly generated frame. Tapping opens the
            full-bleed share-view page so the user can play / share. */}
        <div style={{ padding: '4px 16px 8px' }}>
          <div
            role={onOpenShareView ? 'button' : undefined}
            tabIndex={onOpenShareView ? 0 : undefined}
            aria-label={onOpenShareView ? 'Play generated video' : undefined}
            onClick={onOpenShareView ? () => onOpenShareView(recipe) : undefined}
            onKeyDown={onOpenShareView ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpenShareView(recipe); }
            } : undefined}
            style={{
              width: '100%',
              aspectRatio: '16 / 11',
              background: '#EEEEF0',
              borderRadius: 16,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 24px rgba(60,40,140,0.08)',
              cursor: onOpenShareView ? 'pointer' : 'default',
            }}
          >
            {recipe.image ? (
              <img src={recipe.image} alt="" draggable={false}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                  filter: 'blur(0.5px) saturate(0.95)',
                  opacity: 0.55,
                }} />
            ) : null}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 60%)',
            }} />
            {/* Center play badge — only shows when the preview is
                interactive, hinting that tapping plays the result. */}
            {onOpenShareView && (
              <div aria-hidden="true" style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 999,
                  background: 'rgba(20, 18, 24, 0.42)',
                  backdropFilter: 'blur(10px) saturate(160%)',
                  WebkitBackdropFilter: 'blur(10px) saturate(160%)',
                  border: '0.5px solid rgba(255, 255, 255, 0.22)',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 5px 10px rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff',
                }}>
                  <Icon.Play2 size={20} color="#fff" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input bar — pill-shaped composer with attach + 3D + send. */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: '8px 12px 28px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 40%, #FFFFFF 100%)',
      }}>
        <div style={{
          position: 'relative',
          background: '#FFFFFF',
          border: '0.5px solid rgba(9,9,11,0.10)',
          borderRadius: 22,
          padding: '10px 14px 10px 14px',
          boxShadow: '0 2px 10px rgba(60,40,140,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14, color: 'rgba(9,9,11,0.38)', lineHeight: '20px',
            paddingBottom: 6,
          }}>Type anything...</div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button aria-label="Attach" style={{
                width: 28, height: 28, borderRadius: 999,
                border: '0.5px solid rgba(9,9,11,0.14)',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0, color: '#3F3F46',
              }}>
                <Icon.Plus size={16} stroke={2.2} />
              </button>
              <button aria-label="3D" style={{
                width: 28, height: 28, borderRadius: 999,
                border: '0.5px solid rgba(9,9,11,0.14)',
                background: 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0, color: '#3F3F46',
              }}>
                <Icon.Cube size={16} stroke={1.8} />
              </button>
            </div>
            <button aria-label="Send" style={{
              width: 32, height: 32, borderRadius: 999,
              border: 'none',
              background: 'rgba(9,9,11,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, color: '#5C5C66',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5"/>
                <path d="M5 12l7-7 7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Share page (Medeo TV) ─────────────────────────────────────────
// Full-screen overlay opened by the share IconButton on the recipe
// detail page. Dark purple stage with a stylized "Medeo TV" set
// playing the recipe preview, plus a horizontal row of share
// targets at the bottom.

// Minimal brand glyphs for share targets. Each renders inside a 22px
// box so they can sit consistently inside the 56px glass FAB.
const ShareGlyph = {
  TikTok: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none">
      <path d="M14.5 3.2c.4 1.7 1.6 3 3.3 3.3v2.3c-1.3 0-2.5-.4-3.5-1.1v5.4a4.3 4.3 0 1 1-4.3-4.3c.2 0 .4 0 .6 0v2.4a2 2 0 1 0 1.5 1.9V3.2h2.4z" fill={color}/>
    </svg>
  ),
  Story: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none">
      <rect x="3" y="3" width="16" height="16" rx="5" stroke={color} strokeWidth="1.7"/>
      <circle cx="11" cy="11" r="3.6" stroke={color} strokeWidth="1.7"/>
      <circle cx="15.6" cy="6.4" r="0.9" fill={color}/>
    </svg>
  ),
  WhatsApp: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none">
      <path d="M11 3.2a7.4 7.4 0 0 0-6.3 11.3L4 18.8l4.4-1.1A7.4 7.4 0 1 0 11 3.2z" stroke={color} strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M8.3 7.5c-.2.5-.4.8-.2 1.3.5 1.4 1.8 2.8 3.3 3.5.5.2.9.1 1.3-.2l.7-.6c.2-.2.5-.2.7-.1l1.4.7c.2.1.3.4.2.7-.3.9-1 1.4-2 1.4-1.8 0-4.1-1.4-5.5-3C7 9.8 6.6 8.2 7.2 7.1c.2-.4.6-.6 1-.5.2 0 .3.1.4.3l.4.6c.1.1.1.3 0 .5l-.7 1.1z" fill={color}/>
    </svg>
  ),
  YouTube: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none">
      <rect x="2" y="5" width="18" height="12" rx="3.4" fill={color}/>
      <path d="M9.4 8.5v5l4.3-2.5z" fill="#1A1A22"/>
    </svg>
  ),
  X: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none">
      <path d="M4.4 4h3.3l3.3 4.4L14.7 4h2.9l-5 5.9 5.4 7.1h-3.3l-3.7-4.8L6.2 17H3.3l5.3-6.3L4.4 4z" fill={color}/>
    </svg>
  ),
  More: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none">
      <circle cx="5.5" cy="11" r="1.7" fill={color}/>
      <circle cx="11" cy="11" r="1.7" fill={color}/>
      <circle cx="16.5" cy="11" r="1.7" fill={color}/>
    </svg>
  ),
  CopyLink: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1"/>
      <path d="M13 9a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1"/>
    </svg>
  ),
  Download: ({ color = '#FFFFFF' }) => (
    <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 3v10"/>
      <path d="M6 9l5 5 5-5"/>
      <path d="M4 17h14"/>
    </svg>
  ),
};

// Single share target — glass circle + label.
function ShareTarget({ icon: IconComp, label, onClick }) {
  return (
    <button onClick={onClick} aria-label={label} style={{
      border: 'none', background: 'transparent', padding: 0,
      cursor: 'pointer', flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      width: 56,
      scrollSnapAlign: 'start',
    }}>
      <div style={{
        position: 'relative',
        width: 56, height: 56, borderRadius: 999,
        background: 'rgba(255, 255, 255, 0.08)',
        border: '0.5px solid rgba(255, 255, 255, 0.12)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.2)',
      }}>
        <IconComp />
      </div>
      <span style={{
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 12, fontWeight: 500, lineHeight: '16px',
        color: 'rgba(255, 255, 255, 0.92)',
        letterSpacing: 0.1,
        whiteSpace: 'nowrap',
      }}>{label}</span>
    </button>
  );
}

// Stylized "Medeo TV" set — purple body with knobs + speaker grille,
// "Medeo TV" pill at the top, and a video screen showing the recipe
// preview with TikTok-style controls on the right edge.
function MedeoTVStage({ recipe }) {
  const TV_W = 324;
  const TV_H = 224;

  return (
    <div style={{
      position: 'relative',
      width: TV_W, height: TV_H + 18, // +18 for the "Medeo TV" pill overhang
    }}>
      {/* Medeo TV pill — sits on top of the TV bezel */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 3,
        padding: '3px 12px',
        borderRadius: 999,
        background: '#9B7BFF',
        border: '1.5px solid #4D2BC2',
        boxShadow: '0 2px 0 rgba(77, 43, 194, 0.6), 0 4px 12px rgba(40, 20, 90, 0.25)',
      }}>
        <span style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
          color: '#FFFFFF',
          textShadow: '0 1px 1px rgba(77, 43, 194, 0.5)',
          textTransform: 'none',
        }}>Medeo TV</span>
      </div>

      {/* TV body */}
      <div style={{
        position: 'absolute', top: 14, left: 0,
        width: TV_W, height: TV_H,
        background: 'linear-gradient(180deg, #A584FF 0%, #7A56E8 50%, #6A44D8 100%)',
        borderRadius: 24,
        boxShadow:
          'inset 0 2px 0 rgba(255, 255, 255, 0.3), ' +
          'inset 0 -3px 0 rgba(40, 20, 90, 0.35), ' +
          '0 18px 36px rgba(20, 8, 60, 0.55), ' +
          '0 6px 16px rgba(20, 8, 60, 0.4)',
      }}>
        {/* Knobs — two small circles on the right */}
        <div style={{
          position: 'absolute', top: 28, right: 14,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              width: 18, height: 18, borderRadius: 999,
              background: 'radial-gradient(circle at 35% 30%, #C5ABFF, #6A44D8 70%)',
              boxShadow:
                'inset 0 1px 1px rgba(255,255,255,0.6), ' +
                'inset 0 -1px 1px rgba(40,20,90,0.5), ' +
                '0 1px 2px rgba(0,0,0,0.3)',
            }} />
          ))}
        </div>

        {/* Speaker grille — vertical lines below the knobs */}
        <div style={{
          position: 'absolute', bottom: 18, right: 12,
          display: 'flex', gap: 2,
        }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{
              width: 2, height: 22, borderRadius: 1,
              background: 'rgba(40, 20, 90, 0.45)',
              boxShadow: 'inset 0 0 1px rgba(0,0,0,0.6)',
            }} />
          ))}
        </div>

        {/* Screen bezel + screen */}
        <div style={{
          position: 'absolute', top: 18, left: 18, right: 50, bottom: 18,
          background: '#1A0F3E',
          borderRadius: 10,
          padding: 4,
          boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 0.6), inset 0 4px 12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            borderRadius: 6, overflow: 'hidden',
            background: '#000',
          }}>
            {recipe.image ? (
              <img
                src={recipe.image}
                alt={recipe.title}
                draggable={false}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', display: 'block',
                }}
              />
            ) : null}

            {/* Top + bottom edge gradients for legibility */}
            <div aria-hidden="true" style={{
              position: 'absolute', left: 0, right: 0, top: 0, height: 40,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
            }} />
            <div aria-hidden="true" style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, height: 56,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)',
            }} />

            {/* TikTok-style right rail — heart, comments, share */}
            <div style={{
              position: 'absolute', top: 6, right: 6, bottom: 30,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              gap: 10,
            }}>
              <TikTokAction icon={<Icon.HeartFill size={18} color="#FF4F8B" />} count="125K" />
              <TikTokAction icon={<Icon.Comment size={16} color="#FFFFFF" stroke={2.2} />} count="3.2K" />
              <TikTokAction icon={<Icon.Share size={15} color="#FFFFFF" stroke={2.2} />} count="8.7K" />
              <div style={{
                width: 22, height: 22, borderRadius: 4,
                border: '1.5px solid rgba(255,255,255,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon.Ratio size={11} color="#FFFFFF" stroke={2.4} />
              </div>
            </div>

            {/* Username + progress bar */}
            <div style={{
              position: 'absolute', left: 6, right: 6, bottom: 4,
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              <div style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 9, fontWeight: 600, color: '#FFFFFF',
                textShadow: '0 1px 2px rgba(0,0,0,0.6)',
              }}>@morgan</div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 7, color: 'rgba(255,255,255,0.9)',
              }}>
                <span>0:01</span>
                <div style={{
                  flex: 1, height: 2, borderRadius: 1,
                  background: 'rgba(255,255,255,0.25)',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: '8%', borderRadius: 1, background: '#FFFFFF',
                  }} />
                </div>
                <span style={{ opacity: 0.7 }}>01:05</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating sparkle stars — a few yellow/pink stars for energy */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: -8, right: 24,
        width: 28, height: 28, color: '#FFD500',
      }}>
        <Sparkle4Star size={28} />
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 38, left: -10,
        width: 14, height: 14, color: '#FFD500',
      }}>
        <Sparkle4Star size={14} />
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: 30, right: -6,
        width: 16, height: 16, color: '#FFD500',
      }}>
        <Sparkle4Star size={16} />
      </div>
    </div>
  );
}

// Four-pointed sparkle star used for the TV stage decorations.
function Sparkle4Star({ size = 18, color = '#FFD500' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M12 0 L13.5 9.5 L24 12 L13.5 14.5 L12 24 L10.5 14.5 L0 12 L10.5 9.5 Z"/>
    </svg>
  );
}

// Single TikTok-style action button: icon + count below.
function TikTokAction({ icon, count }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    }}>
      {icon}
      <span style={{
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 8, fontWeight: 600, color: '#FFFFFF',
        textShadow: '0 1px 2px rgba(0,0,0,0.7)',
      }}>{count}</span>
    </div>
  );
}

function SharePage({ recipe, onClose }) {
  const [copyToast, setCopyToast] = React.useState(null);
  const SHARE_TARGETS = [
    { id: 'copy',      label: 'Copy link', icon: ShareGlyph.CopyLink },
    { id: 'whatsapp',  label: 'WhatsApp',  icon: ShareGlyph.WhatsApp },
    { id: 'tiktok',    label: 'TikTok',    icon: ShareGlyph.TikTok },
    { id: 'instagram', label: 'Instagram', icon: ShareGlyph.Story },
    { id: 'youtube',   label: 'YouTube',   icon: ShareGlyph.YouTube },
    { id: 'x',         label: 'X',         icon: ShareGlyph.X },
    { id: 'download',  label: 'Download',  icon: ShareGlyph.Download },
    { id: 'more',      label: 'More',      icon: ShareGlyph.More },
  ];

  const handleShareTarget = React.useCallback(async (target) => {
    if (target.id === 'copy') {
      const url = `https://medeo.app/share/${recipe && recipe.id ? recipe.id : 'creation'}`;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(url);
        } else {
          const input = document.createElement('input');
          input.value = url;
          input.setAttribute('readonly', '');
          input.style.position = 'absolute';
          input.style.left = '-9999px';
          document.body.appendChild(input);
          input.select();
          const copied = document.execCommand && document.execCommand('copy');
          document.body.removeChild(input);
          if (!copied) throw new Error('Copy command failed');
        }
        setCopyToast({ kind: 'success', icon: 'copy', message: 'Link copied' });
      } catch (_) {
        setCopyToast({ kind: 'error', icon: 'copy', message: 'Copy failed' });
      }
      window.setTimeout(() => setCopyToast(null), 1800);
    } else if (target.id === 'download') {
      try {
        if (!recipe || !recipe.image) {
          throw new Error('No downloadable media');
        }
        const a = document.createElement('a');
        a.href = recipe.image;
        a.download = `${(recipe.title || 'medeo-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'medeo-video'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setCopyToast({ kind: 'success', icon: 'download', message: 'Download started' });
      } catch (_) {
        setCopyToast({ kind: 'error', icon: 'download', message: 'Download failed' });
      }
      window.setTimeout(() => setCopyToast(null), 1800);
    }
  }, [recipe && recipe.id]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background:
        'radial-gradient(120% 100% at 50% 0%, #5B2EB8 0%, #381879 45%, #1F0B57 100%)',
      overflow: 'hidden',
      animation: 'shareFadeIn 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Status bar overlay — white text version */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <IOSStatusBar dark />
      </div>

      {/* Back button — glass pill, white icon */}
      <button onClick={onClose} aria-label="Back" style={{
        position: 'absolute', top: 78, left: 20, zIndex: 10,
        width: 44, height: 44, borderRadius: 999,
        border: '0.5px solid rgba(255, 255, 255, 0.18)',
        background: 'rgba(255, 255, 255, 0.10)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        boxShadow:
          'inset 0 1px 1px rgba(255, 255, 255, 0.3), ' +
          'inset 0 -1px 2px rgba(0, 0, 0, 0.15)',
        color: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
      }}>
        <Icon.Back size={18} stroke={2.2} />
      </button>

      {/* Headline */}
      <h1 style={{
        margin: 0,
        position: 'absolute', top: 156, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: '"Manrope", system-ui, sans-serif',
        fontSize: 30, lineHeight: '36px', fontWeight: 700,
        color: '#FFFFFF', letterSpacing: -0.5,
      }}>
        Express <span style={{ color: '#D4F87B' }}>yourself</span>,<br />
        elevate your life.
      </h1>

      {/* Medeo TV stage — vertically centered between headline and
          share row. Wrapper enables the floating decorations to sit
          outside the TV's bounding box. */}
      <div style={{
        position: 'absolute', top: 304, left: '50%',
        transform: 'translateX(-50%)',
      }}>
        <MedeoTVStage recipe={recipe} />
      </div>

      {/* Bottom share targets row — horizontal scroll, fades on right
          to hint at more options. */}
      <div style={{
        position: 'absolute', bottom: 44, left: 0, right: 0,
        padding: '0 0 0 20px',
        WebkitMaskImage: 'linear-gradient(90deg, #000 0%, #000 calc(100% - 38px), transparent 100%)',
        maskImage: 'linear-gradient(90deg, #000 0%, #000 calc(100% - 38px), transparent 100%)',
      }}>
        <div className="phone-scroll" style={{
          display: 'flex', gap: 18,
          overflowX: 'auto', overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '0 56px 4px 0',
          scrollSnapType: 'x proximity',
        }}>
          {SHARE_TARGETS.map((t) => (
            <ShareTarget key={t.id} label={t.label} icon={t.icon} onClick={() => handleShareTarget(t)} />
          ))}
        </div>
      </div>

      {copyToast && (
        <div role="status" style={{
          position: 'absolute',
          left: '50%', bottom: 150,
          transform: 'translateX(-50%)',
          zIndex: 20,
          height: 40,
          padding: '0 16px',
          borderRadius: 'var(--shape-radius-full)',
          background: copyToast.kind === 'error'
            ? 'rgba(186,26,26,0.92)'
            : 'rgba(20,18,24,0.84)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          pointerEvents: 'none',
          animation: 'toastIn 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        }}>
          {copyToast.kind === 'error'
            ? <Icon.Warning size={15} color="#FFFFFF" />
            : copyToast.icon === 'download'
              ? <Icon.Download size={15} color="#FFFFFF" />
              : <Icon.Share size={15} color="#FFFFFF" stroke={1.8} />}
          {copyToast.message}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ShareViewScreen
// ---------------------------------------------------------------------------
// The "shared content viewer" — the page someone lands on when they receive
// a shared video/recipe link. Per Figma node 20669:12391 ("share 1/free user").
//
// Layout:
//   • Full-bleed background video/image fills the entire phone frame.
//   • Status bar + glass back button overlay the top.
//   • A bottom gradient pad hosts the title, description, scrubber and
//     three actions: a large "Edit" lavender pill that fills
//     the row, plus circular glass download + share icon buttons.
//
// Intentionally separate from SharePage (the "where do I share to" picker)
// because they sit at different points in the share flow: ShareViewScreen
// is for consumers viewing a creation, SharePage is for the creator
// distributing it.
function ShareViewScreen({ recipe, onClose, onUseRecipe, onEditRecipe, onOpenCreationLog, accent = '#7C5BFD' }) {
  const r = recipe || {};
  const theme = (window.CARD_THEMES && window.CARD_THEMES[r.theme]) || {};
  const bgColor = theme.bg || '#1A1A22';
  const title = r.title || 'Recipe title';
  const [configOpen, setConfigOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [downloadToast, setDownloadToast] = React.useState(null);
  const [photoPermission, setPhotoPermission] = React.useState('prompt'); // prompt | granted | denied
  const [photoPermissionPrompt, setPhotoPermissionPrompt] = React.useState(false);
  const [settingsPrompt, setSettingsPrompt] = React.useState(false);
  const credits = typeof r.credits === 'number' ? r.credits : 12;
  // Mock playhead — 0:01 out of a 0:16 clip, ~6% played. Matches Figma.
  const PROGRESS = 0.06;
  // "Creating" state — the result page opened from a still-generating
  // CreateSpace card. Shows a building indicator instead of playback /
  // download controls; the chat icon still routes to the conversation.
  const isCreating = !!r.__generating;
  const creatingPct = Math.round((typeof r.progress === 'number' ? r.progress : 0) * 100);

  const saveToPhotos = React.useCallback(() => {
    try {
      if (!r.image) {
        throw new Error('No downloadable media');
      }
      const a = document.createElement('a');
      a.href = r.image;
      a.download = `${(title || 'medeo-video').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'medeo-video'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadToast({ kind: 'success', message: 'Saved to Photos' });
    } catch (_) {
      setDownloadToast({ kind: 'error', message: 'Download failed' });
    }
    window.setTimeout(() => setDownloadToast(null), 1800);
  }, [r.image, title]);

  const handleDownload = React.useCallback(() => {
    if (photoPermission === 'granted') {
      saveToPhotos();
      return;
    }
    if (photoPermission === 'prompt') {
      setPhotoPermissionPrompt(true);
      return;
    }
    setSettingsPrompt(true);
  }, [photoPermission, saveToPhotos]);

  // Preview file used inside the caption — recipes that have a real
  // previewFile (e.g. jelly's "@character face image") use it directly;
  // otherwise we synthesise a sensible default so the chip is never
  // raw "@placeholder#ph_1@" text. Falls back to the recipe's hero image
  // as the thumbnail so the chip always shows something.
  const previewFile = r.previewFile || {
    name: '@character profile',
    thumb: r.image,
  };

  // Inline chip variants — dark for the on-video caption (white text
  // over translucent white), light for the frosted sheet (dark text on
  // lavender wash). Both render thumbnail + name inline so they flow
  // inside copy like a Notion mention pill.
  const PromptChip = ({ variant = 'dark' }) => {
    const dark = variant === 'dark';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: 2,
        background: dark ? 'rgba(255,255,255,0.18)' : 'rgba(208, 188, 255, 0.18)',
        border: dark
          ? '0.5px solid rgba(255,255,255,0.28)'
          : '0.5px solid rgba(134, 61, 251, 0.22)',
        borderRadius: 6,
        verticalAlign: '-5px',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}>
        {previewFile.thumb && (
          <img
            src={previewFile.thumb}
            alt=""
            draggable={false}
            style={{
              width: 18, height: 18, borderRadius: 4,
              objectFit: 'cover', display: 'block',
              pointerEvents: 'none',
            }}
          />
        )}
        <span style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 12, fontWeight: 500, lineHeight: '17px',
          color: dark ? '#FFFFFF' : '#3F3F46',
          letterSpacing: 0.2,
          padding: '0 4px',
        }}>{previewFile.name}</span>
      </span>
    );
  };

  // ── IG-style expandable caption sheet ───────────────────────────────
  // Tapping the title/description block lifts a bottom sheet to roughly
  // half the screen. The sheet cannot expand to full page; its body
  // scrolls internally for longer prompt content.
  const PHONE_H = 852;
  const SHEET_HALF = 430;          // max opened height (~50%)
  const SHEET_DISMISS = 120;       // < this on release → close
  const [sheetH, setSheetH] = React.useState(0);
  const sheetOpen = sheetH > 0;

  const openSheet = React.useCallback(() => { setSheetH(SHEET_HALF); }, []);
  const closeSheet = React.useCallback(() => { setSheetH(0); }, []);

  // Drag — only fires when the user pulls from the handle. The body of
  // the sheet stays scrollable in its own right.
  const dragRef = React.useRef({ active: false, startY: 0, startH: 0 });
  const onHandleDown = (e) => {
    dragRef.current.active = true;
    dragRef.current.startY = e.clientY;
    dragRef.current.startH = sheetH || SHEET_HALF;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
  };
  const onHandleMove = (e) => {
    if (!dragRef.current.active) return;
    const dy = dragRef.current.startY - e.clientY;
    const next = Math.max(0, Math.min(SHEET_HALF, dragRef.current.startH + dy));
    setSheetH(next);
  };
  const onHandleUp = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    if (sheetH < SHEET_DISMISS) closeSheet();
    else setSheetH(SHEET_HALF);
  };

  // 0 → fully closed, 1 → at the half-screen max height.
  // Drives the gradient/overlay fade so the original bottom controls
  // stay readable while the sheet is climbing past the halfway snap.
  const halfProgress = Math.min(1, sheetH / SHEET_HALF);

  // Inline glass icon button — used for download + share on the right edge
  // of the action bar. Defined inside the component so it can pick up the
  // surface tokens without prop drilling.
  const glassIconBtn = {
    width: 50, height: 50, borderRadius: 999,
    border: '1px solid rgba(56, 30, 114, 0.16)',
    background: 'rgba(20, 18, 24, 0.16)',
    backdropFilter: 'blur(10px) saturate(160%)',
    WebkitBackdropFilter: 'blur(10px) saturate(160%)',
    boxShadow:
      'inset 0 1px 1px rgba(255, 255, 255, 0.2), ' +
      'inset 0 5px 10px rgba(255, 255, 255, 0.15)',
    color: '#FFFFFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', padding: 0, flexShrink: 0,
  };

  // Cubic-bezier-ish ease for sheet height & video shrink. Only used when
  // not actively dragging (so the live finger response stays 1:1).
  const ease = dragRef.current.active ? 'none' : 'height 320ms cubic-bezier(0.32, 0.72, 0, 1), bottom 320ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease, transform 320ms cubic-bezier(0.32, 0.72, 0, 1)';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: '#000',
      overflow: 'hidden',
      animation: 'shareFadeIn 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
    }}>
      {/* Video stage — fills the area above the sheet. As sheetH grows,
          the stage's bottom edge rises and the video scales DOWN
          proportionally (object-fit: contain) so the whole frame stays
          visible with black letterbox margins — the Xiaohongshu /
          Douyin pattern, not the IG cover-crop pattern. */}
      <div
        onClick={sheetOpen ? closeSheet : undefined}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          bottom: sheetH, height: 'auto',
          background: '#000',
          overflow: 'hidden',
          transition: ease,
          cursor: sheetOpen ? 'pointer' : 'default',
        }}
      >
        {r.image && (
          <img
            src={r.image}
            alt={title}
            draggable={false}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'contain', objectPosition: 'center',
              pointerEvents: 'none', userSelect: 'none',
              filter: isCreating ? 'brightness(0.5) saturate(0.85)' : 'none',
            }}
          />
        )}
        {isCreating && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: '0 40px', textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div className="proj-spinner" style={{
              width: 44, height: 44, borderRadius: 999,
              border: '3px solid rgba(255,255,255,0.28)',
              borderTopColor: '#FFFFFF',
            }} />
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 18, fontWeight: 800, color: '#FFFFFF',
              letterSpacing: -0.3, textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>Creating your video…</div>
            <div style={{
              width: 180, height: 4, borderRadius: 999,
              background: 'rgba(255,255,255,0.24)', overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.max(6, creatingPct)}%`, height: '100%',
                borderRadius: 999, background: '#FFFFFF',
                transition: 'width 0.3s linear',
              }} />
            </div>
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}>{creatingPct}% · open chat to follow along</div>
          </div>
        )}
      </div>

      {/* Status bar — white text version for legibility over media */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <IOSStatusBar dark />
      </div>

      {/* Back button — circular glass per Figma (50×50, soft inner highlights) */}
      <button onClick={onClose} aria-label="Back" style={{
        position: 'absolute', top: 78, left: 20, zIndex: 30,
        width: 50, height: 50, borderRadius: 999,
        border: '1px solid rgba(56, 30, 114, 0.16)',
        background: 'rgba(20, 18, 24, 0.16)',
        backdropFilter: 'blur(10px) saturate(160%)',
        WebkitBackdropFilter: 'blur(10px) saturate(160%)',
        boxShadow:
          'inset 0 1px 1px rgba(255, 255, 255, 0.2), ' +
          'inset 0 5px 10px rgba(255, 255, 255, 0.15)',
        color: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', padding: 0,
      }}>
        <Icon.Back size={18} stroke={2.2} />
      </button>

      {onOpenCreationLog && (
        <div style={{
          position: 'absolute',
          top: 78,
          right: 20,
          zIndex: 30,
          display: 'flex',
          gap: 10,
        }}>
          <button onClick={() => onOpenCreationLog(r)} aria-label="View creation log" style={{
            width: 50, height: 50, borderRadius: 999,
            border: '1px solid rgba(56, 30, 114, 0.16)',
            background: 'rgba(20, 18, 24, 0.16)',
            backdropFilter: 'blur(10px) saturate(160%)',
            WebkitBackdropFilter: 'blur(10px) saturate(160%)',
            boxShadow:
              'inset 0 1px 1px rgba(255, 255, 255, 0.2), ' +
              'inset 0 5px 10px rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            <Icon.Chat size={19} color="#FFFFFF" stroke={2} />
          </button>
          <button aria-label="Report creation" style={{
            width: 50, height: 50, borderRadius: 999,
            border: '1px solid rgba(56, 30, 114, 0.16)',
            background: 'rgba(20, 18, 24, 0.16)',
            backdropFilter: 'blur(10px) saturate(160%)',
            WebkitBackdropFilter: 'blur(10px) saturate(160%)',
            boxShadow:
              'inset 0 1px 1px rgba(255, 255, 255, 0.2), ' +
              'inset 0 5px 10px rgba(255, 255, 255, 0.15)',
            color: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            <Icon.Flag size={19} color="#FFFFFF" stroke={2} />
          </button>
        </div>
      )}

      {/* Mute icon — pinned to the visible video area's bottom-right when
          the sheet is open (matches IG Reels position). Hidden when the
          original bottom overlay is showing because the overlay has its
          own mute control inline with the scrubber. */}
      {sheetOpen && (
        <button aria-label="Mute" style={{
          position: 'absolute', right: 16, bottom: sheetH + 16, zIndex: 20,
          width: 36, height: 36, borderRadius: 999,
          background: 'rgba(20, 18, 24, 0.5)',
          backdropFilter: 'blur(10px) saturate(160%)',
          WebkitBackdropFilter: 'blur(10px) saturate(160%)',
          border: '0.5px solid rgba(255,255,255,0.18)',
          color: '#fff', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: ease,
        }}>
          <Icon.VolumeOff size={18} color="#FFFFFF" />
        </button>
      )}

      {/* Bottom overlay — gradient + title/description/scrubber/actions.
          Fades and translates out of the way as the sheet rises so it
          never collides with the sheet's own content. Pointer events
          are disabled past the half snap so the sheet drag wins. */}
      <div style={{
        position: 'absolute', left: 0, right: 0,
        bottom: 0,
        paddingTop: 12,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.20) 55%, rgba(0,0,0,0.55) 100%)',
        display: 'flex', flexDirection: 'column', gap: 0,
        zIndex: 10,
        opacity: 1 - halfProgress,
        transform: `translateY(${halfProgress * 24}px)`,
        pointerEvents: halfProgress > 0.5 ? 'none' : 'auto',
        transition: ease,
      }}>
        {/* Title + description block — tap to expand into the IG sheet */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Show description"
          onClick={openSheet}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSheet(); }
          }}
          style={{
            padding: '4px 20px 6px',
            display: 'flex', flexDirection: 'column', gap: 4,
            cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {r.fromRecipe && (
            <span aria-label="Made from a recipe" style={{
              alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginBottom: 4,
              padding: '3px 9px 3px 7px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.16)',
              border: '0.5px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(10px) saturate(150%)',
              WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            }}>
              <Icon.Sparkles size={12} color="#FFFFFF" />
              <span style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 11, fontWeight: 800, letterSpacing: 0.2,
                color: '#FFFFFF', lineHeight: 1,
              }}>Recipe</span>
            </span>
          )}
          <div style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 16, fontWeight: 600,
            lineHeight: '24px', letterSpacing: 0.15,
            color: '#E5E3E8',
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
          }}>{title}</div>
          <div style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 12, fontWeight: 500,
            lineHeight: '20px', letterSpacing: 0.2,
            color: '#FFFFFF',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {'Create a video of '}
            <PromptChip variant="dark" />
            {' and ...'}
          </div>
        </div>

        {/* Scrubber row — 0:01 ──●──────── 0:16  [mute]. Hidden while the
            video is still being created (nothing to scrub yet). */}
        {!isCreating && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 8px 0 20px',
        }}>
          <span style={{
            fontFamily: '"Geist Mono", ui-monospace, Menlo, monospace',
            fontSize: 12, fontWeight: 500, color: '#FFFFFF',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
          }}>0:01</span>
          <div style={{
            flex: 1, position: 'relative',
            height: 4, borderRadius: 999,
            background: 'rgba(232, 222, 248, 0.18)',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: `${PROGRESS * 100}%`,
              background: '#E5E3E8', borderRadius: 999,
            }} />
          </div>
          <span style={{
            fontFamily: '"Geist Mono", ui-monospace, Menlo, monospace',
            fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.6)',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
          }}>0:16</span>
          <button aria-label="Mute" style={{
            width: 44, height: 44, borderRadius: 999,
            border: 'none', background: 'transparent',
            color: 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
            <Icon.VolumeOff size={20} color="#FFFFFF" />
          </button>
        </div>
        )}

        {/* Action row — while creating, a single disabled status pill +
            the chat shortcut; once ready, the Edit / Download / Share row. */}
        {isCreating ? (
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 8, padding: '12px 12px 40px',
          }}>
            <div style={{
              flex: 1, height: 50, borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              border: '0.5px solid rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.9)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 14, fontWeight: 700, letterSpacing: 0.1,
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            }}>
              <span className="proj-spinner" style={{
                width: 16, height: 16, borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                display: 'inline-block',
              }} />
              Creating… {creatingPct}%
            </div>
            <button
              aria-label="Download disabled while creating"
              disabled
              style={{
                ...glassIconBtn,
                cursor: 'not-allowed',
                opacity: 0.42,
                filter: 'grayscale(1)',
              }}
            >
              <Icon.Download size={18} color="#FFFFFF" />
            </button>
            <button
              aria-label="Share disabled while creating"
              disabled
              style={{
                ...glassIconBtn,
                cursor: 'not-allowed',
                opacity: 0.42,
                filter: 'grayscale(1)',
              }}
            >
              <Icon.Share size={18} color="#FFFFFF" stroke={1.8} />
            </button>
          </div>
        ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 8, padding: '12px 12px 40px',
        }}>
          <button
            onClick={() => {
              // "Edit" routes by how the result was made:
              //  • recipe-generated → reopen the original Recipe Detail
              //    with its config sheet auto-raised, so the user can
              //    re-tune the inputs they originally filled in.
              //  • conversation-generated → guide back to the creation
              //    chat/log to keep iterating in context.
              if (r.fromRecipe) {
                if (onEditRecipe) onEditRecipe(r);
                else setConfigOpen(true);
              } else if (onOpenCreationLog) {
                onOpenCreationLog(r);
              } else {
                setConfigOpen(true);
              }
            }}
            style={{
              flex: 1, height: 50, borderRadius: 999,
              background: '#E0CCFF',
              border: '0.5px solid rgba(229, 227, 232, 0.12)',
              color: '#26222A',
              padding: '12px 24px 12px 16px',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 14, fontWeight: 500, lineHeight: '20px', letterSpacing: 0.1,
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 6px 24px rgba(56, 30, 114, 0.18)',
            }}
          >
            <Icon.ChefHat size={18} color="#26222A" />
            <span>Edit</span>
          </button>
          <button
            aria-label="Download to local album"
            onClick={handleDownload}
            style={glassIconBtn}
          >
            <Icon.Download size={18} color="#FFFFFF" />
          </button>
          <button
            aria-label="Share"
            onClick={() => setShareOpen(true)}
            style={glassIconBtn}
          >
            <Icon.Share size={18} color="#FFFFFF" stroke={1.8} />
          </button>
        </div>
        )}
      </div>

      {/* Xiaohongshu-style description sheet ───────────────────────────
          Slides up from below and maxes at half-screen height. The
          internal body scrolls for longer prompt content; it never
          becomes a full-page sheet. */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: sheetH,
        zIndex: 40,
        background: '#16141A',
        borderTopLeftRadius: 16, borderTopRightRadius: 16,
        boxShadow: '0 -6px 24px rgba(0, 0, 0, 0.45)',
        overflow: 'hidden',
        transition: ease,
        display: 'flex', flexDirection: 'column',
        // The sheet wrapper itself never receives pointer events when
        // collapsed — so the description block underneath stays tappable.
        pointerEvents: sheetOpen ? 'auto' : 'none',
      }}>
        {/* Drag handle area — wide hit target. Pointer events here drive
            the snap-point logic above. */}
        <div
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
          style={{
            padding: '10px 0 6px',
            display: 'flex', justifyContent: 'center',
            cursor: 'grab', touchAction: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 36, height: 4, borderRadius: 999,
            background: 'rgba(255, 255, 255, 0.22)',
          }} />
        </div>

        {/* Scrollable body — title + caption + prompt copy. */}
        <div className="phone-scroll" style={{
          flex: 1, minHeight: 0, overflow: 'auto',
          padding: '8px 20px 24px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Title */}
          {r.fromRecipe && (
            <span aria-label="Made from a recipe" style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              margin: '4px 0 8px',
              padding: '3px 10px 3px 8px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.16)',
              border: '0.5px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(10px) saturate(150%)',
              WebkitBackdropFilter: 'blur(10px) saturate(150%)',
            }}>
              <Icon.Sparkles size={12} color="#FFFFFF" />
              <span style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 11, fontWeight: 800, letterSpacing: 0.2,
                color: '#FFFFFF', lineHeight: 1,
              }}>Recipe</span>
            </span>
          )}
          <h2 style={{
            margin: '4px 0 8px',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 20, lineHeight: '26px', fontWeight: 700,
            letterSpacing: -0.2, color: '#FFFFFF',
          }}>{title}</h2>

          {/* Short caption — single-line hook that mirrors what shows on
              the video. The chip flows inline so it reads as natural copy
              ("Create a video of [thumb] @character profile and ..."). */}
          <p style={{
            margin: '0 0 14px',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14, lineHeight: '22px', fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.88)', letterSpacing: 0.1,
          }}>
            {'Create a video of '}
            <PromptChip variant="dark" />
            {' and ...'}
          </p>

          {/* Section heading */}
          <div style={{
            margin: '8px 0 6px',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 13, fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.55)', letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}>Prompt</div>

          {/* Long-form description — the full recipe brief. Falls back to
              a generic placeholder if the recipe has no copy. */}
          <p style={{
            margin: 0,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14, lineHeight: '22px', fontWeight: 400,
            color: 'rgba(255, 255, 255, 0.78)', letterSpacing: 0.1,
            whiteSpace: 'pre-wrap',
          }}>
            {r.description ||
              'Turn any face into a squishy, jelly-like sculpture being molded by hands. Satisfying, weird, and impossible to scroll past — built for ASMR and curiosity-driven virality.'}
          </p>
        </div>
      </div>

      {/* Direct remix config — same component used from Recipe Detail.
          It opens as a bottom sheet and can be pushed to the top to
          become a full-page configuration surface. */}
      {configOpen && (
        <RecipeConfigSheet
          recipe={r}
          credits={credits}
          onClose={() => setConfigOpen(false)}
          onSubmit={() => {
            if (typeof window.__enqueueGeneration === 'function') {
              window.__enqueueGeneration({ ...r, fromRecipe: true });
            }
            setConfigOpen(false);
            onClose && onClose();
          }}
        />
      )}

      {/* Prototype feedback for "save to local album". On native this
          would call the Photos permission / save API; here we trigger a
          file download when possible and show success / failure. */}
      {downloadToast && (
        <div role="status" style={{
          position: 'absolute',
          left: '50%', bottom: 126,
          transform: 'translateX(-50%)',
          zIndex: 130,
          height: 40,
          padding: '0 16px',
          borderRadius: 'var(--shape-radius-full)',
          background: downloadToast.kind === 'error'
            ? 'rgba(186,26,26,0.92)'
            : 'rgba(20,18,24,0.84)',
          color: '#FFFFFF',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
          backdropFilter: 'blur(14px) saturate(160%)',
          WebkitBackdropFilter: 'blur(14px) saturate(160%)',
          pointerEvents: 'none',
          animation: 'toastIn 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
        }}>
          {downloadToast.kind === 'error'
            ? <Icon.Warning size={15} color="#FFFFFF" />
            : <Icon.Download size={15} color="#FFFFFF" />}
          {downloadToast.message}
        </div>
      )}

      {photoPermissionPrompt && (
        <PhotoPermissionDialog
          title="Allow Medeo to save to Photos?"
          body="Medeo needs access to your photo library to save generated videos to your local album."
          primaryLabel="Allow"
          secondaryLabel="Don’t Allow"
          onPrimary={() => {
            setPhotoPermission('granted');
            setPhotoPermissionPrompt(false);
            saveToPhotos();
          }}
          onSecondary={() => {
            setPhotoPermission('denied');
            setPhotoPermissionPrompt(false);
            setSettingsPrompt(true);
          }}
        />
      )}

      {settingsPrompt && (
        <PhotoPermissionDialog
          title="Photos access is off"
          body="Turn on Photos permission in Settings to save generated videos to your local album."
          primaryLabel="Go to Settings"
          secondaryLabel="Cancel"
          onPrimary={() => {
            setSettingsPrompt(false);
            setDownloadToast({ kind: 'error', message: 'Open Settings to enable Photos' });
            window.setTimeout(() => setDownloadToast(null), 1800);
          }}
          onSecondary={() => setSettingsPrompt(false)}
        />
      )}

      {shareOpen && (
        <SharePage
          recipe={r}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Onboarding flow — sign in + notification permission.
// ──────────────────────────────────────────────
function OnboardingFlow({ onComplete }) {
  const [step, setStep] = React.useState(0);

  if (step === 0) {
    return (
      <div className="screen-fade" style={{
        position: 'absolute', inset: 0, zIndex: 210,
        background: '#F7F2FD',
        overflow: 'hidden',
      }}>
        <IOSStatusBar />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: -30,
          opacity: 0.24,
          filter: 'blur(1px)',
          transform: 'rotate(-10deg) scale(1.08)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          padding: '78px 18px',
        }}>
          {(window.RECIPES || []).slice(0, 6).map((r) => (
            <div key={r.id} style={{
              height: 220,
              borderRadius: 28,
              background: r.image ? `url(${r.image}) center / cover` : ((window.CARD_THEMES[r.theme] || {}).bg || '#E9DEF7'),
            }} />
          ))}
        </div>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.68), rgba(247,242,253,0.84))',
        }} />
        <div style={{
          position: 'relative', zIndex: 1, height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '92px 38px 34px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 17, fontWeight: 800, color: '#09090B',
          }}>
            <span style={{ fontSize: 24, color: 'var(--color-schemes-primary)' }}>✾</span>
            Medeo
          </div>
          <div style={{ marginTop: 118, textAlign: 'center' }}>
            <h1 style={{
              margin: 0,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 31,
              lineHeight: '38px',
              fontWeight: 800,
              letterSpacing: -1.1,
              color: '#09090B',
            }}>One Click to <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}>Pro Videos</span></h1>
            <p style={{
              margin: '14px 0 0',
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 17,
              lineHeight: '24px',
              color: '#8A838F',
              fontWeight: 500,
            }}>Make great videos by chatting with AI</p>
          </div>
          <div style={{ flex: 1 }} />
          <p style={{
            margin: '0 0 18px',
            textAlign: 'center',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14.5,
            lineHeight: '21px',
            color: '#8A838F',
            fontWeight: 600,
          }}>Keep your creations, credits, and generated videos<br />in sync across all your devices.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OnboardingAuthButton dark icon="" label="Continue with Apple" onClick={() => setStep(4)} />
            <OnboardingAuthButton blue icon="G" label="Continue with Google" onClick={() => setStep(4)} />
            <OnboardingAuthButton label="Continue with phone number" onClick={() => setStep(4)} />
            <OnboardingAuthButton ghost label="Continue without an account" onClick={() => setStep(4)} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 18,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 12.5,
            lineHeight: '18px',
            color: '#625B66',
          }}>
            <span>Terms of Use</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="screen-fade" style={{
        position: 'absolute', inset: 0, zIndex: 210,
        background: '#F4F4F5',
        overflow: 'hidden',
      }}>
        <IOSStatusBar />
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          padding: '78px 36px 72px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 22,
          }}>
            <div style={{
              width: 108,
              height: 108,
              borderRadius: 32,
              background: 'linear-gradient(160deg, rgba(134,61,251,0.16), rgba(224,204,255,0.42))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 18px 48px rgba(134,61,251,0.16), inset 0 1px 1px rgba(255,255,255,0.72)',
            }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: 'var(--color-schemes-primary)',
                color: 'var(--color-schemes-on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(134,61,251,0.32)',
              }}>
                <Icon.Bell size={34} color="currentColor" stroke={2.1} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 38, textAlign: 'center' }}>
            <h1 style={{
              margin: 0,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 29,
              lineHeight: '34px',
              fontWeight: 800,
              letterSpacing: -0.9,
              color: '#09090B',
            }}>Don’t miss your<br />creation moments</h1>
            <p style={{
              margin: '16px auto 0',
              maxWidth: 300,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 15.5,
              lineHeight: '23px',
              fontWeight: 600,
              color: '#7A737F',
            }}>We’ll only notify you when something important happens.</p>
          </div>

          <div style={{
            marginTop: 28,
            background: '#FFFFFF',
            borderRadius: 22,
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}>
            {[
              ['✨', 'Your video is ready to watch'],
              ['⚠️', 'A generation failed and needs review'],
              ['🧪', 'New templates are available'],
            ].map(([emoji, text], i, arr) => (
              <div key={text} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                minHeight: 54,
                padding: '10px 16px',
                borderBottom: i < arr.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
              }}>
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: 'rgba(134,61,251,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}>{emoji}</span>
                <span style={{
                  fontFamily: '"Manrope", system-ui, sans-serif',
                  fontSize: 15,
                  lineHeight: '21px',
                  fontWeight: 600,
                  color: '#1F1A23',
                }}>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={onComplete}
              style={{
                height: 56,
                borderRadius: 'var(--shape-radius-full)',
                border: 'none',
                background: '#09090B',
                color: '#FFFFFF',
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >Allow notifications</button>
            <button
              onClick={onComplete}
              style={{
                height: 52,
                borderRadius: 'var(--shape-radius-full)',
                border: '0.5px solid rgba(0,0,0,0.08)',
                background: '#FFFFFF',
                color: '#3F3F46',
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >Not now</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function OnboardingAuthButton({ label, icon, dark, blue, ghost, onClick }) {
  return (
    <button onClick={onClick} style={{
      height: 64,
      borderRadius: 'var(--shape-radius-full)',
      border: ghost ? '0.5px solid rgba(9,9,11,0.10)' : 'none',
      background: dark ? '#09090B' : blue ? '#2E5FFF' : ghost ? 'rgba(255,255,255,0.24)' : '#FFFFFF',
      color: dark || blue ? '#FFFFFF' : '#09090B',
      fontFamily: '"Manrope", system-ui, sans-serif',
      fontSize: 17,
      lineHeight: '24px',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: ghost ? 'none' : '0 2px 8px rgba(60,40,140,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      {icon && <span style={{ fontSize: icon === 'G' ? 19 : 20, fontWeight: 800 }}>{icon}</span>}
      {label}
    </button>
  );
}

function ReferralRewardSheet({ offer, accent = '#863dfb', onClaim, onClose }) {
  if (!offer) return null;
  const amount = typeof offer.amount === 'number' ? offer.amount : 50;
  const inviter = offer.inviterName || 'A friend';
  const code = offer.code || 'MEDEO50';
  return (
    <div className="screen-fade" style={{
      position: 'absolute',
      inset: 0,
      zIndex: 215,
      background: 'rgba(9, 9, 11, 0.20)',
      backdropFilter: 'blur(10px) saturate(140%)',
      WebkitBackdropFilter: 'blur(10px) saturate(140%)',
      display: 'flex',
      alignItems: 'flex-end',
      padding: '0 16px 22px',
      boxSizing: 'border-box',
    }}>
      <button
        aria-label="Dismiss referral reward"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, border: 'none', background: 'transparent', padding: 0 }}
      />
      <div style={{
        position: 'relative',
        width: '100%',
        borderRadius: 32,
        background: '#FFFFFF',
        border: '0.5px solid rgba(255,255,255,0.72)',
        boxShadow: '0 26px 70px rgba(20, 8, 60, 0.28), 0 4px 14px rgba(20, 8, 60, 0.10)',
        overflow: 'hidden',
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% -10%, rgba(134,61,251,0.22), rgba(255,255,255,0) 45%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'relative',
          padding: '28px 24px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            width: 74,
            height: 74,
            borderRadius: 24,
            background: 'rgba(134,61,251,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 14px 36px rgba(134,61,251,0.18)',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 18,
              background: 'var(--color-schemes-primary)',
              color: 'var(--color-schemes-on-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon.Gift size={25} color="currentColor" stroke={2.1} />
            </div>
          </div>

          <div style={{
            marginTop: 18,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 13,
            lineHeight: '18px',
            fontWeight: 700,
            letterSpacing: 0.2,
            color: accent,
          }}>
            Invite link detected
          </div>
          <h2 style={{
            margin: '8px 0 0',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 27,
            lineHeight: '32px',
            fontWeight: 800,
            letterSpacing: -0.9,
            color: '#09090B',
          }}>
            {inviter} sent you<br />{amount} credits
          </h2>
          <p style={{
            margin: '12px 0 0',
            maxWidth: 292,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14.5,
            lineHeight: '21px',
            fontWeight: 600,
            color: '#625B66',
          }}>
            Opened from a shared QR code or invite link. Claim your welcome credits and start creating.
          </p>

          <div style={{
            marginTop: 18,
            width: '100%',
            borderRadius: 18,
            background: '#F7F2FD',
            border: '0.5px solid rgba(134,61,251,0.14)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            boxSizing: 'border-box',
          }}>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 12,
                lineHeight: '16px',
                fontWeight: 700,
                color: '#7A737F',
              }}>
                Referral code
              </div>
              <div style={{
                marginTop: 2,
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 15,
                lineHeight: '20px',
                fontWeight: 800,
                color: '#1F1A23',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {code}
              </div>
            </div>
            <div style={{
              flexShrink: 0,
              height: 32,
              padding: '0 12px',
              borderRadius: 999,
              background: 'rgba(134,61,251,0.12)',
              color: accent,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
            }}>
              +{amount}
            </div>
          </div>

          <button onClick={onClaim} style={{
            marginTop: 18,
            width: '100%',
            height: 56,
            borderRadius: 'var(--shape-radius-full)',
            border: 'none',
            background: 'var(--color-schemes-primary)',
            color: 'var(--color-schemes-on-primary)',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 16,
            lineHeight: '22px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 12px 26px rgba(134,61,251,0.24)',
          }}>
            Claim {amount} credits
          </button>
          <button onClick={onClose} style={{
            height: 44,
            marginTop: 4,
            border: 'none',
            background: 'transparent',
            color: '#7A737F',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoPermissionDialog({
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 150,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 28,
      background: 'rgba(0,0,0,0.28)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      animation: 'fade 0.18s ease',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 320,
        borderRadius: 22,
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28), inset 0 1px 1px rgba(255,255,255,0.8)',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{ padding: '22px 22px 18px' }}>
          <div style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 18,
            lineHeight: '24px',
            fontWeight: 700,
            color: '#09090B',
            letterSpacing: -0.2,
          }}>{title}</div>
          <div style={{
            marginTop: 8,
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 13.5,
            lineHeight: '19px',
            fontWeight: 500,
            color: '#5C5C66',
          }}>{body}</div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          borderTop: '0.5px solid rgba(0,0,0,0.08)',
        }}>
          <button onClick={onSecondary} style={{
            height: 48,
            border: 'none',
            borderRight: '0.5px solid rgba(0,0,0,0.08)',
            background: 'transparent',
            color: '#3F3F46',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}>{secondaryLabel}</button>
          <button onClick={onPrimary} style={{
            height: 48,
            border: 'none',
            background: 'transparent',
            color: 'var(--color-schemes-primary)',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
          }}>{primaryLabel}</button>
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
window.ProjectsScreen = ProjectsScreen;
window.SharePage = SharePage;
window.ShareViewScreen = ShareViewScreen;
window.ConversationScreen = ConversationScreen;
window.NotificationScreen = NotificationScreen;
window.RecipeDetailScreen = RecipeDetailScreen;
window.OnboardingFlow = OnboardingFlow;
window.ReferralRewardSheet = ReferralRewardSheet;
window.RecipeCard = RecipeCard;
