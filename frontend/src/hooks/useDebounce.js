import { useState, useEffect } from "react";

/**
 * useDebounce
 *
 * Delays propagating a value change until the user has stopped
 * changing it for `delay` ms. Use this to avoid running expensive
 * operations (API calls, heavy useMemo filters) on every keystroke.
 *
 * @param {*}      value  - The raw value to debounce (e.g. a search string)
 * @param {number} delay  - Wait time in milliseconds (default: 300ms)
 * @returns The debounced value — only updates after the user pauses typing
 *
 * @example
 *   const [searchTerm, setSearchTerm] = useState("");
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 *
 *   // Use debouncedSearch in useMemo / API calls, NOT searchTerm
 *   const results = useMemo(
 *     () => items.filter(i => i.name.includes(debouncedSearch)),
 *     [items, debouncedSearch]
 *   );
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Start a timer — if value changes again before delay ms, the
    // cleanup function cancels the previous timer (no stale update)
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer); // cancel on every new keystroke
  }, [value, delay]);

  return debouncedValue;
}
