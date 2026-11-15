// Teks dengan format mini: **tebal**, serta penanda nilai x (biru), y (oranye), dan z (hijau) di dalam kurung siku.
const TOKEN = /\*\*(.+?)\*\*|\[(x|y|z):([^\]]+)\]/g;

function tokenize(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ type: 'bold', value: m[1] });
    else parts.push({ type: m[2], value: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts;
}

export function Inline({ text }) {
  return tokenize(text).map((part, i) => {
    if (part.type === 'bold')
      return (
        <strong key={i}>
          <Inline text={part.value} />
        </strong>
      );
    if (part.type === 'x')
      return (
        <span key={i} className="val-x num">
          {part.value}
        </span>
      );
    if (part.type === 'y' || part.type === 'z')
      return (
        <span key={i} className={`val-${part.type} num`}>
          {part.value}
        </span>
      );
    return part.value;
  });
}

/** Satu atau beberapa paragraf (`text` boleh string atau array string). */
export default function RichText({ text, as: Tag = 'p', className }) {
  return (Array.isArray(text) ? text : [text]).map((t, i) => (
    <Tag key={i} className={className}>
      <Inline text={t} />
    </Tag>
  ));
}
