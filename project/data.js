// data.js — sample content for the prototype
// Recipe list mirrors the Figma showcaseFeeds frame (node 18606:24553) 1:1.
//   col          → which masonry column the card lives in ('L' | 'R')
//   thumbHeight  → fixed thumbnail height in px (Figma "h-[145px]" / "h-[177px]")
//   thumbAspect  → CSS aspect-ratio for the thumbnail (Figma "aspect-[240/402]")
//   image        → optional photo path relative to project/. Falls back to the
//                  theme gradient placeholder when missing or fails to load.
// Order in this array is just the data order; the home screen renders the
// two columns in their Figma sequence using the `col` field.
window.RECIPES = [
  // Left column (Figma row02 #1) — tall, medium, tall
  { id: 'jelly',   title: 'ASMR Jelly Brainrot',    credits: 12, theme: 'jelly',   isNew: true, col: 'L', thumbAspect: '240/402', image: 'uploads/jelly.png',
    description: 'Turn any face into a squishy, jelly-like sculpture being molded by hands. Satisfying, weird, and impossible to scroll past — built for ASMR and curiosity-driven virality.',
    // Preview-state copy with an inline source-file chip. `{FILE}` is the
    // placeholder the renderer swaps for the FileChip pill. previewFile
    // provides the thumb + filename that pill displays.
    previewDescription: 'Turn a face {FILE} into a squishy, jelly-like sculpture being molded by hands. Satisfying, weird, and impossible to scroll past — built for ASMR and curiosity-driven virality.',
    previewFile: { name: '@character face image', thumb: 'uploads/jelly.png' } },
  { id: 'hearth',  title: 'Hearthstone Card',       credits: 12, theme: 'fantasy', isNew: true, col: 'L', thumbHeight: 177,        image: 'uploads/hearthstone.png',
    description: 'Become the legendary hero of your own Hearthstone-style card — golden frame, mana cost, and a signature ability you actually want to play.' },
  { id: 'disney',  title: 'Disney Cameo Original',  credits: 12, theme: 'cozy',    isNew: true, col: 'L', thumbAspect: '240/402', image: 'uploads/cozy-living.png',
    description: 'Reimagine any photo as a Disney-style cameo — soft cinematic lighting, fairytale set dressing, and that signature wholesome glow.' },

  // Right column (Figma row02 #2) — short, tall, tall, medium
  { id: 'retro',   title: 'Retro Profile Printer',  credits: 12, theme: 'retro',   isNew: true, col: 'R', thumbHeight: 145,        image: 'uploads/retro.png',
    description: 'Print yourself as a nostalgic pixel-art profile picture, complete with vintage scanlines and chiptune charm.' },
  { id: 'ootd',    title: 'Day Drive OOTD',         credits: 12, theme: 'drive',   isNew: true, col: 'R', thumbAspect: '240/402', image: 'uploads/day-drive.png',
    description: 'Capture your daily-drive look as a cinematic OOTD selfie — golden-hour window light, dashboard bokeh, the whole vibe.' },
  { id: 'special', title: 'Special Profile',        credits: 12, theme: 'chef',    isNew: true, col: 'R', thumbAspect: '240/402', image: 'uploads/chef.png',
    description: 'Cast yourself as a Michelin-style chef pulling back the silver cloche on your secret creation. Dramatic reveal, perfect plating.' },
  { id: 'kbo',     title: 'KBO Star Cam',           credits: 12, theme: 'snap',    isNew: true, col: 'R', thumbHeight: 177,
    description: 'Make any moment look like a KBO highlight reel — stadium lights, slow-mo, broadcast-grade polish.' },
];

window.CARD_THEMES = {
  jelly:   { bg: 'linear-gradient(160deg, #F7E8DD 0%, #E9D2BE 100%)', label: 'jelly head sculpt' },
  retro:   { bg: 'linear-gradient(160deg, #B7DCFF 0%, #DFEAFF 100%)', label: 'retro printer' },
  drive:   { bg: 'linear-gradient(160deg, #F8D0CF 0%, #E9B5C5 100%)', label: 'pink ribbon drive' },
  fantasy: { bg: 'linear-gradient(160deg, #4A5C8B 0%, #2B3050 100%)', label: 'knight card' },
  cozy:    { bg: 'linear-gradient(160deg, #F5E6CB 0%, #E2C99C 100%)', label: 'cozy room' },
  chef:    { bg: 'linear-gradient(160deg, #2B2B2F 0%, #15151A 100%)', label: 'chef apron' },
  snap:    { bg: 'linear-gradient(160deg, #1A1A1F 0%, #050505 100%)', label: 'aura snap' },
  manga:   { bg: 'linear-gradient(160deg, #F4F2EE 0%, #D9D2C5 100%)', label: 'manga frame' },
  tasting: { bg: 'linear-gradient(160deg, #F2D454 0%, #EAB42E 100%)', label: 'free tasting' },
  cat:     { bg: 'linear-gradient(160deg, #E8C195 0%, #C49066 100%)', label: 'fluffy cat' },
};

window.CHIPS = ['All', 'Manifest for me'];

// Notifications: three message kinds for this scope —
//   ready    → generation result succeeded; tap to watch the result
//   failed   → generation result failed; tap to review and retry inputs
//   announce → official/operator template update; tap to recipe detail
// `cta` is the inline link text. `theme` references CARD_THEMES for the
// thumbnail gradient. Optional `image` shows real artwork when available.
window.NOTIFICATIONS = [
  {
    id: 'n1', kind: 'ready', unread: true, when: 'now',
    title: 'Your creation is ready!',
    body: '"ASMR Jelly Brainrot" has been generated successfully.',
    cta: 'View creation',
    theme: 'jelly', image: 'uploads/jelly.png',
  },
  {
    id: 'n_fail', kind: 'failed', unread: true, when: '12m ago',
    title: 'Generation failed',
    body: '"Hearthstone Card" couldn\'t finish. Tap to retry with the same inputs.',
    cta: 'Retry',
    theme: 'fantasy', image: 'uploads/hearthstone.png',
  },
  {
    id: 'n2', kind: 'announce', unread: true, when: '2h ago',
    title: 'Retro Profile Printer is now live',
    body: 'Create nostalgic pixel art profile pictures in seconds.',
    cta: 'Try it now',
    theme: 'retro', image: 'uploads/retro.png',
  },
  {
    id: 'n3', kind: 'announce', unread: true, when: '1d ago',
    title: 'Space Cat Adventure is here',
    body: 'Turn your photos into cosmic journeys with this new recipe.',
    cta: 'Try it now',
    theme: 'cat',
  },
  {
    id: 'n4', kind: 'announce', unread: false, when: '2d ago',
    title: 'VHS Mood is now live',
    body: 'Add vintage VHS effects to your videos with one tap.',
    cta: 'Try it now',
    theme: 'fantasy',
  },
  {
    id: 'n5', kind: 'announce', unread: false, when: '3d ago',
    title: 'Mixtape Cover Maker is here',
    body: 'Design custom mixtape covers in seconds.',
    cta: 'Try it now',
    theme: 'drive', image: 'uploads/day-drive.png',
  },
  {
    id: 'n6', kind: 'announce', unread: false, when: '4d ago',
    title: 'Dream Cam is now live',
    body: 'Generate dreamy instant photos with soft film vibes.',
    cta: 'Try it now',
    theme: 'cozy', image: 'uploads/cozy-living.png',
  },
];

// `ts` is an epoch-ms timestamp used by the Creation tab to group
// finished work along a timeline (Today / actual dates). Seeded relative
// to load time so the buckets always have a sensible spread.
//
// `fromRecipe: true` marks a result that was generated from a template
// recipe (vs. free-form chat). The CreateSpace grid shows a sparkle badge
// and the result page shows a "Recipe" tag for these — we spread the real
// RECIPES entries so the detail/config page has full context on Edit.
(function seedProjects() {
  const byId = Object.fromEntries((window.RECIPES || []).map((r) => [r.id, r]));
  window.PROJECTS = [
    // Recipe-generated results — carry the full recipe context + fromRecipe flag.
    { ...(byId.jelly || {}), id: 'g_jelly', fromRecipe: true, when: 'Generated 2 hours ago', ts: Date.now() - 2 * 3600 * 1000 },
    { ...(byId.retro || {}), id: 'g_retro', fromRecipe: true, when: 'Generated yesterday', ts: Date.now() - 28 * 3600 * 1000 },
    { ...(byId.hearth || {}), id: 'g_hearth', fromRecipe: true, when: 'Generated 3 days ago', ts: Date.now() - 3 * 24 * 3600 * 1000 },
    // Chat-generated results — no recipe context, no badge/tag.
    { id: 'p1', title: 'From Fluffy Kitten to Muscular Sailor C…', when: 'Edited 5 hours ago', theme: 'cat', ts: Date.now() - 5 * 3600 * 1000 },
    { id: 'p2', title: '同样视频，不同动物：猫变狗挑战', when: 'Edited yesterday', theme: 'cat', ts: Date.now() - 30 * 3600 * 1000 },
    { id: 'p3', title: '从瘦猫到大力士的成长之旅', when: 'Edited 4 days ago', theme: 'cat', ts: Date.now() - 4 * 24 * 3600 * 1000 },
  ];
})();
