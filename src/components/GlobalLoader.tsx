import { useSyncExternalStore } from 'react';
import { isApiLoading, subscribeApiLoading } from '../api/loading';

export default function GlobalLoader() {
  const loading = useSyncExternalStore(subscribeApiLoading, isApiLoading);

  if (!loading) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[600] h-0.5 overflow-hidden bg-lavender-100/60"
      role="progressbar"
      aria-valuetext="Loading"
    >
      <div className="h-full w-2/5 animate-[loader-bar_1.1s_ease-in-out_infinite] rounded-full bg-lavender-600" />
    </div>
  );
}
