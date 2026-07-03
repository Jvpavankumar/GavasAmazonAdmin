interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'h-5 w-5 border-2',
  md: 'h-9 w-9 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

export default function Loader({
  label,
  size = 'md',
  fullPage = false,
  className = '',
}: LoaderProps) {
  const spinner = (
    <div
      className={`animate-spin rounded-full border-lavender-200 border-t-lavender-700 ${SIZES[size]}`}
      role="status"
      aria-label={label ?? 'Loading'}
    />
  );

  if (fullPage) {
    return (
      <div className={`flex items-center justify-center gap-2.5 py-10 ${className}`}>
        <div
          className={`animate-spin rounded-full border-lavender-200 border-t-lavender-700 ${SIZES.sm}`}
          role="status"
          aria-label={label ?? 'Loading'}
        />
        {label && <p className="text-sm text-gray-400">{label}</p>}
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      {spinner}
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
