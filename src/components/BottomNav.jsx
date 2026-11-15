import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const TABS = [
  {
    to: '/',
    label: 'Belajar',
    end: true,
    icon: 'M4 5h7a3 3 0 013 3v11a2 2 0 00-2-2H4zM20 5h-4a3 3 0 00-2 1',
  },
  { to: '/misi', label: 'Misi', icon: 'M5 21V4m0 0h11l-2 4 2 4H5' },
  {
    to: '/quest',
    label: 'Quest',
    icon: 'M12 3l7 4v10l-7 4-7-4V7zM5 7l7 4 7-4M12 11v10',
  },
  {
    to: '/latihan',
    label: 'Latihan',
    icon: 'M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2',
  },
  { to: '/bidang-bebas', label: 'Bidang Bebas', icon: 'M12 3v18M3 12h18M7 7h0M17 17h0' },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Navigasi utama">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path
              d={tab.icon}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
