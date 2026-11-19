/**
 * The web shell is height: 100% with body overflow hidden (Expo's reset).
 * Android Chrome can shrink that layout when the keyboard opens
 * (interactive-widget=resizes-content). iPhone Safari does not: the keyboard
 * covers the page and the layout stays full height, so a clipped form cannot
 * be scrolled. Pin the app to the visible viewport while the keyboard is up.
 */

const KEYBOARD_THRESHOLD = 80;

function scrollFieldIntoView(field: HTMLElement): void {
  let node: HTMLElement | null = field.parentElement;
  while (node && node !== document.body) {
    const overflow = getComputedStyle(node).overflowY;
    if (
      (overflow === 'auto' || overflow === 'scroll') &&
      node.scrollHeight > node.clientHeight + 2
    ) {
      const fieldRect = field.getBoundingClientRect();
      const frame = node.getBoundingClientRect();
      const margin = 20;
      if (fieldRect.bottom > frame.bottom - margin) {
        node.scrollTop += fieldRect.bottom - (frame.bottom - margin);
      } else if (fieldRect.top < frame.top + margin) {
        node.scrollTop -= frame.top + margin - fieldRect.top;
      }
      return;
    }
    node = node.parentElement;
  }
}

export function installKeyboardViewport(): () => void {
  if (typeof window === 'undefined' || !window.visualViewport) {
    return () => undefined;
  }
  const root = document.getElementById('root');
  const viewport = window.visualViewport;
  if (!root || !viewport) return () => undefined;

  let last = '';
  let frame = 0;

  const apply = () => {
    const inset = Math.max(
      0,
      Math.round(window.innerHeight - viewport.height - viewport.offsetTop),
    );
    const top = Math.round(viewport.offsetTop);
    const height = Math.round(viewport.height);
    const keyboard = inset >= KEYBOARD_THRESHOLD;
    const signature = keyboard ? `${top}|${height}` : 'closed';
    if (signature === last) return;
    last = signature;
    if (!keyboard) {
      root.style.position = '';
      root.style.top = '';
      root.style.left = '';
      root.style.right = '';
      root.style.width = '';
      root.style.height = '';
      return;
    }
    root.style.position = 'absolute';
    root.style.left = '0';
    root.style.right = '0';
    root.style.width = '100%';
    root.style.top = `${top}px`;
    root.style.height = `${height}px`;
  };

  const schedule = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      apply();
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active.matches('input, textarea')
      ) {
        scrollFieldIntoView(active);
      }
    });
  };

  const onFocus = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.matches('input, textarea')) {
      return;
    }
    schedule();
    window.setTimeout(schedule, 320);
  };

  viewport.addEventListener('resize', schedule);
  viewport.addEventListener('scroll', schedule);
  document.addEventListener('focusin', onFocus);
  window.addEventListener('orientationchange', schedule);

  return () => {
    viewport.removeEventListener('resize', schedule);
    viewport.removeEventListener('scroll', schedule);
    document.removeEventListener('focusin', onFocus);
    window.removeEventListener('orientationchange', schedule);
    if (frame) window.cancelAnimationFrame(frame);
    root.style.position = '';
    root.style.top = '';
    root.style.left = '';
    root.style.right = '';
    root.style.width = '';
    root.style.height = '';
  };
}
