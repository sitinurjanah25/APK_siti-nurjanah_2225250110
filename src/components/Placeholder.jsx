/** Kartu untuk halaman yang belum selesai dibuat. */
export default function Placeholder({ children, milestone }) {
  return (
    <section className="card">
      {children}
      {milestone && <p className="muted">Bagian ini sedang dibuat (milestone {milestone}).</p>}
    </section>
  );
}
