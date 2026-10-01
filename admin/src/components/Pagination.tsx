export default function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Pagination">
      <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="px-3 text-sm text-muted">Page {page} of {pages}</span>
      <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}
