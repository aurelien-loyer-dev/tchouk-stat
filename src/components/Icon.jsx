// Jeu d'icônes trait 2px (24×24), même style partout.
const PATHS = {
  back:     <path d="m15 18-6-6 6-6" />,
  chevron:  <path d="m9 18 6-6-6-6" />,
  down:     <path d="m6 9 6 6 6-6" />,
  close:    <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  plus:     <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus:    <path d="M5 12h14" />,
  edit:     <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  sun:      <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon:     <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  play:     <path d="M7 4.5v15l12-7.5Z" />,
  pause:    <><path d="M8 5v14" /><path d="M16 5v14" /></>,
  skip:     <><path d="M6 5v14l9-7Z" /><path d="M18 5v14" /></>,
  reset:    <><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></>,
  sheet:    <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
  players:  <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14a5 5 0 0 1 3.5 6" /></>,
  scoreboard: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M12 5v14" /><path d="M6.5 10v4M16 10h2.5v4H16" /></>,
  trophy:   <><path d="M7 4h10v4a5 5 0 0 1-10 0Z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /><path d="M12 13v4M8 21h8M9 17h6v4H9Z" /></>,
  image:    <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
}

export default function Icon({ name, size = 20, className, ...rest }) {
  const filled = name === 'play'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
