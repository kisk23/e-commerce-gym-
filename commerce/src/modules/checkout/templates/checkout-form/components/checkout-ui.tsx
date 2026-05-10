// Shared primitives used across all checkout section components

export const inputBase =
  "w-full rounded-lg border border-[#e2e0d8] bg-[#f7f6f2] px-4 py-3 text-sm text-[#2d3a1e] placeholder-[#b0ad9e] outline-none transition-all focus:border-[#3d5a1e] focus:bg-white focus:ring-2 focus:ring-[#3d5a1e]/10"

// ─── Field ────────────────────────────────────────────────────────────────────

export const Field = ({
  label,
  id,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string
  id: string
  placeholder?: string
  type?: string
  defaultValue?: string
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      htmlFor={id}
      className="text-xs font-semibold text-[#4a5a30] tracking-widest uppercase"
    >
      {label}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className={inputBase}
    />
  </div>
)

// ─── Section Card ─────────────────────────────────────────────────────────────

export const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) => (
  <div className="rounded-2xl border p-6 shadow-sm w-full">
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#f0ede4]">
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#f0ede4] text-[#3d5a1e]">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-[#1e2d0e] tracking-tight">
        {title}
      </h2>
    </div>
    {children}
  </div>
)

// ─── Icons ────────────────────────────────────────────────────────────────────

export const PersonIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
)

export const LocationIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
    <circle cx="12" cy="9" r="2.5" />
  </svg>
)

export const CardIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
)

export const LockIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)
