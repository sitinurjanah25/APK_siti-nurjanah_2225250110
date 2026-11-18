import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SoundToggle from './SoundToggle.jsx';
import styles from './AppShell.module.css';
import { CosmicPage } from './cosmic/Cosmic.jsx';

/**
 * theme:
 *  - undefined  : halaman mengatur latarnya sendiri
 *  - 'cosmic'   : dibungkus latar kosmik
 *  - 'panel'    : latar kosmik + isi lama di dalam panel kaca terang (tetap mudah dibaca)
 */
export default function AppShell({ title, back = false, wide = false, theme, children }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = title ? `${title} · cartes.play` : 'cartes.play';
  }, [title]);

  const goBack = () => {
    // Kalau halaman dibuka langsung (tanpa riwayat), kembali ke beranda.
    (window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/');
  };

  return (
    <>
      <header className={styles.header} data-shell-header>
        {back ? (
          <button type="button" className={styles.back} onClick={goBack} aria-label="Kembali">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                d="M15 5l-7 7 7 7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <span className={styles.spacer} aria-hidden="true" />
        )}
        <h1 className={styles.title}>{title}</h1>
        <SoundToggle className={`${styles.back} ${styles.sound}`} />
      </header>
      <main className={`${styles.main} ${wide ? styles.wide : ''} motion-safe:animate-page-in`}>
        {theme === 'cosmic' || theme === 'panel' ? (
          <CosmicPage>{theme === 'panel' ? <div className="cosmic-panel">{children}</div> : children}</CosmicPage>
        ) : (
          children
        )}
      </main>
    </>
  );
}
