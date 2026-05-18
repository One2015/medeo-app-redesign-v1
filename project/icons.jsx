// icons.jsx — shared icon set
const Icon = {
  Home: ({ size = 24, color = 'currentColor', filled = false, stroke = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5L12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5z"/>
    </svg>
  ),
  Bell: ({ size = 24, color = 'currentColor', filled = false, stroke = 2, hasDot = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" fill="none"/>
      {hasDot && <circle cx="18.5" cy="5" r="3" fill="#FF3B30" stroke="none"/>}
    </svg>
  ),
  Plus: ({ size = 24, color = 'currentColor', stroke = 2.4 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Search: ({ size = 22, color = 'currentColor', stroke = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/>
      <path d="M21 21l-4.3-4.3"/>
    </svg>
  ),
  Sparkle: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2z"/>
    </svg>
  ),
  Bolt: ({ size = 18, color = '#F4B400' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>
    </svg>
  ),
  Back: ({ size = 20, color = 'currentColor', stroke = 2.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  Close: ({ size = 18, color = 'currentColor', stroke = 2.2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18"/>
    </svg>
  ),
  Hamburger: ({ size = 22, color = 'currentColor', stroke = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16"/>
    </svg>
  ),
  Chevron: ({ size = 16, color = 'currentColor', stroke = 2, dir = 'right' }) => {
    const rot = { right: 0, down: 90, left: 180, up: -90 }[dir];
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${rot}deg)` }}>
        <path d="M9 6l6 6-6 6"/>
      </svg>
    );
  },
  HeartFill: ({ size = 20, color = '#FF4F8B' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 21s-7-4.5-9.5-9.4C0.8 7.7 3.5 4 7 4c2 0 3.7 1 5 2.6C13.3 5 15 4 17 4c3.5 0 6.2 3.7 4.5 7.6C19 16.5 12 21 12 21z"/>
    </svg>
  ),
  Comment: ({ size = 18, color = 'currentColor', stroke = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z"/>
    </svg>
  ),
  Gift: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" rx="1"/>
      <path d="M12 8v13M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8"/>
      <path d="M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8M16.5 8a2.5 2.5 0 1 0 0-5C14 3 12 8 12 8"/>
    </svg>
  ),
  Trophy: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/>
      <path d="M7 6H4a1 1 0 0 0-1 1c0 3 2 5 4 5M17 6h3a1 1 0 0 1 1 1c0 3-2 5-4 5"/>
      <path d="M9 21h6M12 14v7"/>
    </svg>
  ),
  User: ({ size = 22, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
    </svg>
  ),
  Settings: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Logout: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  ),
  Refresh: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15.5-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.4L3 16M3 21v-5h5"/>
    </svg>
  ),
  Chat: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.7-.9L3 21l1.9-5.3a8.4 8.4 0 1 1 16.1-4.2z"/>
    </svg>
  ),
  Share: ({ size = 18, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
    </svg>
  ),
  Ratio: ({ size = 18, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="10" rx="2"/>
    </svg>
  ),
  Cube: ({ size = 18, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"/>
      <path d="M3 7.5L12 12l9-4.5M12 12v9"/>
    </svg>
  ),
  Dots: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/>
    </svg>
  ),
  Play: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M7 4v16l13-8L7 4z"/>
    </svg>
  ),
  Verified: ({ size = 16, color = '#7C5BFD' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 1l2.5 2.2 3.3-.4.8 3.3 3 1.4-1.4 3 1.4 3-3 1.4-.8 3.3-3.3-.4L12 20l-2.5-2.2-3.3.4-.8-3.3-3-1.4 1.4-3-1.4-3 3-1.4.8-3.3 3.3.4L12 1z"/>
      <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Megaphone: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l1 4h3l-1-4h1l9 4V5l-9 4H5a2 2 0 0 0-2 2z"/>
    </svg>
  ),
  Beaker: ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6"/>
      <path d="M10 3v6.5L4.5 18A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/>
      <path d="M7.5 14h9"/>
    </svg>
  ),
  Sliders: ({ size = 18, color = 'currentColor', stroke = 2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/>
      <circle cx="16" cy="6" r="2" fill={color} stroke="none"/>
      <circle cx="8" cy="12" r="2" fill={color} stroke="none"/>
      <circle cx="18" cy="18" r="2" fill={color} stroke="none"/>
    </svg>
  ),
  ChefHat: ({ size = 18, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M6 14c-2.2 0-4-1.8-4-4 0-2 1.5-3.7 3.5-4 .2-2.2 2.1-4 4.5-4 1.4 0 2.7.7 3.5 1.7C14.3 2.7 15.6 2 17 2c2.5 0 4.5 2 4.5 4.5 0 .2 0 .3 0 .5C22 8 22.5 9.5 22 11c-.6 1.9-2.5 3-4.5 3H6z"/>
      <path d="M6.5 14h11l-.7 5.6c-.1 1.4-1.3 2.4-2.7 2.4H10c-1.4 0-2.5-1-2.7-2.4L6.5 14z"/>
    </svg>
  ),
  Daisy: ({ size = 14, color = '#F5C518' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="5" r="3.2"/>
      <circle cx="19" cy="12" r="3.2"/>
      <circle cx="12" cy="19" r="3.2"/>
      <circle cx="5" cy="12" r="3.2"/>
      <circle cx="12" cy="12" r="2.8" fill="#5A3A00"/>
    </svg>
  ),
  Mic: ({ size = 18, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
    </svg>
  ),
  MicMuted: ({ size = 18, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18"/>
      <path d="M11 5a3 3 0 0 1 4 2.8V11M9 11v0a3 3 0 0 0 4.4 2.65"/>
      <path d="M5 11a7 7 0 0 0 11.4 5.4M19 11a7 7 0 0 1-.6 2.8"/>
      <path d="M12 18v3"/>
    </svg>
  ),
  Photo: ({ size = 22, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3"/>
      <circle cx="9" cy="10" r="2"/>
      <path d="M21 17l-5-5-9 8"/>
    </svg>
  ),
  Music: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l11-2v13"/>
      <circle cx="6" cy="18" r="3" fill={color} stroke="none"/>
      <circle cx="17" cy="16" r="3" fill={color} stroke="none"/>
    </svg>
  ),
  Camera: ({ size = 22, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Wand: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 4l-1 2-2 1 2 1 1 2 1-2 2-1-2-1-1-2z"/>
      <path d="M5 21l9-9"/>
      <path d="M19 8l-1.5 1.5"/>
    </svg>
  ),
  Play2: ({ size = 14, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M7 5v14l13-7L7 5z"/>
    </svg>
  ),
  // Material-aligned download glyph: downward arrow with a tray underneath.
  // Used on the share-view page action row.
  Download: ({ size = 18, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12"/>
      <path d="M7 11l5 5 5-5"/>
      <path d="M5 20h14"/>
    </svg>
  ),
  // Speaker with a slash — for the muted state in the video controls bar.
  // Distinct from MicMuted (microphone) so the metaphor matches video audio.
  VolumeOff: ({ size = 20, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H3v6h3l5 4V5z"/>
      <path d="M22 9l-6 6M16 9l6 6"/>
    </svg>
  ),
};

window.Icon = Icon;
