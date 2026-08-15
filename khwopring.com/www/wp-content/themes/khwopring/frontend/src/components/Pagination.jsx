export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        className="rounded-md px-3 py-2 text-sm font-medium text-navy disabled:opacity-30 dark:text-cream-100"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        ← Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`h-9 w-9 rounded-md text-sm font-medium ${
            p === page ? 'bg-rust text-white' : 'text-navy hover:bg-cream-200 dark:text-cream-100 dark:hover:bg-white/10'
          }`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}
      <button
        className="rounded-md px-3 py-2 text-sm font-medium text-navy disabled:opacity-30 dark:text-cream-100"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Next →
      </button>
    </nav>
  )
}
