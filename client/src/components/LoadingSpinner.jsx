// 1. Base Skeleton (Shimmer Effect)
export const Skeleton = ({ className = "", ...props }) => (
  <div
    className={`bg-gradient-to-r from-navy-800 via-navy-700 to-navy-800 animate-pulse rounded-md ${className}`}
    {...props}
  />
);

// 2. Ticket Card Skeleton
export const TicketSkeleton = () => (
  <div className="bg-navy-800 rounded-xl p-4 border border-navy-700 space-y-3 shadow-sm">
    <div className="flex justify-between">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-3 w-full" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-6 w-16 rounded" />
      <Skeleton className="h-6 w-8 rounded-full ml-auto" />
    </div>
  </div>
);

// 3. Circular Spinner
export default function LoadingSpinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-navy-700 border-t-primary rounded-full animate-spin`}
      />
    </div>
  );
}
