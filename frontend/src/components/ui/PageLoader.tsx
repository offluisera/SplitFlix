// ── PageLoader ────────────────────────────────────────────────────
export default function PageLoader() {
  return (
    <div className="fixed inset-0 bg-dark-950 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-dark-600 border-t-brand-500 rounded-full animate-spin" />
        <span className="text-gray-400 text-sm">Carregando...</span>
      </div>
    </div>
  )
}
