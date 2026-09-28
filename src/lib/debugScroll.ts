/**
 * TEMPORARY. An on-screen log of what the browser does when the college list
 * is dragged, to diagnose the Android scroll bug from a screenshot. Only runs
 * when the page is opened with ?debug=scroll. Taps pass straight through it
 * and every listener is passive, so it cannot change the behaviour it logs.
 * Delete this file and its call in main.tsx once the bug is fixed.
 */
export function installScrollDebug(): void {
  if (new URLSearchParams(window.location.search).get('debug') !== 'scroll') return;

  const panel = document.createElement('pre');
  panel.style.cssText =
    'position:fixed;left:0;right:0;top:0;z-index:99999;margin:0;padding:4px 6px;' +
    'max-height:28vh;overflow:hidden;background:rgba(0,0,0,.85);color:#7fffa0;' +
    'font:10px/1.3 monospace;white-space:pre-wrap;word-break:break-all;pointer-events:none;';
  document.body.appendChild(panel);

  const lines: string[] = [];
  const log = (line: string) => {
    lines.push(line);
    if (lines.length > 16) lines.shift();
    panel.textContent = lines.join('\n');
  };

  const listEl = () => document.querySelector<HTMLElement>('.combo-list');
  const screenEl = () => document.querySelector<HTMLElement>('.screen');
  const vvTop = () => Math.round(window.visualViewport?.offsetTop ?? 0);
  const desc = (target: EventTarget | null): string => {
    if (!(target instanceof Element)) return target === document ? 'document' : String(target);
    const cls = target.classList[0];
    return target.tagName.toLowerCase() + (cls ? '.' + cls : '');
  };
  const top = (el: HTMLElement | null) => (el ? Math.round(el.scrollTop) : '-');

  const ua = navigator.userAgent;
  const chrome = /Chrome\/(\d+)/.exec(ua)?.[1] ?? '?';
  const android = /Android ([\d.]+)/.exec(ua)?.[1] ?? '?';
  log(
    `DEBUG scroll. Screenshot me. Chrome ${chrome} Android ${android} ` +
      `${innerWidth}x${innerHeight} dpr${devicePixelRatio}`,
  );

  // The list opening/closing, and whether it is actually taller than its box.
  let listWasOpen = false;
  new MutationObserver(() => {
    const list = listEl();
    if (list && !listWasOpen) {
      const chain: string[] = [];
      for (let el: Element | null = list; el; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (cs.touchAction !== 'auto' || (cs.overflowY !== 'visible' && el !== list)) {
          chain.push(`${desc(el)}[${cs.touchAction},${cs.overflowY}]`);
        }
      }
      const lcs = getComputedStyle(list);
      log(
        `LIST OPEN sh${list.scrollHeight} ch${list.clientHeight} ` +
          `list[${lcs.touchAction},${lcs.overflowY}] ${chain.join(' ')}`,
      );
    }
    if (!list && listWasOpen) log('LIST CLOSED');
    listWasOpen = !!list;
  }).observe(document.body, { childList: true, subtree: true });

  // Keyboard: the visual viewport shrinks when it opens.
  let vvHeight = Math.round(window.visualViewport?.height ?? innerHeight);
  let vvTimer = 0;
  window.visualViewport?.addEventListener('resize', () => {
    window.clearTimeout(vvTimer);
    vvTimer = window.setTimeout(() => {
      const h = Math.round(window.visualViewport?.height ?? innerHeight);
      if (h !== vvHeight) log(`VIEWPORT h${vvHeight}->${h} (keyboard ${h < vvHeight ? 'up' : 'down'})`);
      vvHeight = h;
    }, 250);
  });

  document.addEventListener('focusin', (e) => log(`focus ${desc(e.target)}`), true);
  document.addEventListener('focusout', (e) => log(`blur ${desc(e.target)}`), true);
  document.addEventListener('click', (e) => log(`click ${desc(e.target)}`), true);

  // One summary line per finger-drag.
  type Gesture = {
    n: number;
    y0: number;
    y: number;
    moves: number;
    cancelable: number;
    prevented: boolean;
    pointerCancel: boolean;
    target: string;
    hit: string;
    list0: number | string;
    screen0: number | string;
    vv0: number;
    scrolls: Record<string, number>;
  };
  let gesture: Gesture | null = null;
  let count = 0;
  const opts = { capture: true, passive: true } as const;

  document.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      gesture = {
        n: ++count,
        y0: t.clientY,
        y: t.clientY,
        moves: 0,
        cancelable: 0,
        prevented: false,
        pointerCancel: false,
        target: desc(e.target),
        hit: desc(document.elementFromPoint(t.clientX, t.clientY)),
        list0: top(listEl()),
        screen0: top(screenEl()),
        vv0: vvTop(),
        scrolls: {},
      };
    },
    opts,
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!gesture) return;
      gesture.moves++;
      if (e.cancelable) gesture.cancelable++;
      gesture.y = e.touches[0]?.clientY ?? gesture.y;
    },
    opts,
  );
  // Bubble phase on window runs last, so this sees anything else's preventDefault.
  window.addEventListener(
    'touchmove',
    (e) => {
      if (gesture && e.defaultPrevented) gesture.prevented = true;
    },
    { passive: true },
  );
  document.addEventListener(
    'pointercancel',
    () => {
      if (gesture) gesture.pointerCancel = true;
    },
    opts,
  );
  document.addEventListener(
    'scroll',
    (e) => {
      if (!gesture) return;
      const key = desc(e.target);
      gesture.scrolls[key] = (gesture.scrolls[key] ?? 0) + 1;
    },
    opts,
  );

  const finish = (kind: string) => () => {
    const g = gesture;
    gesture = null;
    if (!g) return;
    // Measured a moment later so momentum scrolling is included.
    window.setTimeout(() => {
      const scrolls = Object.entries(g.scrolls)
        .map(([k, v]) => `${k}:${v}`)
        .join(' ');
      log(
        `#${g.n} ${kind} ${g.target}${g.hit !== g.target ? ` hit=${g.hit}` : ''} ` +
          `moves${g.moves}(c${g.cancelable}) dy${Math.round(g.y - g.y0)} ` +
          `list ${g.list0}->${top(listEl())} screen ${g.screen0}->${top(screenEl())} ` +
          `vv ${g.vv0}->${vvTop()}` +
          `${g.pointerCancel ? ' PCANCEL' : ''}${g.prevented ? ' PREVENTED' : ''}` +
          `${scrolls ? ' scrolled[' + scrolls + ']' : ' scrolled[none]'}`,
      );
    }, 400);
  };
  document.addEventListener('touchend', finish('end'), opts);
  document.addEventListener('touchcancel', finish('CANCEL'), opts);
}
