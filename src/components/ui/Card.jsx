export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-150 p-6 shadow-xs ${className}`}>
      {children}
    </div>
  );
}