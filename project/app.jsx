// app.jsx — main wiring
const { useState, useRef, useEffect, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "navVariant": "wabi",
  "theme": "light",
  "accent": "#863dfb",
  "showOnlyOne": false
}/*EDITMODE-END*/;

const NAV_VARIANTS = {
  dock:     { name: 'iOS 26 Dock',        Comp: window.NavDock },
  wabi:     { name: 'Wabi Trio',          Comp: window.NavWabi },
  composer: { name: 'Inline Composer',    Comp: window.NavComposer },
  split:    { name: 'Split Pill',         Comp: window.NavSplit },
};

const ACCENTS = ['#863dfb', '#FF4F8B', '#22C58A', '#FF9F0A'];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [tab, setTab] = useState('home');
  const [composerOpen, setComposerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [activeChip, setActiveChip] = useState('All');
  const [collapsed, setCollapsed] = useState(false);
  // Recipe detail page — when set, renders RecipeDetailScreen above the
  // current tab and hides the bottom nav. Cleared by the back button.
  // `detailAutoOpen` mirrors the "auto-open the config sheet on mount"
  // intent (used when a user taps a failed-generation notification to
  // retry — we drop them straight onto the form pre-context).
  const [detailRecipe, setDetailRecipe] = useState(null);
  const [detailAutoOpen, setDetailAutoOpen] = useState(false);
  const openDetail = useCallback((recipe, opts) => {
    setDetailAutoOpen(!!(opts && opts.autoOpenConfig));
    setDetailRecipe(recipe);
  }, []);
  // Expose globally so the detail page's masonry can re-open into a
  // different recipe without prop-drilling through Recipe components.
  useEffect(() => {
    window.__openRecipeDetail = (r) => openDetail(r);
    return () => { if (window.__openRecipeDetail) delete window.__openRecipeDetail; };
  }, [openDetail]);
  // Project chat — when set, opens ConversationScreen for the selected
  // project (Projects tab → tap an item).
  const [chatProject, setChatProject] = useState(null);
  // Shared-recipe viewer (Figma node 20669:12391). Opened when the user
  // long-presses a card or follows a share link — for the prototype it's
  // exposed via a Tweaks button and a long-press on a homepage card.
  const [shareViewRecipe, setShareViewRecipe] = useState(null);
  // Medeo TV share page — reusable share destination opened from recipe
  // detail, share/result page, and invite reward notifications.
  const [sharePageRecipe, setSharePageRecipe] = useState(null);

  // Generation queue — items the user has sent to render. Each item is
  // { id, title, theme, image?, progress (0..1), eta }. The queue is
  // surfaced as a small badge above the "+" FAB; tapping it opens a
  // floating panel listing the in-flight jobs.
  // Seeded with two demo items so the indicator is visible on first
  // load — wire to real generation triggers as they get added.
  const [queue, setQueue] = useState([
    { id: 'q-seed-1', title: 'Retro Profile Printer', theme: 'retro', image: 'uploads/retro.png', progress: 0.62 },
    { id: 'q-seed-2', title: 'Space Cat Adventure',   theme: 'cat',   image: undefined,           progress: 0.18 },
  ]);
  const [queueOpen, setQueueOpen] = useState(false);

  // Completed creations — populated as queue items finish. Rendered at
  // the top of the Projects tab and clickable to play in ShareView.
  const [completedCreations, setCompletedCreations] = useState([]);

  // Credits balance — the source of truth for the Home header pill.
  // Starts at the prototype baseline; bumps when an invite-reward event
  // fires (see `onInviteReward`). Real product would sync from server.
  const [credits, setCredits] = useState(333);
  const [creditsReward, setCreditsReward] = useState(null);

  // Toast — single in-app banner near the top of the phone. Slides in
  // from the top, auto-dismisses after ~3.2s per spec (2.5–4s range).
  // `kind` drives the icon, accent and action label:
  //   'queued' — status only, no CTA
  //   'ready'  — [View] → Share View
  //   'failed' — [Retry] → re-enqueue (action button) / tap card → Detail
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(id);
  }, [toast]);
  const showToast = useCallback((t) => {
    if (!t) return setToast(null);
    setToast({ id: Date.now(), ...t });
  }, []);
  useEffect(() => {
    window.__toast = showToast;
    return () => { if (window.__toast === showToast) delete window.__toast; };
  }, [showToast]);

  // Handle a queue item finishing — add to completed list and fire the
  // global "ready" toast that taps directly through to ShareView.
  const onCreationComplete = useCallback((item) => {
    const recipe = (window.RECIPES || []).find((r) => r.theme === item.theme) || {
      id: item.id, title: item.title, theme: item.theme, image: item.image,
    };
    setCompletedCreations((c) => [{
      id: 'c-' + item.id,
      title: item.title,
      theme: item.theme,
      image: item.image || recipe.image,
      recipe,
      when: 'Just now',
      completedAt: Date.now(),
    }, ...c]);
    showToast({
      kind: 'ready',
      title: 'Your video is ready',
      body: `"${item.title}"`,
      image: item.image || recipe.image,
      theme: item.theme,
      recipe,
    });
  }, [showToast]);

  // Simulate background generation — bump every item's progress on a
  // shared tick. When an item crosses to ≥ 1, fire the completion
  // side-effects (via microtask so we don't re-enter setState) and
  // drop it from the queue.
  useEffect(() => {
    const id = setInterval(() => {
      setQueue((q) => {
        const next = q.map((it) => ({ ...it, progress: Math.min(1, it.progress + 0.012) }));
        next.forEach((it, i) => {
          const prev = q[i];
          if (prev && prev.progress < 1 && it.progress >= 1) {
            queueMicrotask(() => onCreationComplete(it));
          }
        });
        return next.filter((it) => it.progress < 1);
      });
    }, 350);
    return () => clearInterval(id);
  }, [onCreationComplete]);

  const enqueue = useCallback((recipe) => {
    if (!recipe) return;
    setQueue((q) => [
      ...q,
      {
        id: 'q-' + Date.now(),
        title: recipe.title || 'Untitled creation',
        theme: recipe.theme,
        image: recipe.image,
        progress: 0,
      },
    ]);
    showToast({
      kind: 'queued',
      title: 'Adding to your queue',
      body: `"${recipe.title || 'New creation'}"`,
      image: recipe.image,
      theme: recipe.theme,
    });
  }, [showToast]);

  const dequeue = useCallback((id) => {
    setQueue((q) => q.filter((it) => it.id !== id));
  }, []);

  // Invite-reward event — fires when a user's shared link results in a
  // new signup. V1 no longer stores this in an inbox; the feedback is
  // the in-app toast plus the Home credits pill rolling upward.
  const onInviteReward = useCallback((amount = 50, inviteeName) => {
    const id = 'inv-' + Date.now();
    setCredits((c) => c + amount);
    setCreditsReward({ id, amount });
    showToast({
      kind: 'invite',
      title: `+${amount} credits earned`,
      body: inviteeName
        ? `${inviteeName} joined via your link`
        : 'A friend joined via your link',
      amount,
    });
  }, [showToast]);

  // Expose enqueue globally so screens (e.g. detail page CTA) can push
  // jobs without prop-drilling through every layer.
  useEffect(() => {
    window.__enqueueGeneration = enqueue;
  }, [enqueue]);

  const scrollRef = useRef(null);
  const lastY = useRef(0);
  const onScroll = useCallback((e) => {
    const y = e.target.scrollTop;
    const dy = y - lastY.current;
    if (Math.abs(dy) < 4) return;
    if (dy > 0 && y > 80) setCollapsed(true);
    else if (dy < 0) setCollapsed(false);
    lastY.current = y;
  }, []);

  // Reset scroll when changing tabs
  useEffect(() => {
    setCollapsed(false);
    lastY.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // Close the detail page if the user navigates via the bottom nav.
    setDetailRecipe(null);
    setDetailAutoOpen(false);
    setChatProject(null);
    setShareViewRecipe(null);
  }, [tab]);

  const NavComp = NAV_VARIANTS[t.navVariant]?.Comp || window.NavDock;
  const accent = t.accent;

  // Build phone content
  const phoneBg = t.theme === 'dark' ? 'var(--bg-grad-dark)' : 'var(--bg-grad)';

  return (
    <div>
      <LiquidDefs />

      {/* Phone — wrapped in a responsive stage that scales to fit any viewport */}
      <div className="phone-stage">
      <Phone bg={phoneBg} dark={t.theme === 'dark'}>
        {tab === 'home' && (
          <HomeScreen
            scrollRef={scrollRef} onScroll={onScroll}
            onTapInput={() => setComposerOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenCredits={() => setCreditsOpen(true)}
            onOpenRecipe={(recipe) => openDetail(recipe)}
            onLongPressRecipe={(recipe) => setShareViewRecipe(recipe)}
            activeChip={activeChip} setActiveChip={setActiveChip}
            accent={accent}
            credits={credits}
            creditsReward={creditsReward}
          />
        )}
        {tab === 'projects' && (
          <ProjectsScreen
            scrollRef={scrollRef} onScroll={onScroll}
            onOpenProject={(p) => setChatProject(p)}
            onOpenShareView={(recipe) => setShareViewRecipe(recipe)}
            accent={accent}
            queue={queue}
            completedCreations={completedCreations}
          />
        )}
        {/* Recipe detail — overlays the current tab when a card is tapped.
            Renders before <NavComp> so we can hide the nav while detail is up. */}
        {detailRecipe && (
          <RecipeDetailScreen
            recipe={detailRecipe}
            autoOpenConfig={detailAutoOpen}
            onBack={() => { setDetailRecipe(null); setDetailAutoOpen(false); }}
            onOpenShareView={(r) => setShareViewRecipe(r)}
          />
        )}

        {/* Project conversation — opened from a Projects tab item. Uses
            the project's title as the recipe-shaped object so we can
            reuse ConversationScreen. */}
        {chatProject && (
          <ConversationScreen
            recipe={chatProject}
            userText={chatProject.__userPrompt || chatProject.title}
            userFile={null}
            onClose={() => setChatProject(null)}
            onOpenShareView={(r) => setShareViewRecipe(r)}
          />
        )}

        {/* Shared-recipe viewer — full-bleed video page with title,
            description, scrubber and "Use this recipe" CTA. Sits above
            everything else so it works from any tab. */}
        {shareViewRecipe && (
          <ShareViewScreen
            recipe={shareViewRecipe}
            accent={accent}
            onClose={() => setShareViewRecipe(null)}
            onOpenCreationLog={(r) => {
              setChatProject(r);
              setShareViewRecipe(null);
            }}
          />
        )}

        {sharePageRecipe && (
          <SharePage
            recipe={sharePageRecipe}
            onClose={() => setSharePageRecipe(null)}
          />
        )}

        {/* Nav — persistent across the first-level tabs:
            Home / Creation. Notification Center is cut from v1; push
            and in-app toast route directly to their destination. Hidden only for overlay
            surfaces such as recipe detail, project conversation and
            share view. */}
        {['home', 'projects'].includes(tab) && !detailRecipe && !chatProject && !shareViewRecipe && !sharePageRecipe && (
          <NavComp
            active={tab}
            onChange={(id) => setTab(id)}
            onCreate={() => setComposerOpen(true)}
            onProfile={() => setProfileOpen(true)}
            queue={queue}
            onQueueClick={tab === 'home' ? () => setQueueOpen((v) => !v) : undefined}
            notifBadge={0}
            accent={accent}
            collapsed={collapsed}
            dark={t.theme === 'dark'}
          />
        )}

        {/* Global toast — pinned near the top of the phone, above every
            other surface. One2X Inverse Surface / Inverse On Surface
            tokens. Auto-dismiss timer lives in App so a navigation
            event can cancel it cleanly. */}
        {toast && (
          <ToastBanner
            toast={toast}
            accent={accent}
            onTap={() => {
              // Body tap — route to the natural destination for the
              // kind. Ready → watch the result; Failed → review &
              // adjust inputs in the config sheet before retrying;
              // Invite → Home, where the credits header pill is the
              // visible source of truth for the reward.
              if (toast.kind === 'ready' && toast.recipe) {
                setShareViewRecipe(toast.recipe);
              } else if (toast.kind === 'failed' && toast.recipe) {
                openDetail(toast.recipe, { autoOpenConfig: true });
              } else if (toast.kind === 'invite') {
                setTab('home');
              }
              setToast(null);
            }}
            onAction={() => {
              // Explicit pill — failed now mirrors body tap: take the
              // user to the config sheet to review inputs before retry.
              // No direct enqueue, so no separate retry toast.
              if (toast.kind === 'failed' && toast.recipe) {
                openDetail(toast.recipe, { autoOpenConfig: true });
              } else if (toast.kind === 'ready' && toast.recipe) {
                setShareViewRecipe(toast.recipe);
              } else if (toast.kind === 'invite') {
                setTab('home');
              }
              setToast(null);
            }}
            onDismiss={() => setToast(null)}
          />
        )}

        {/* Generation queue popover — anchored above the "+" FAB. */}
        {queueOpen && queue.length > 0 && (
          <QueuePanel
            queue={queue}
            accent={accent}
            onCancel={(id) => dequeue(id)}
            onClose={() => setQueueOpen(false)}
          />
        )}

        {/* Modals */}
        {composerOpen && (
          <ComposerSheet
            onClose={() => setComposerOpen(false)}
            accent={accent}
            navHeight={90}
            onSend={(text) => {
              // Free-create submit starts the generation task, then opens
              // the creation log. The result page is only reached by
              // tapping the generated preview inside the conversation.
              const trimmed = (text || '').trim();
              const title = trimmed
                ? (trimmed.length > 60 ? trimmed.slice(0, 60).trim() + '…' : trimmed)
                : 'New creation';
              const creation = {
                id: `composer-${Date.now()}`,
                title,
                theme: 'jelly',
                image: (window.RECIPES && window.RECIPES[0] && window.RECIPES[0].image) || null,
                __userPrompt: trimmed,
              };
              enqueue(creation);
              setComposerOpen(false);
              setChatProject(creation);
              setQueueOpen(false);
            }}
          />
        )}
        {profileOpen && (
          <ProfileSheet onClose={() => setProfileOpen(false)} accent={accent} />
        )}
        {creditsOpen && (
          <CreditsSheet onClose={() => setCreditsOpen(false)} accent={accent} />
        )}

        {!onboardingDone && (
          <OnboardingFlow
            onComplete={() => {
              setOnboardingDone(true);
              setTab('home');
            }}
          />
        )}
      </Phone>
      </div>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Bottom navigation">
          <TweakSelect
            label="Variant"
            value={t.navVariant}
            options={[
              { value: 'dock',     label: 'iOS 26 Dock — single floating pill (all controls in one surface)' },
              { value: 'wabi',     label: 'Wabi Trio — 3 separate glass chunks, expressive' },
              { value: 'composer', label: 'Inline Composer — Grok-style long pill with type-to-create' },
              { value: 'split',    label: 'Split Pill — labeled tabs + detached Create + Avatar' },
            ]}
            onChange={(v) => setTweak('navVariant', v)}
          />
        </TweakSection>
        <TweakSection label="Appearance">
          <TweakRadio
            label="Theme"
            value={t.theme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark',  label: 'Dark' },
            ]}
            onChange={(v) => setTweak('theme', v)}
          />
          <TweakColor
            label="Accent"
            value={t.accent}
            options={ACCENTS}
            onChange={(v) => setTweak('accent', v)}
          />
        </TweakSection>
        <TweakSection label="Screens">
          <TweakButton label="Go to Home" onClick={() => { setTab('home'); setProfileOpen(false); setComposerOpen(false); }} />
          <TweakButton label="Go to Projects" onClick={() => { setTab('projects'); setProfileOpen(false); setComposerOpen(false); }} />
          <TweakButton label="Open input (composer)" onClick={() => { setComposerOpen(true); setProfileOpen(false); }} secondary />
          <TweakButton label="Open Profile" onClick={() => { setProfileOpen(true); setComposerOpen(false); }} secondary />
          <TweakButton label="Replay onboarding" onClick={() => { setOnboardingDone(false); setProfileOpen(false); setComposerOpen(false); }} secondary />
          <TweakButton label={collapsed ? 'Expand nav' : 'Collapse nav (scroll)'} onClick={() => setCollapsed((c) => !c)} secondary />
          <TweakButton label="Enqueue test job" onClick={() => {
            const samples = (window.RECIPES || []).slice(0, 6);
            const pick = samples[Math.floor(Math.random() * samples.length)] || { title: 'Demo job', theme: 'jelly' };
            enqueue(pick);
          }} secondary />
          <TweakButton label="Open queue panel" onClick={() => setQueueOpen((v) => !v)} secondary />
          <TweakButton label="Open share view" onClick={() => {
            const pool = (window.RECIPES || []).filter((r) => r.image);
            const pick = pool[Math.floor(Math.random() * pool.length)] || (window.RECIPES || [])[0];
            setShareViewRecipe(pick);
            setProfileOpen(false); setComposerOpen(false);
          }} secondary />
        </TweakSection>
        <TweakSection label="Toast & push demos">
          <TweakButton label="Toast: Adding to queue" onClick={() => {
            const pool = (window.RECIPES || []).filter((r) => r.image);
            const pick = pool[Math.floor(Math.random() * pool.length)] || { title: 'New creation', theme: 'jelly' };
            showToast({ kind: 'queued', title: 'Adding to your queue', body: `"${pick.title}"`, image: pick.image, theme: pick.theme });
          }} secondary />
          <TweakButton label="Toast: Video ready" onClick={() => {
            const pool = (window.RECIPES || []).filter((r) => r.image);
            const pick = pool[Math.floor(Math.random() * pool.length)] || (window.RECIPES || [])[0];
            showToast({
              kind: 'ready',
              title: 'Your video is ready',
              body: `"${pick.title}"`,
              image: pick.image, theme: pick.theme, recipe: pick,
            });
          }} secondary />
          <TweakButton label="Toast: Generation failed" onClick={() => {
            const pool = (window.RECIPES || []).filter((r) => r.image);
            const pick = pool[Math.floor(Math.random() * pool.length)] || (window.RECIPES || [])[0];
            showToast({
              kind: 'failed',
              title: 'Generation failed',
              body: `"${pick.title}" couldn't finish`,
              image: pick.image, theme: pick.theme, recipe: pick,
            });
          }} secondary />
          <TweakButton label="Invite reward: friend joined (+50)" onClick={() => {
            // Picks a random name from a small pool so successive clicks
            // produce visibly different inbox entries.
            const names = ['Alex', 'Priya', 'Jordan', 'Mika', 'Sam', 'Wei'];
            const name = names[Math.floor(Math.random() * names.length)];
            onInviteReward(50, name);
          }} secondary />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// Phone shell — iPhone-like frame with background.
// Inner content area is 393×852 to match the Figma design frame exactly
// (iPhone 15 / 16 logical viewport), so 1:1 measurements from Figma can
// be pasted in as-is without manual rescaling.
function Phone({ children, bg, dark }) {
  return (
    <div className="phone" style={{
      width: 393, height: 852, borderRadius: 50, overflow: 'hidden',
      position: 'relative', background: bg,
      boxShadow: `
        0 0 0 11px #1a1a22,
        0 0 0 12px #2c2c34,
        0 50px 100px rgba(40,20,90,0.32),
        0 20px 40px rgba(40,20,90,0.18)
      `,
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      color: dark ? '#fff' : '#0A0A0A',
    }}>
      {/* Status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}>
        <IOSStatusBar dark={dark} />
      </div>
      {/* Dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 126, height: 37, borderRadius: 24, background: '#000', zIndex: 55,
      }} />

      {children}

      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 90,
        height: 34, display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        paddingBottom: 8, pointerEvents: 'none',
      }}>
        <div style={{
          width: 139, height: 5, borderRadius: 100,
          background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)',
        }} />
      </div>
    </div>
  );
}

// ToastBanner — global in-app toast, top of the phone frame.
// One2X DS mapping:
//   • background = Surface/Inverse Surface  (#09090b)
//   • foreground = Surface/Inverse On Surface  (#ffffff)
//   • corner radius = --shape-radius-24
//   • title    = label/large prominent  (14 / 600)
//   • body     = label/medium           (12 / 500)
// Visual borrows from the iOS push banner so the in-app + lock-screen
// variants read as the same product surface (see image 10 mockup).
function ToastBanner({ toast, accent, onTap, onAction, onDismiss }) {
  if (!toast) return null;
  const isReady = toast.kind === 'ready';
  const isFailed = toast.kind === 'failed';
  const isInvite = toast.kind === 'invite';
  const tappable = isReady || isFailed || isInvite;
  const theme = (window.CARD_THEMES || {})[toast.theme] || (window.CARD_THEMES || {}).jelly;

  // Icon shown when no thumbnail is provided.
  const fallbackGlyph = isFailed
    ? <Icon.Warning size={18} color="#FFB4B4" />
    : isReady
      ? <Icon.Sparkle size={18} color="#FFFFFF" />
      : isInvite
        ? <Icon.Gift size={20} color="#F6B73B" stroke={2} />
        : <Icon.Plus size={18} color="#FFFFFF" stroke={2.6} />;

  return (
    <div
      role={tappable ? 'button' : 'status'}
      tabIndex={tappable ? 0 : -1}
      onClick={() => tappable ? onTap && onTap() : onDismiss && onDismiss()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tappable ? onTap && onTap() : onDismiss && onDismiss();
        }
      }}
      className="toast-banner"
      style={{
        position: 'absolute',
        top: 56, left: 16, right: 16,
        zIndex: 200,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px 10px 10px',
        // One2X Inverse Surface
        background: '#09090B',
        color: '#FFFFFF',
        borderRadius: 24,
        boxShadow: '0 20px 50px rgba(0,0,0,0.32), 0 6px 14px rgba(0,0,0,0.22)',
        border: '0.5px solid rgba(255,255,255,0.06)',
        cursor: tappable ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}>
      {/* Thumbnail or fallback icon disc */}
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        overflow: 'hidden',
        background: isInvite
          ? 'linear-gradient(160deg, rgba(246, 183, 59, 0.22) 0%, rgba(246, 183, 59, 0.08) 100%)'
          : toast.image ? '#000' : (theme && theme.bg) || 'rgba(255,255,255,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        border: isInvite ? '0.5px solid rgba(246, 183, 59, 0.4)' : 'none',
      }}>
        {isInvite ? (
          fallbackGlyph
        ) : toast.image ? (
          <img src={toast.image} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            filter: isFailed ? 'saturate(0.4) brightness(0.7)' : 'none',
          }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          fallbackGlyph
        )}
        {/* Tiny failure / success corner marker on top of thumbnails */}
        {toast.image && (isFailed || isReady) && (
          <div style={{
            position: 'absolute', right: -2, bottom: -2,
            width: 16, height: 16, borderRadius: 999,
            background: isFailed ? '#FF4D4F' : (accent || '#7C5BFD'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 2px #09090B',
          }}>
            {isFailed
              ? <Icon.Warning size={9} color="#fff" />
              : <Icon.Sparkle size={9} color="#fff" />}
          </div>
        )}
      </div>

      {/* Text — title (label/large prominent) + body (label/medium) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: '"Manrope", system-ui, sans-serif',
          fontSize: 14, lineHeight: '20px', fontWeight: 600, letterSpacing: 0.1,
          color: '#FFFFFF',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{toast.title}</div>
        {toast.body && (
          <div style={{
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 12, lineHeight: '17px', fontWeight: 500, letterSpacing: 0.2,
            color: 'rgba(255,255,255,0.72)',
            marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{toast.body}</div>
        )}
      </div>

      {/* Trailing affordance — explicit action pill for tappable
          toasts. V1 has no notification center; toast actions route
          directly to the destination. */}
      {tappable && (
        <button
          tabIndex={-1}
          aria-hidden="true"
          onClick={(e) => {
            e.stopPropagation();
            if (isFailed && onAction) onAction();
            else if (onTap) onTap();
          }}
          style={{
            flexShrink: 0,
            height: 30, padding: '0 14px',
            borderRadius: 999,
            border: '0.5px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.10)',
            color: '#FFFFFF',
            fontFamily: '"Manrope", system-ui, sans-serif',
            fontSize: 13, lineHeight: 1, fontWeight: 600, letterSpacing: 0.1,
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}>
          {isFailed ? 'Retry' : 'View'}
        </button>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
