export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyle = "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-red-500 text-white hover:bg-red-600 shadow-red-500/10",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    outline: "border border-slate-200 text-slate-600 hover:bg-slate-50"
  };

  return (
    <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}