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

// Notifications: five "kinds" map to a small badge on the thumbnail —
//   ready    → sparkle    (a user's creation finished rendering)
//   failed   → warning    (a creation failed to render; tap to retry)
//   announce → megaphone  (an existing recipe is now live / promoted)
//   new      → beaker     (a brand new recipe is here)
//   invite   → gift       (a friend joined via the user's shared link;
//                          they earned `amount` credits as a referral
//                          reward — tap routes to Home where the live
//                          credits balance lives in the header pill)
// `cta` is the inline link text. `theme` references CARD_THEMES for the
// thumbnail gradient. Optional `image` shows real artwork when available.
window.NOTIFICATIONS = [
  {
    id: 'n_invite', kind: 'invite', unread: true, when: '5m ago',
    title: 'You earned 50 credits',
    body: 'A friend joined Medeo via your shared link.',
    cta: 'Share to earn more',
    amount: 50,
    inviteeName: 'Alex',
  },
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
    id: 'n3', kind: 'new', unread: true, when: '1d ago',
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
    id: 'n5', kind: 'new', unread: false, when: '3d ago',
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

window.PROJECTS = [
  { id: 'p1', title: 'From Fluffy Kitten to Muscular Sailor C…', when: 'Edited 21 hours ago', theme: 'cat' },
  { id: 'p2', title: '同样视频，不同动物：猫变狗挑战', when: 'Edited 22 hours ago', theme: 'cat' },
  { id: 'p3', title: '从瘦猫到大力士的成长之旅', when: 'Edited 23 hours ago', theme: 'cat' },
];
