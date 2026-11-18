import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { installClickSound } from './lib/sfx.js';
import './index.css';

// Semua tombol berbunyi "klik" kecil (bisa dimatikan lewat tombol 🔊 di pojok kanan atas).
installClickSound();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
