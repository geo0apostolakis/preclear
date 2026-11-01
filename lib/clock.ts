"use client";

import { useSyncExternalStore } from "react";

/**
 * One shared clock for the whole app.
 *
 * Reading Date.now() during render is impure and makes components disagree with
 * each other, so every "is this expired / how long is left" question reads this
 * instead. Starts at 0 so the server render and the first client render match,
 * then ticks once subscribed.
 */

let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<() => void>();

function tick() {
  now = Date.now();
  subscribers.forEach((fn) => fn());
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (!timer) {
    timer = setInterval(tick, 5000);
    tick();
  }
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getSnapshot = () => now;
const getServerSnapshot = () => 0;

/** Milliseconds since epoch, refreshed every 5 seconds. 0 before hydration. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
