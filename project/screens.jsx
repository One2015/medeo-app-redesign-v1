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
function HeaderCreditsPill({ value = 333 }) {
  // Figma node I17430:15248;2215:20288. Pill button with frosted-glass
  // backdrop and a soft inner highlight — the "liquid glass" look.
  return (
    <div style={{
      position: 'relative', display: 'inline-flex',
      borderRadius: 1000, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.16)',
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'rgba(29,27,32,0.12)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, padding: '12px 16px 12px 12px',
      }}>
        <Icon.Bolt size={18} />
        <span style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 12, lineHeight: '17px', fontWeight: 600, letterSpacing: 0.2,
          color: '#09090B',
        }}>{value}</span>
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.5), inset 0 5px 10px rgba(255,255,255,0.4)',
      }} />
    </div>
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

function HomeScreen({ onTapInput, onOpenProjects, onOpenProfile, onOpenRecipe, onLongPressRecipe, scrollRef, onScroll, activeChip, setActiveChip, accent }) {
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
              <HeaderCreditsPill value={333} />
              <HeaderProfileButton onClick={onOpenProfile} />
            </div>
          </div>
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
        paddingTop: 161, paddingBottom: 140,
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
              : kind === 'announce' ? <Icon.Megaphone size={13} color="#fff" />
              : kind === 'new'      ? <Icon.Beaker size={13} color="#fff" />
              : null;
  return (
    <div style={{
      position: 'absolute', right: -4, bottom: -4,
      width: 26, height: 26, borderRadius: 999,
      background: `linear-gradient(160deg, ${accent} 0%, ${accent}cc 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 10px ${accent}55, 0 0 0 2px #fff`,
    }}>
      {glyph}
    </div>
  );
}

function NotificationScreen({ scrollRef, onScroll, onOpenRecipe, onOpenShareView, onBack, accent }) {
  // Build a recipe-shaped object for a "Try it now" notification.
  // We prefer an existing recipe sharing the same theme (so the detail
  // page gets real imagery + description), and fall back to a synthetic
  // object derived from the notification copy when no match exists.
  const recipeForNotif = React.useCallback((n) => {
    const recipes = window.RECIPES || [];
    const match = recipes.find((r) => r.theme === n.theme);
    // 'ready' = the user's own finished creation. Use the source recipe
    // unchanged so the chat / share-view show the real recipe title and
    // prompt instead of the notification announcement copy ("Your creation
    // is ready!", "ASMR Jelly Brainrot has been generated successfully.").
    if (n.kind === 'ready' && match) {
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
  //   • otherwise (new / announce) → "Try it now" → the recipe detail
  //                          page so the user can fill the form & generate.
  const handleNotifTap = React.useCallback((n) => {
    const recipe = recipeForNotif(n);
    if (n.kind === 'ready' && onOpenShareView) {
      onOpenShareView(recipe);
    } else if (onOpenRecipe) {
      onOpenRecipe(recipe);
    }
  }, [onOpenRecipe, onOpenShareView, recipeForNotif]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Glass back button — top-left, floats above the sticky header.
          Renders only when `onBack` is provided so this screen still
          works as a plain tab if needed. */}
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
          {window.NOTIFICATIONS.map((n) => {
            const theme = window.CARD_THEMES[n.theme] || window.CARD_THEMES.jelly;
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
                position: 'relative', display: 'flex', gap: 14, padding: 12,
                background: '#fff', borderRadius: 18,
                boxShadow: '0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 8px rgba(60,40,140,0.05), 0 1px 2px rgba(60,40,140,0.04)',
                cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none',
              }}>
                {/* Thumbnail with badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 76, height: 76, borderRadius: 14, overflow: 'hidden',
                    background: theme.bg, position: 'relative',
                  }}>
                    {/* Subtle stripe overlay so empty thumbnails feel like art, not blank gradients */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)',
                    }} />
                  </div>
                  <NotifBadge kind={n.kind} accent={accent} />
                </div>

                {/* Content */}
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
                      onClick={(e) => { e.stopPropagation(); handleNotifTap(n); }}
                      style={{
                        padding: 0, border: 'none', background: 'transparent',
                        fontSize: 13.5, fontWeight: 600, color: accent,
                        display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
                      }}
                    >
                      {n.cta}
                      <span style={{ fontWeight: 500 }}>→</span>
                    </button>
                    {n.unread && (
                      <div style={{
                        width: 7, height: 7, borderRadius: 999, background: accent, flexShrink: 0,
                      }} />
                    )}
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
function ProjectsScreen({ scrollRef, onScroll, onOpenProject, onBack, accent }) {
  const projects = window.PROJECTS || [];
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Glass back button — top-left, floats above the sticky header.
          Renders only when `onBack` is provided so the screen still
          works as a plain tab if needed. */}
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
          <h1 className="h-recipe" style={{ margin: 0 }}>Projects</h1>
          <div style={{ fontSize: 13.5, color: '#5C5C66', marginTop: 6, fontWeight: 400, lineHeight: 1.35 }}>
            Pick up where you left off.
          </div>
        </div>
      </div>

      {/* Scroll body */}
      <div ref={scrollRef} onScroll={onScroll} className="phone-scroll screen-fade" style={{
        position: 'absolute', inset: 0, overflow: 'auto',
        paddingTop: 124, paddingBottom: onBack ? 48 : 140,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 16px 0' }}>
          {projects.map((p) => {
            const theme = window.CARD_THEMES[p.theme] || window.CARD_THEMES.jelly;
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpenProject && onOpenProject(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenProject && onOpenProject(p);
                  }
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
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 12px)',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 15.5, fontWeight: 600, color: '#0A0A0A', letterSpacing: -0.1,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{p.title}</div>
                  <div style={{
                    fontSize: 12.5, color: '#9BA0AB', marginTop: 4, fontWeight: 500,
                  }}>{p.when}</div>
                </div>
                <Icon.Chevron size={16} color="#9BA0AB" />
              </div>
            );
          })}
          <div style={{ textAlign: 'center', padding: '20px 0 4px', color: '#9BA0AB', fontSize: 13 }}>
            That's everything you've made.
          </div>
        </div>
      </div>
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

// ── Detail screen (unified, draggable sheet) ───────────────────
// Implements Figma flow `recipe` (default) → `OnboardingDialog/L`
// pushed-up → fully expanded with completed form. The video frame
// continuously transforms from a full-bleed banner (preview) into a
// small portrait card (205×365) centered behind the sheet (expanded),
// matching the Pinterest/Instagram-style draggable detail pattern
// annotated in the source designs.
//
// Sheet snap stops:
//   • PREVIEW  — sheet top sits just below the video, description +
//     start of Upload visible. CTA: "Try this recipe" (enabled, taps
//     expand the sheet).
//   • EXPANDED — sheet top sits just below the iOS status bar, video
//     becomes a thumb card behind the sheet. CTA flips:
//       form empty → "Try this recipe" (disabled)
//       form ready → "Let's cook it" (enabled)
//
// Drag is attached to the video frame *and* the drag handle. Anything
// inside the sheet that should accept taps (buttons, textarea) wears
// `data-no-drag` so a drag never steals their interaction.
function RecipeDetailScreen({ recipe, onBack, onOpenShareView }) {
  const theme = window.CARD_THEMES[recipe.theme] || window.CARD_THEMES.jelly;
  const [imageFailed, setImageFailed] = React.useState(false);
  const hasImage = recipe.image && !imageFailed;

  // ── Layout constants (Figma frame: 393×852) ────────────────────
  const PHONE_W = 393;
  const STATUS_H = 62;     // iOS status bar height in this prototype
  const ACTIONS_H = 96;    // sticky bottom bar height incl. safe area

  // Video stops: full-bleed at preview → 205×365 centered card at
  // expanded (matches Figma `RecipeCover` position top:70).
  const V0_W = 393, V0_H = 508, V0_LEFT = 0, V0_TOP = 0;
  const V1_W = 205, V1_H = 365, V1_TOP = 70;
  const V1_LEFT = (PHONE_W - V1_W) / 2;

  // Sheet top stops. Preview = right under the video. Expanded =
  // right under the status bar (sheet covers the cover card).
  const SHEET_TOP_MAX = V0_H;       // 508 — preview
  const SHEET_TOP_MIN = STATUS_H;   // 62  — expanded

  // ── State ─────────────────────────────────────────────────────
  const [sheetTop, setSheetTop] = React.useState(SHEET_TOP_MAX);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef(null);

  // Cook-form state — the upload/describe form lives directly inside
  // the detail sheet (Figma 20635:14259), so we just need to track the
  // two field values here. Persisted across recipe re-opens by the
  // effect below.
  const [shareOpen, setShareOpen] = React.useState(false);
  // Conversation page — the primary destination after "Try this recipe"
  // is tapped with a filled form. Renders ConversationScreen full-screen.
  const [chatOpen, setChatOpen] = React.useState(false);
  const [text, setText] = React.useState('');
  const [uploaded, setUploaded] = React.useState(false);
  // Video play/pause — tapping the video toggles. Defaults to playing
  // so the preview reads as live; pausing surfaces a center play icon
  // overlay so the user has a clear affordance to resume.
  const [isPlaying, setIsPlaying] = React.useState(true);

  // Toast — shown when the user taps "Try this recipe" without finishing
  // the upload/describe form. Auto-dismisses after ~2.4s. Stored as
  // { id, message } so consecutive triggers re-fire the show animation.
  const [toast, setToast] = React.useState(null);
  React.useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(id);
  }, [toast]);

  // Reset to preview every time a new recipe is opened.
  React.useEffect(() => {
    setSheetTop(SHEET_TOP_MAX);
    setShareOpen(false);
    setChatOpen(false);
    setText('');
    setUploaded(false);
    setToast(null);
  }, [recipe && recipe.id]);

  // 0 = preview, 1 = fully expanded. Drives every interpolated style.
  const progress = Math.max(0, Math.min(1,
    (SHEET_TOP_MAX - sheetTop) / (SHEET_TOP_MAX - SHEET_TOP_MIN)));
  const isExpanded = progress > 0.5;

  // Linear interpolation helper (a → b based on progress).
  const lerp = (a, b) => a + (b - a) * progress;

  // Interpolated video frame metrics — read once per render.
  const videoTop = lerp(V0_TOP, V1_TOP);
  const videoLeft = lerp(V0_LEFT, V1_LEFT);
  const videoW = lerp(V0_W, V1_W);
  const videoH = lerp(V0_H, V1_H);
  const videoRadius = lerp(0, 16);
  const sheetRadius = lerp(0, 24);

  // ── Drag ──────────────────────────────────────────────────────
  const beginDrag = (clientY) => {
    dragRef.current = { startY: clientY, startTop: sheetTop, maxDy: 0 };
    setDragging(true);
  };
  const moveDrag = (clientY) => {
    if (!dragRef.current) return;
    const dy = clientY - dragRef.current.startY;
    // Track the largest absolute movement so we can distinguish a
    // tap from a tiny drag on pointer up.
    dragRef.current.maxDy = Math.max(dragRef.current.maxDy, Math.abs(dy));
    const next = Math.max(SHEET_TOP_MIN,
      Math.min(SHEET_TOP_MAX, dragRef.current.startTop + dy));
    setSheetTop(next);
  };
  // Threshold under which a release counts as a tap rather than a drag.
  const TAP_SLOP = 6;
  const endDrag = (onTap) => {
    if (!dragRef.current) return false;
    const wasTap = dragRef.current.maxDy < TAP_SLOP;
    if (!wasTap) {
      // Real drag — snap to the nearest stop.
      setSheetTop((t) => {
        const mid = (SHEET_TOP_MIN + SHEET_TOP_MAX) / 2;
        return t < mid ? SHEET_TOP_MIN : SHEET_TOP_MAX;
      });
    }
    dragRef.current = null;
    setDragging(false);
    if (wasTap && typeof onTap === 'function') onTap();
    return wasTap;
  };

  // Factory for the unified pointer (mouse + touch) handlers. Reused
  // on the video frame and the drag handle row. Skips drag when the
  // event originates from a `[data-no-drag]` element. The optional
  // `onTap` fires when the user releases without significant movement
  // — used on the video frame to dismiss the detail page with a tap.
  const makePointerHandlers = (onTap) => ({
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
      endDrag(onTap);
    },
    onPointerCancel: (e) => {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
      endDrag();
    },
  });

  // Video tap toggles play/pause (NOT close — use the back button at
  // top-left for that). Only fires while we're still in the preview
  // state; once the sheet has been pulled up, taps fall through to
  // drag-end so the user can keep manipulating the sheet.
  const pointerHandlers = makePointerHandlers();
  const videoPointerHandlers = makePointerHandlers(
    progress < 0.05 ? () => setIsPlaying((p) => !p) : null
  );

  // Snap easing — only kicks in on release, instant follow during drag.
  const snapTransition = dragging
    ? 'none'
    : [
        'top 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        'left 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        'width 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        'height 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        'border-radius 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        'box-shadow 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        'opacity 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
      ].join(', ');

  // ── CTA ───────────────────────────────────────────────────────
  // The cook form lives directly inside the detail sheet's scroll body
  // (per Figma 20635:14259). CTA always reads "Try this recipe" and is
  // always visually enabled so the recipe feels inviting on entry. If
  // the user taps without completing the required fields, a toast
  // surfaces the missing piece instead of silently doing nothing.
  const ready = uploaded && text.trim().length > 0;
  const ctaLabel = 'Try this recipe';
  const ctaEnabled = true;
  const onCta = () => {
    if (!ready) {
      // Tell the user exactly which field is missing so the toast
      // doubles as a hint, not just a complaint.
      let msg;
      if (!uploaded && !text.trim()) {
        msg = 'Add an image and describe your idea to start cooking.';
      } else if (!uploaded) {
        msg = 'Add an image to start cooking.';
      } else {
        msg = 'Describe your idea to start cooking.';
      }
      setToast({ id: Date.now(), message: msg });
      return;
    }
    // Push the job to the global generation queue so the "+" FAB shows
    // progress. `window.__enqueueGeneration` is exposed by App.jsx;
    // guarded so this remains a no-op if missing.
    if (typeof window.__enqueueGeneration === 'function') {
      window.__enqueueGeneration(recipe);
    }
    setChatOpen(true);
  };

  return (
    <div className="screen-fade" style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: '#F4F4F5',
      overflow: 'hidden',
      touchAction: 'none',
    }}>
      {/* Blurred backdrop — fades in as the sheet rises, picks up the
          recipe's tint behind the floating card (Figma `BG` blob). */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 252,
        background: 'radial-gradient(120% 100% at 30% 30%, rgba(220, 200, 255, 0.55) 0%, rgba(255, 220, 235, 0.40) 35%, rgba(244, 244, 245, 0) 75%)',
        filter: 'blur(40px)',
        opacity: progress,
        pointerEvents: 'none',
        transition: dragging ? 'none' : 'opacity 0.34s ease',
      }} />

      {/* Video frame — full-bleed at preview, transforms into a
          centered portrait card behind the sheet at expanded.
          Tap (release without drag) closes the detail page in
          preview mode; otherwise drag-to-expand the sheet. */}
      <div
        {...videoPointerHandlers}
        style={{
          position: 'absolute',
          top: videoTop, left: videoLeft,
          width: videoW, height: videoH,
          background: hasImage ? '#000' : theme.bg,
          borderRadius: videoRadius,
          overflow: 'hidden',
          touchAction: 'none',
          cursor: progress < 0.05 ? 'pointer' : (dragging ? 'grabbing' : 'grab'),
          transition: snapTransition,
          boxShadow: progress > 0.05
            ? `0 ${lerp(0, 24)}px ${lerp(0, 60)}px rgba(60, 40, 140, ${(0.18 * progress).toFixed(3)})`
            : 'none',
        }}
      >
        {hasImage ? (
          <img
            src={recipe.image}
            alt={recipe.title}
            onError={() => setImageFailed(true)}
            draggable={false}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              display: 'block', pointerEvents: 'none',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: 12, color: 'rgba(0,0,0,0.4)',
            textAlign: 'center', padding: 16,
            pointerEvents: 'none',
          }}>
            {theme.label}
          </div>
        )}

        {/* Edge gradients (top + bottom) — only useful at preview when
            the video fills the screen edge to edge. Fade out as it
            shrinks into a card so they don't add weight to the thumb. */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, top: 0, height: 110,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
          opacity: 1 - progress,
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 90,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)',
          pointerEvents: 'none',
          opacity: Math.max(0, 1 - progress * 2),
        }} />

        {/* Video controls — fade out twice as fast as gradients so they
            disappear before the frame gets small enough to crowd them. */}
        <div style={{
          opacity: Math.max(0, 1 - progress * 2),
          pointerEvents: progress > 0.4 ? 'none' : 'auto',
        }}>
          <VideoControlsOverlay />
        </div>

        {/* Play / pause overlay — visible when paused at the preview
            stage. Tap-through (pointerEvents: none) so the gesture is
            handled by the video frame, not this badge. */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          opacity: !isPlaying && progress < 0.4 ? 1 : 0,
          transition: 'opacity 0.18s ease',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 999,
            background: 'rgba(0, 0, 0, 0.42)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.30), inset 0 1px 1px rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF',
            paddingLeft: 4, // optical nudge so the play triangle reads centered
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Back button — Figma IconButton (50×50, glass, inset highlight).
          Icon color flips white→dark as the sheet rises past it. */}
      <button
        onClick={onBack}
        aria-label="Back"
        data-no-drag
        style={{
          position: 'absolute', top: 78, left: 20, zIndex: 10,
          width: 50, height: 50, borderRadius: 999,
          border: 'none',
          background: 'rgba(244, 244, 245, 0.16)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2), inset 0 5px 10px rgba(255,255,255,0.15)',
          color: progress > 0.5 ? '#1A1A22' : '#FFFFFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
          transition: 'color 0.24s ease',
        }}
      >
        <Icon.Back size={18} stroke={2.2} />
      </button>

      {/* Bottom sheet — FLAT in preview, lifts into a 24px-rounded
          sheet as `progress` rises. Background matches Figma
          `surface-bright` (#FAFAFA). */}
      <div style={{
        position: 'absolute',
        top: sheetTop, left: 0, right: 0, bottom: 0,
        background: '#FAFAFA',
        borderTopLeftRadius: sheetRadius,
        borderTopRightRadius: sheetRadius,
        boxShadow: progress > 0.02
          ? `0 -4px 32px rgba(0, 0, 0, ${(0.04 * progress).toFixed(3)}), 0 -10px 32px rgba(0, 0, 0, ${(0.01 * progress).toFixed(3)})`
          : 'none',
        overflow: 'hidden',
        transition: snapTransition,
      }}>
        {/* Drag handle row — 48×4 pill per Figma `dragIndicator`.
            Fades in with progress so the flat preview stays clean. */}
        <div
          {...pointerHandlers}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: 28, paddingTop: 12,
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          <div style={{
            width: 48, height: 4, borderRadius: 7,
            background: 'rgba(9, 9, 11, 0.16)',
            opacity: Math.min(1, progress * 3),
            transition: dragging ? 'none' : 'opacity 0.2s ease',
          }} />
        </div>

        {/* Scrollable content — padding-bottom clears the glass action
            bar so the last input is never permanently obscured. */}
        <div className="phone-scroll" data-no-drag style={{
          height: 'calc(100% - 28px)', overflow: 'auto',
          padding: `12px 0 ${ACTIONS_H + 24}px`,
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Title row — a small recipe thumbnail slides in next to
              the title as the sheet rises (Figma node 20635:14707).
              In the flat/preview state the thumb is collapsed to zero
              width, so the title + tag read as a vertical stack just
              like the default detail (Figma 20635:14501). */}
          <div style={{ padding: '0 24px' }}>
            <div style={{
              display: 'flex',
              gap: lerp(0, 16),
              alignItems: 'center',
              transition: snapTransition,
            }}>
              <div style={{
                width: lerp(0, 37),
                height: 66,
                borderRadius: 8,
                overflow: 'hidden',
                flexShrink: 0,
                background: hasImage ? '#000' : theme.bg,
                opacity: progress,
                transition: snapTransition,
              }}>
                {hasImage ? (
                  <img
                    src={recipe.image}
                    alt=""
                    draggable={false}
                    onError={() => setImageFailed(true)}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', display: 'block',
                      pointerEvents: 'none',
                    }}
                  />
                ) : null}
              </div>
              <div style={{
                flex: 1, minWidth: 0,
                display: 'flex', flexDirection: 'column',
                gap: lerp(8, 4),
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}>
                <h2 style={{
                  margin: 0,
                  fontFamily: '"Manrope", system-ui, sans-serif',
                  fontSize: 22, lineHeight: '28px', fontWeight: 600,
                  color: '#09090B',
                  fontFeatureSettings: '"zero" 1',
                }}>{recipe.title}</h2>
                <div><AdvertisePill /></div>
              </div>
            </div>
          </div>

          {/* Description with optional inline file chip. */}
          <div style={{ marginTop: 12, padding: '0 24px' }}>
            <p style={{
              margin: 0,
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 14, lineHeight: '20px', fontWeight: 500,
              color: '#3F3F46',
              letterSpacing: 0.2,
              fontFeatureSettings: '"zero" 1',
            }}>
              {renderDescriptionWithFile(
                recipe.previewDescription || recipe.description || '',
                recipe.previewFile
              )}
            </p>
          </div>

          {/* Upload image — 120×120 square dashed dropzone per Figma
              node 20635:14339. Tapping toggles the prototype upload
              state so the CTA can flip to its ready style. */}
          <div style={{
            marginTop: 24, padding: '0 24px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 16, lineHeight: '24px', fontWeight: 600,
              color: '#3F3F46', letterSpacing: 0.15,
              fontFeatureSettings: '"zero" 1',
            }}>Upload image</div>
            <button
              onClick={() => setUploaded((v) => !v)}
              data-no-drag
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
                transition: 'background 0.18s ease, border 0.18s ease, color 0.18s ease',
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
          </div>

          {/* Describe section — Figma M3 Field (8px radius), 136 tall. */}
          <div style={{
            marginTop: 16, padding: '0 24px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 16, lineHeight: '24px', fontWeight: 600,
              color: '#3F3F46', letterSpacing: 0.15,
              fontFeatureSettings: '"zero" 1',
            }}>Describe your idea to remix it</div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Input text"
              rows={6}
              data-no-drag
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
      </div>

      {/* Toast — floats just above the action bar. Renders only when a
          message is set; keyed by `toast.id` so consecutive triggers
          replay the entrance animation even if the copy is identical. */}
      {toast && (
        <div
          key={toast.id}
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute', left: 16, right: 16,
            bottom: ACTIONS_H + 8,
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
          {/* Info dot — purple accent to read as a friendly hint not an
              error. Keeps the toast visually consistent with the app's
              creative tone. */}
          <span aria-hidden="true" style={{
            width: 18, height: 18, borderRadius: 999,
            background: 'rgba(157, 121, 255, 0.20)',
            color: '#C6ABFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>!</span>
          <span style={{ flex: 1, minWidth: 0 }}>{toast.message}</span>
        </div>
      )}

      {/* Sticky action bar — Figma buttonBar (gradient + 10px blur).
          The hairline above fades in with `progress` so flat preview
          stays seamless. */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(180deg, rgba(254, 247, 255, 0) 0%, rgba(254, 247, 255, 0.08) 100%)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '8px 24px 36px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        zIndex: 6,
        boxShadow: `inset 0 0.5px 0 rgba(255, 255, 255, 0.6), 0 -0.5px 0 rgba(0, 0, 0, ${(0.04 * progress).toFixed(3)})`,
        transition: dragging ? 'none' : 'box-shadow 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>
        <PrimaryCTA
          label={ctaLabel}
          enabled={ctaEnabled}
          onClick={onCta}
        />
        {/* Share — Wabi-style liquid glass to match the bottom nav's
            FAB language. Opens the Medeo TV share page. */}
        <button
          onClick={() => setShareOpen(true)}
          aria-label="Share" data-no-drag
          className="glass-wabi"
          style={{
            width: 50, height: 50, borderRadius: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0, flexShrink: 0,
          }}>
          <Icon.Share size={18} color="#1A1A22" />
        </button>
      </div>

      {/* Medeo TV share page — opens above everything when the share
          IconButton in the action bar is tapped. */}
      {shareOpen && (
        <SharePage
          recipe={recipe}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Conversation page — opens when the user submits the cook
          form via the "Try this recipe" CTA. */}
      {chatOpen && (
        <ConversationScreen
          recipe={recipe}
          userText={text}
          userFile={uploaded ? (recipe.previewFile || null) : null}
          onClose={() => setChatOpen(false)}
          onOpenShareView={onOpenShareView}
        />
      )}
    </div>
  );
}

// ── Cook sheet (Pinterest-style modal) ────────────────────────────
// Triggered by the detail page's "Try this recipe" CTA. Behaves like
// Pinterest's visual-search panel: opens at a small height showing
// the upload form on top of the template image, can be dragged up to
// a full height where a thumbnail of the template appears in the
// sheet header. Drag down past the small stop to dismiss.
//
// State (text + uploaded) lives in the parent so the form persists
// across open/close cycles.
function CookSheet({ recipe, text, uploaded, onTextChange, onToggleUpload, onClose }) {
  const PHONE_H = 852;
  const STATUS_H = 62;
  const ACTIONS_H = 96;

  // Snap stops (sheet TOP in px from the phone frame's top edge):
  //   SMALL → sheet sits in the bottom ~45% of the phone, template
  //           still fully visible behind (matches Pinterest image 1).
  //   FULL  → sheet covers everything below the iOS status bar,
  //           template now shown as a small thumb in the header.
  const SMALL_TOP = 480;
  const FULL_TOP = STATUS_H;
  const DISMISS_TOP = PHONE_H - 60; // drag below this releases close

  const ready = uploaded && text.trim().length > 0;

  // Start off-screen, then animate to SMALL on mount so the entry
  // reads as a slide-up. requestAnimationFrame avoids the React
  // batching that would skip the start frame.
  const [sheetTop, setSheetTop] = React.useState(PHONE_H);
  const [dragging, setDragging] = React.useState(false);
  const dragRef = React.useRef(null);
  const closingRef = React.useRef(false);

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setSheetTop(SMALL_TOP));
    return () => window.cancelAnimationFrame(id);
  }, []);

  // 0 = small, 1 = full. Drives the template-thumb header reveal and
  // the backdrop dim.
  const progress = Math.max(0, Math.min(1,
    (SMALL_TOP - sheetTop) / (SMALL_TOP - FULL_TOP)));

  const requestClose = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    setSheetTop(PHONE_H);
    window.setTimeout(onClose, 280);
  };

  // ── Drag ──────────────────────────────────────────────────────
  const beginDrag = (clientY) => {
    dragRef.current = { startY: clientY, startTop: sheetTop };
    setDragging(true);
  };
  const moveDrag = (clientY) => {
    if (!dragRef.current) return;
    const dy = clientY - dragRef.current.startY;
    // Allow dragging below SMALL_TOP for the dismiss gesture.
    const next = Math.max(FULL_TOP,
      Math.min(PHONE_H, dragRef.current.startTop + dy));
    setSheetTop(next);
  };
  const endDrag = () => {
    if (!dragRef.current) return;
    setSheetTop((t) => {
      if (t > DISMISS_TOP) {
        // Past the dismiss threshold — animate out and close.
        window.setTimeout(requestClose, 0);
        return t;
      }
      const mid = (SMALL_TOP + FULL_TOP) / 2;
      return t < mid ? FULL_TOP : SMALL_TOP;
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

  const snapTransition = dragging
    ? 'none'
    : 'top 0.34s cubic-bezier(0.32, 0.72, 0, 1)';

  const onSubmit = () => {
    if (!ready) return;
    // In the real app this would fire the generation request.
    // For the prototype, just close the sheet and reset progress.
    requestClose();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90,
      pointerEvents: 'none', // children re-enable pointer-events
    }}>
      {/* Backdrop dim — only fades in once the sheet is past the
          small stop so the template stays fully visible in the
          Pinterest-style "peek" state. */}
      <div
        onClick={requestClose}
        style={{
          position: 'absolute', inset: 0,
          background: '#000',
          opacity: 0.32 * progress,
          pointerEvents: progress > 0.05 ? 'auto' : 'none',
          transition: dragging ? 'none' : 'opacity 0.24s ease',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'absolute',
        top: sheetTop, left: 0, right: 0, bottom: 0,
        background: '#FFFFFF',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.06), 0 -16px 48px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
        transition: snapTransition,
        pointerEvents: 'auto',
      }}>
        {/* Drag handle row */}
        <div
          {...pointerHandlers}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            height: 28, paddingTop: 12,
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction: 'none',
          }}
        >
          <div style={{
            width: 48, height: 4, borderRadius: 7,
            background: 'rgba(9, 9, 11, 0.16)',
          }} />
        </div>

        {/* Template header — slides down + fades in as the sheet
            expands. At small height the user can already see the full
            template behind, so the header is collapsed away. */}
        <div style={{
          maxHeight: progress > 0.05 ? 88 : 0,
          opacity: progress,
          overflow: 'hidden',
          transition: dragging
            ? 'none'
            : 'max-height 0.34s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.24s ease',
        }}>
          <div data-no-drag style={{
            padding: '4px 20px 12px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 12,
              overflow: 'hidden', background: '#000',
              flexShrink: 0,
            }}>
              {recipe.image ? (
                <img src={recipe.image} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                }} />
              ) : null}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 11, fontWeight: 500, color: '#71717A',
                letterSpacing: 0.3, lineHeight: '16px',
                textTransform: 'uppercase',
                fontFeatureSettings: '"zero" 1',
              }}>Recipe template</div>
              <div style={{
                fontFamily: '"Manrope", system-ui, sans-serif',
                fontSize: 16, fontWeight: 600, color: '#09090B',
                lineHeight: '22px',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                fontFeatureSettings: '"zero" 1',
              }}>{recipe.title}</div>
            </div>
            <button
              onClick={requestClose}
              aria-label="Close"
              style={{
                width: 32, height: 32, borderRadius: 999,
                border: 'none',
                background: 'rgba(9, 9, 11, 0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0, flexShrink: 0,
                color: '#1A1A22',
              }}
            >
              <Icon.Close size={14} stroke={2.4} />
            </button>
          </div>
          <div style={{
            height: 0.5,
            background: 'rgba(9, 9, 11, 0.06)',
            margin: '0 20px',
          }} />
        </div>

        {/* Scrollable form content */}
        <div className="phone-scroll" data-no-drag style={{
          height: 'calc(100% - 28px)',
          overflow: 'auto',
          padding: `16px 0 ${ACTIONS_H + 24}px`,
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Upload section — 194px dashed dropzone per Figma */}
          <div style={{
            padding: '0 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 16, lineHeight: '24px', fontWeight: 600,
              color: '#3F3F46', letterSpacing: 0.15,
              fontFeatureSettings: '"zero" 1',
            }}>Upload your image</div>
            <button
              onClick={onToggleUpload}
              style={{
                width: '100%', height: 194,
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
              }}>{uploaded ? 'Image attached · tap to remove' : 'Upload image'}</div>
            </button>
          </div>

          {/* Describe section — Figma M3 Field (8px radius) */}
          <div style={{
            marginTop: 16, padding: '0 20px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              fontFamily: '"Manrope", system-ui, sans-serif',
              fontSize: 16, lineHeight: '24px', fontWeight: 600,
              color: '#3F3F46', letterSpacing: 0.15,
              fontFeatureSettings: '"zero" 1',
            }}>Describe your idea to remix it</div>
            <textarea
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Input text"
              rows={6}
              style={{
                width: '100%', height: 194,
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

        {/* Sticky action bar — primary CTA fires generation */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.85) 30%, rgba(255, 255, 255, 0.92) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          padding: '8px 24px 36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
          boxShadow: 'inset 0 0.5px 0 rgba(255, 255, 255, 0.6)',
        }}>
          <PrimaryCTA
            label="Let's cook it"
            enabled={ready}
            onClick={onSubmit}
          />
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
  const SHARE_TARGETS = [
    { id: 'tiktok', label: 'TikTok',    icon: ShareGlyph.TikTok },
    { id: 'story',  label: 'Story',     icon: ShareGlyph.Story },
    { id: 'yt',     label: 'YouTube',   icon: ShareGlyph.YouTube },
    { id: 'x',      label: 'X',         icon: ShareGlyph.X },
    { id: 'copy',   label: 'Copy Link', icon: ShareGlyph.CopyLink },
    { id: 'dl',     label: 'Download',  icon: ShareGlyph.Download },
  ];

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
        padding: '0 20px 0 20px',
      }}>
        <div className="phone-scroll" style={{
          display: 'flex', gap: 18,
          overflowX: 'auto', overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 4,
        }}>
          {SHARE_TARGETS.map((t) => (
            <ShareTarget key={t.id} label={t.label} icon={t.icon} onClick={() => {}} />
          ))}
        </div>
      </div>
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
//     three actions: a large "Use this recipe" lavender pill that fills
//     the row, plus circular glass download + share icon buttons.
//
// Intentionally separate from SharePage (the "where do I share to" picker)
// because they sit at different points in the share flow: ShareViewScreen
// is for consumers viewing a creation, SharePage is for the creator
// distributing it.
function ShareViewScreen({ recipe, onClose, onUseRecipe, accent = '#7C5BFD' }) {
  const r = recipe || {};
  const theme = (window.CARD_THEMES && window.CARD_THEMES[r.theme]) || {};
  const bgColor = theme.bg || '#1A1A22';
  const title = r.title || 'Recipe title';
  // Mock playhead — 0:01 out of a 0:16 clip, ~6% played. Matches Figma.
  const PROGRESS = 0.06;

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
  // half the screen. The user can drag it higher to FULL, drag down to
  // dismiss, or tap the visible video area above the sheet. As the sheet
  // rises the video container shrinks proportionally (Instagram pattern).
  const PHONE_H = 852;
  const SHEET_HALF = 470;          // default opened height (~55%)
  const SHEET_FULL = 720;          // pulled-all-the-way-up height
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
    const next = Math.max(0, Math.min(SHEET_FULL + 40, dragRef.current.startH + dy));
    setSheetH(next);
  };
  const onHandleUp = (e) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
    if (sheetH < SHEET_DISMISS) closeSheet();
    else if (sheetH < (SHEET_HALF + SHEET_FULL) / 2) setSheetH(SHEET_HALF);
    else setSheetH(SHEET_FULL);
  };

  // 0 → fully closed, 1 → at SHEET_HALF, > 1 → between half and full.
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
            }}
          />
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

        {/* Scrubber row — 0:01 ──●──────── 0:16  [mute] */}
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

        {/* Action row — primary CTA fills, two circular actions trail */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 8, padding: '12px 12px 40px',
        }}>
          <button
            onClick={() => {
              // "Use this recipe" → go to the work's recipe detail page so
              // the user can review the description, swap inputs and remix.
              // The parent decides where that lives; we just call it.
              if (onUseRecipe) {
                onUseRecipe(recipe);
                return;
              }
              // Fallback for demo entry points that don't supply a handler:
              // enqueue + dismiss so the action still has feedback.
              if (typeof window.__enqueueGeneration === 'function') {
                window.__enqueueGeneration(recipe);
              }
              onClose && onClose();
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
            <span>Use this recipe</span>
          </button>
          <button aria-label="Download" style={glassIconBtn}>
            <Icon.Download size={18} color="#FFFFFF" />
          </button>
          <button aria-label="Share" style={glassIconBtn}>
            <Icon.Share size={18} color="#FFFFFF" stroke={1.8} />
          </button>
        </div>
      </div>

      {/* Xiaohongshu-style description sheet ───────────────────────────
          Slides up from below, default snap at SHEET_HALF, draggable to
          SHEET_FULL or down to dismiss. Solid dark surface (no frosted
          glass) — opaque so the video clearly reads as the "shrunk"
          element above. Content: drag handle, title, short caption,
          expanded prompt body. NO author/follow row per the spec —
          this is a creation viewer, not a social profile. */}
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
window.RecipeCard = RecipeCard;
