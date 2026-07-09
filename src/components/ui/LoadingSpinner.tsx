export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-5 w-5', md: 'h-10 w-10', lg: 'h-16 w-16' };
  return (
    <div className="flex items-center justify-center p-8">
      <svg className={`animate-spin ${sizes[size]} text-[#2196F3]`} viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#EAF6FF] to-white">
      <div className="text-4xl font-bold bg-gradient-to-r from-[#4FC3F7] to-[#1976D2] bg-clip-text text-transparent mb-4">
        Our Story
      </div>
      <LoadingSpinner size="md" />
    </div>
  );
}
