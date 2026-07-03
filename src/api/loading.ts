let pending = 0;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((cb) => cb());
}

export function subscribeApiLoading(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isApiLoading() {
  return pending > 0;
}

export function startApiLoading() {
  pending += 1;
  notify();
}

export function stopApiLoading() {
  pending = Math.max(0, pending - 1);
  notify();
}
