import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AppShell.module.css';

export default function AppShell({ title, back = false, wide = false, children }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = title ? `${title} · c-quest.sn25` : 'c-quest.sn25';
  }, [title]);

  const goBack = () => {
    // Kalau halaman dibuka langsung (tanpa riwayat), kembali ke beranda.
    (window.history.state?.idx ?? 0) > 0 ? navigate(-1) : navigate('/');
  };

  return (
    <>
      <header className={styles.header}>
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
      </header>
      <main className={`${styles.main} ${wide ? styles.wide : ''}`}>{children}</main>
    </>
  );
}
