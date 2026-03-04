import { useEffect, useRef } from "react";

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      "a[href],button:not([disabled]),textarea,input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])"
    )
  ).filter((node) => !node.hasAttribute("aria-hidden"));
}

export function useFocusContainment(active: boolean) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) {
      return;
    }
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusable = getFocusable(container);
    if (focusable.length > 0) {
      focusable[0]?.focus();
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key !== "Tab") {
        return;
      }
      const nodes = getFocusable(container);
      if (nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;
      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
      previouslyFocused?.focus?.();
    };
  }, [active]);

  return containerRef;
}

