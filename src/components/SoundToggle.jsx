import { setMuted, sfx, useMuted } from '../lib/sfx.js';

/**
 * Tombol suara aktif/bisu. Status disimpan di perangkat, jadi tetap berlaku
 * di semua halaman dan saat aplikasi dibuka lagi.
 * `as` = komponen tombol yang dipakai (misalnya HudButton di Kuis), bawaan <button>.
 */
export default function SoundToggle({ as: Button = 'button', className = '', ...rest }) {
  const muted = useMuted();
  return (
    <Button
      type="button"
      data-sfx="off"
      onClick={() => {
        setMuted(!muted);
        if (muted) sfx.click(); // bunyi kecil sebagai tanda suara aktif lagi
      }}
      aria-pressed={!muted}
      aria-label={muted ? 'Suara mati. Ketuk untuk menyalakan.' : 'Suara menyala. Ketuk untuk mematikan.'}
      title={muted ? 'Nyalakan suara' : 'Matikan suara'}
      className={className}
      {...rest}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </Button>
  );
}
