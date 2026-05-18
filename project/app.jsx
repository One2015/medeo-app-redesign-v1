// app.jsx — main wiring
const { useState, useRef, useEffect, useCallback } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "navVariant": "wabi",
  "theme": "light",
  "accent": "#7C5BFD",
  "showOnlyOne": false
}/*EDITMODE-END*/;

const NAV_VARIANTS = {
  dock:     { name: 'iOS 26 Dock',        Comp: window.NavDock },
  wabi:     { name: 'Wabi Trio',          Comp: window.NavWabi },
  composer: { name: 'Inline Composer',    Comp: window.NavComposer },
  split:    { name: 'Split Pill',         Comp: window.NavSplit },
};

const ACCENTS = ['#7C5BFD', '#FF4F8B', '#22C58A', '#FF9F0A'];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useState('home');
  const [composerOpen, setComposerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeChip, setActiveChip] = useState('All');
  const [collapsed, setCollapsed] = useState(false);
  // Recipe detail page — when set, renders RecipeDetailScreen above the
  // current tab and hides the bottom nav. Cleared by the back button.
  const [detailRecipe, setDetailRecipe] = useState(null);
  // Project chat — when set, opens ConversationScreen for the selected
  // project (Projects tab → tap an item).
  const [chatProject, setChatProject] = useState(null);
  // Shared-recipe viewer (Figma node 20669:12391). Opened when the user
  // long-presses a card or follows a share link — for the prototype it's
  // exposed via a Tweaks button and a long-press on a homepage card.
  const [shareViewRecipe, setShareViewRecipe] = useState(null);

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

  // Simulate background generation — bump every item's progress on a
  // shared tick; completed items (progress ≥ 1) drop off the queue.
  useEffect(() => {
    const id = setInterval(() => {
      setQueue((q) => q
        .map((it) => ({ ...it, progress: Math.min(1, it.progress + 0.012) }))
        .filter((it) => it.progress < 1));
    }, 350);
    return () => clearInterval(id);
  }, []);

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
  }, []);

  const dequeue = useCallback((id) => {
    setQueue((q) => q.filter((it) => it.id !== id));
  }, []);

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
            onOpenRecipe={(recipe) => setDetailRecipe(recipe)}
            onLongPressRecipe={(recipe) => setShareViewRecipe(recipe)}
            activeChip={activeChip} setActiveChip={setActiveChip}
            accent={accent}
          />
        )}
        {tab === 'projects' && (
          <ProjectsScreen
            scrollRef={scrollRef} onScroll={onScroll}
            onOpenProject={(p) => setChatProject(p)}
            onBack={() => setTab('home')}
            accent={accent}
          />
        )}
        {tab === 'notif' && (
          <NotificationScreen
            scrollRef={scrollRef} onScroll={onScroll}
            onOpenRecipe={(recipe) => setDetailRecipe(recipe)}
            onOpenShareView={(recipe) => setShareViewRecipe(recipe)}
            onBack={() => setTab('home')}
            accent={accent}
          />
        )}

        {/* Recipe detail — overlays the current tab when a card is tapped.
            Renders before <NavComp> so we can hide the nav while detail is up. */}
        {detailRecipe && (
          <RecipeDetailScreen
            recipe={detailRecipe}
            onBack={() => setDetailRecipe(null)}
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
            onUseRecipe={(r) => {
              // "Use this recipe" jumps straight to the work's recipe
              // detail page so the user can review the inputs and remix.
              setShareViewRecipe(null);
              setDetailRecipe(r || shareViewRecipe);
            }}
          />
        )}

        {/* Nav — hidden while a recipe detail page is open.
            Projects is now a true tab (renders the full-screen
            ProjectsScreen above) rather than a sheet trigger, so
            `onProjects` is no longer needed. `onProfile` is kept for
            nav variants that still surface the avatar in the nav;
            the homepage header now hosts the primary profile entry. */}
        {/* Bottom nav lives ONLY on the home tab. Projects and
            Notification render as standalone full-screen pages with
            their own glass back button instead of the nav. */}
        {tab === 'home' && !detailRecipe && !chatProject && !shareViewRecipe && (
          <NavComp
            active={tab}
            onChange={(id) => setTab(id)}
            onCreate={() => setComposerOpen(true)}
            onProfile={() => setProfileOpen(true)}
            queue={queue}
            onQueueClick={() => setQueueOpen((v) => !v)}
            accent={accent}
            collapsed={collapsed}
            dark={t.theme === 'dark'}
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
              // Build a lightweight project from the typed prompt so the
              // existing ConversationScreen can render the chat. Empty
              // prompts still navigate — the chat surface defaults the
              // first user bubble to a generic ask.
              const trimmed = (text || '').trim();
              const title = trimmed
                ? (trimmed.length > 60 ? trimmed.slice(0, 60).trim() + '…' : trimmed)
                : 'New creation';
              const project = {
                id: `composer-${Date.now()}`,
                title,
                theme: 'jelly',
                image: null,
                __userPrompt: trimmed,
              };
              setComposerOpen(false);
              setChatProject(project);
            }}
          />
        )}
        {profileOpen && (
          <ProfileSheet onClose={() => setProfileOpen(false)} accent={accent} />
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
          <TweakButton label="Go to Notifications" onClick={() => { setTab('notif'); setProfileOpen(false); setComposerOpen(false); }} />
          <TweakButton label="Open input (composer)" onClick={() => { setComposerOpen(true); setProfileOpen(false); }} secondary />
          <TweakButton label="Open Profile" onClick={() => { setProfileOpen(true); setComposerOpen(false); }} secondary />
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
