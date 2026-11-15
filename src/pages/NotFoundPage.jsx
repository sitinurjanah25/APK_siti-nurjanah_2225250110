import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="card">
      <h2>Halaman tidak ditemukan</h2>
      <p>Alamat ini tidak ada di Kota Koordinat.</p>
      <Link to="/" className="btn btn-primary">
        Ke Beranda
      </Link>
    </section>
  );
}
