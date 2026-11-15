'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { moveItem } from '@/lib/habits/order';

// Drag-to-reorder for a list or grid of cards, without a library.
//
// - Dragging starts from a handle only (touch-action: none on the handle), after the pointer has
//   moved a few pixels; a plain tap on the handle is reported as a tap instead.
// - The dragged card follows the pointer; the others slide to their new places (FLIP animation).
// - A card swaps places once the dragged card's centre passes the middle of another card, which
//   keeps cards of different heights from swapping back and forth.
// - Near the top or bottom of the screen the page scrolls, so long lists can be reordered.
// - Arrow keys on a focused handle move the card one place (the keyboard alternative).
// The new order is reported once, when the drag ends.

const START_AFTER_PX = 6;
const SETTLE_MS = 230;
const EDGE_PX = 84;
const MAX_SCROLL_PER_FRAME = 16;

interface DragState {
  id: string;
  pointerId: number;
  startX: number;
  startY: number;
  /** Pointer position inside the card when the drag started. */
  offX: number;
  offY: number;
  w: number;
  h: number;
  x: number;
  y: number;
  active: boolean;
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * @param onCommit called once with the new order (all ids) after a drag or a move
 * @param onTap    a tap (or Enter/Space) on a handle without dragging
 * @param onMoved  after any move: the card and its new index, for announcements and focus
 */
export function useDragReorder(
  ids: string[],
  onCommit: (ids: string[]) => void,
  onTap?: (id: string) => void,
  onMoved?: (id: string, index: number) => void,
) {
  const [order, setOrder] = useState<string[]>(ids);
  const [dragId, setDragId] = useState<string | null>(null);
  const orderRef = useRef(order);
  const drag = useRef<DragState | null>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const settleUntil = useRef(new Map<string, number>());
  const before = useRef<Map<string, DOMRect> | null>(null);
  /** Page position of the dragged card's own slot (without the drag transform). */
  const slot = useRef({ left: 0, top: 0 });
  const raf = useRef(0);

  // Follow changes from outside (habits added or removed) while nothing is being dragged.
  const idsKey = ids.join('\u0000');
  useEffect(() => {
    if (drag.current?.active) return;
    orderRef.current = ids;
    setOrder(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const itemRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(id, el); else els.current.delete(id);
  }, []);

  const measureSlot = (id: string) => {
    const el = els.current.get(id);
    if (!el) return;
    const t = el.style.transform;
    el.style.transform = '';
    const r = el.getBoundingClientRect();
    slot.current = { left: r.left + window.scrollX, top: r.top + window.scrollY };
    el.style.transform = t;
  };

  const placeDragged = () => {
    const d = drag.current;
    const el = d && els.current.get(d.id);
    if (!d || !el) return;
    const tx = d.x + window.scrollX - d.offX - slot.current.left;
    const ty = d.y + window.scrollY - d.offY - slot.current.top;
    el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(1.02)`;
  };

  // After a swap: slide every other card from where it was to its new place, then re-place the
  // dragged card relative to its new slot.
  useLayoutEffect(() => {
    const first = before.current;
    before.current = null;
    if (first && !reducedMotion()) {
      const now = performance.now();
      els.current.forEach((el, id) => {
        if (id === drag.current?.id) return;
        const a = first.get(id);
        if (!a) return;
        const b = el.getBoundingClientRect();
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        if (!dx && !dy) return;
        el.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: 200, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        );
        settleUntil.current.set(id, now + SETTLE_MS);
      });
    }
    if (drag.current?.active) { measureSlot(drag.current.id); placeDragged(); }
  }, [order]);

  const hitTest = () => {
    const d = drag.current;
    if (!d?.active) return;
    const cur = orderRef.current;
    const from = cur.indexOf(d.id);
    const cx = d.x - d.offX + d.w / 2;
    const cy = d.y - d.offY + d.h / 2;
    const slotCx = slot.current.left - window.scrollX + d.w / 2;
    const slotCy = slot.current.top - window.scrollY + d.h / 2;
    const now = performance.now();
    for (const [id, el] of els.current) {
      if (id === d.id || (settleUntil.current.get(id) ?? 0) > now) continue;
      const r = el.getBoundingClientRect();
      if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) continue;
      const to = cur.indexOf(id);
      if (to < 0 || to === from) return;
      const mx = r.left + r.width / 2;
      const my = r.top + r.height / 2;
      // Compare along the axis the two slots are mainly apart on (rows in a list, columns in a row).
      const horizontal = Math.abs(mx - slotCx) > Math.abs(my - slotCy);
      const passed = to > from ? (horizontal ? cx > mx : cy > my) : (horizontal ? cx < mx : cy < my);
      if (!passed) return;
      const rects = new Map<string, DOMRect>();
      els.current.forEach((e, k) => rects.set(k, e.getBoundingClientRect()));
      before.current = rects;
      const next = moveItem(cur, from, to);
      orderRef.current = next;
      setOrder(next);
      return;
    }
  };

  // Scroll the page while the card is held near the top or bottom edge.
  const autoScroll = () => {
    const d = drag.current;
    if (!d?.active) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-h')) || 0;
    const top = EDGE_PX;
    const bottom = window.innerHeight - navH - EDGE_PX;
    let dy = 0;
    if (d.y < top) dy = -Math.ceil(((top - d.y) / EDGE_PX) * MAX_SCROLL_PER_FRAME);
    else if (d.y > bottom) dy = Math.ceil(((d.y - bottom) / EDGE_PX) * MAX_SCROLL_PER_FRAME);
    if (dy) {
      const y0 = window.scrollY;
      window.scrollBy(0, Math.max(-MAX_SCROLL_PER_FRAME, Math.min(MAX_SCROLL_PER_FRAME, dy)));
      if (window.scrollY !== y0) { placeDragged(); hitTest(); }
    }
    raf.current = requestAnimationFrame(autoScroll);
  };

  const finish = (commit: boolean) => {
    const d = drag.current;
    drag.current = null;
    cancelAnimationFrame(raf.current);
    if (!d) return;
    if (!d.active) { if (commit) onTap?.(d.id); return; }
    const el = els.current.get(d.id);
    if (el) {
      const from = el.style.transform;
      el.style.transform = '';
      if (from && !reducedMotion()) {
        el.animate([{ transform: from }, { transform: 'none' }], { duration: 180, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' });
      }
    }
    setDragId(null);
    const next = orderRef.current;
    if (next.join('\u0000') !== ids.join('\u0000')) { onCommit(next); onMoved?.(d.id, next.indexOf(d.id)); }
  };

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  /** Props for a card's drag handle (a button). */
  const handleProps = (id: string) => ({
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.button !== 0 || drag.current) return;
      const el = els.current.get(id);
      if (!el) return;
      const r = el.getBoundingClientRect();
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = {
        id, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY,
        offX: e.clientX - r.left, offY: e.clientY - r.top, w: r.width, h: r.height,
        x: e.clientX, y: e.clientY, active: false,
      };
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      d.x = e.clientX;
      d.y = e.clientY;
      if (!d.active) {
        if (Math.hypot(d.x - d.startX, d.y - d.startY) < START_AFTER_PX) return;
        d.active = true;
        setDragId(d.id);
        measureSlot(d.id);
        raf.current = requestAnimationFrame(autoScroll);
      }
      e.preventDefault();
      placeDragged();
      hitTest();
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => { if (drag.current?.pointerId === e.pointerId) finish(true); },
    onPointerCancel: (e: PointerEvent<HTMLElement>) => { if (drag.current?.pointerId === e.pointerId) finish(false); },
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const delta = e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : 0;
      if (!delta) return;
      e.preventDefault();
      move(id, delta);
    },
    // A click from the keyboard (Enter/Space) toggles the move buttons, like a tap.
    onClick: (e: { detail: number }) => { if (e.detail === 0) onTap?.(id); },
    style: { touchAction: 'none' as const },
  });

  /** Moves a card one or more places and saves the new order (keyboard and move buttons). */
  const move = (id: string, delta: number) => {
    const cur = orderRef.current;
    const from = cur.indexOf(id);
    const to = Math.max(0, Math.min(cur.length - 1, from + delta));
    if (from < 0 || to === from) return null;
    const rects = new Map<string, DOMRect>();
    els.current.forEach((e, k) => rects.set(k, e.getBoundingClientRect()));
    before.current = rects;
    const next = moveItem(cur, from, to);
    orderRef.current = next;
    setOrder(next);
    onCommit(next);
    onMoved?.(id, to);
    return to;
  };

  return { order, dragId, itemRef, handleProps, move };
}
