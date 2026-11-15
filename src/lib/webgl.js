let cached;

/** Cek sekali apakah browser mendukung WebGL (untuk Kota 3D). */
export function hasWebGL() {
  if (cached !== undefined) return cached;
  try {
    if (typeof window === 'undefined' || !window.WebGLRenderingContext) return (cached = false);
    const canvas = document.createElement('canvas');
    cached = !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    cached = false;
  }
  return cached;
}
