import { useState, useCallback, useEffect } from "react";

interface LassoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseLassoSelectionOptions {
  containerRef: React.RefObject<HTMLElement>;
  onSelectionComplete?: (selectedIds: Set<string>) => void;
  onSelectionStart?: () => void;
  itemSelector: string;
  getItemId: (element: Element) => string | null;
  enabled?: boolean;
}

interface UseLassoSelectionResult {
  isLassoActive: boolean;
  lassoRect: LassoRect | null;
  pendingSelectedIds: Set<string>;
  clearSelection: () => void;
}

export function useLassoSelection({
  containerRef,
  onSelectionComplete,
  onSelectionStart,
  itemSelector,
  getItemId,
  enabled = true,
}: UseLassoSelectionOptions): UseLassoSelectionResult {
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);
  const [pendingSelectedIds, setPendingSelectedIds] = useState<Set<string>>(new Set());

  // Calculate lasso rectangle in viewport coordinates (for display)
  const lassoRect: LassoRect | null = lassoStart && lassoEnd ? {
    x: Math.min(lassoStart.x, lassoEnd.x),
    y: Math.min(lassoStart.y, lassoEnd.y),
    width: Math.abs(lassoEnd.x - lassoStart.x),
    height: Math.abs(lassoEnd.y - lassoStart.y),
  } : null;

  // Check if two rectangles intersect
  const rectsIntersect = useCallback((rect1: DOMRect, rect2: { left: number; top: number; right: number; bottom: number }): boolean => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }, []);

  // Update pending selection based on lasso rectangle (visual feedback only)
  const updatePendingSelection = useCallback(() => {
    if (!lassoRect || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    const lassoViewportRect = {
      left: containerRect.left + lassoRect.x,
      top: containerRect.top + lassoRect.y,
      right: containerRect.left + lassoRect.x + lassoRect.width,
      bottom: containerRect.top + lassoRect.y + lassoRect.height,
    };

    const items = container.querySelectorAll(itemSelector);
    const newSelectedIds = new Set<string>();

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      if (rectsIntersect(itemRect, lassoViewportRect)) {
        const id = getItemId(item);
        if (id) {
          newSelectedIds.add(id);
        }
      }
    });

    setPendingSelectedIds(newSelectedIds);
  }, [lassoRect, containerRef, itemSelector, getItemId, rectsIntersect]);

  // Update pending selection whenever lasso changes
  useEffect(() => {
    if (isLassoActive) {
      updatePendingSelection();
    }
  }, [isLassoActive, lassoRect, updatePendingSelection]);

  // Handle all mouse events
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Remove shift key requirement for smoother experience
      // if (!e.shiftKey) return;

      const target = e.target as HTMLElement;
      // Prevent lasso when clicking on interactive elements
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('[role="checkbox"]') ||
        target.closest('[data-radix-collection-item]') ||
        target.closest('[draggable="true"]') ||
        target.closest('.cursor-grab') ||
        target.closest('[data-radix-scroll-area-scrollbar]')
      ) {
        return;
      }

      // Call onSelectionStart to clear existing selection if needed
      if (!isLassoActive) {
        onSelectionStart?.();
      }

      const containerRect = container.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      setLassoStart({ x, y });
      setLassoEnd({ x, y });
      setIsLassoActive(true);
      setPendingSelectedIds(new Set());

      // Don't prevent default immediately to allow click events to propagate
      // Only prevent default if we're actually dragging (handled in mousemove)
      // e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLassoActive || !lassoStart) return;

      const containerRect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - containerRect.left, containerRect.width));
      const y = Math.max(0, Math.min(e.clientY - containerRect.top, containerRect.height));

      // If we moved enough to be considered a drag, consume the event
      if (Math.abs(x - lassoStart.x) > 5 || Math.abs(y - lassoStart.y) > 5) {
        e.preventDefault();
      }

      setLassoEnd({ x, y });
    };

    const handleMouseUp = () => {
      if (isLassoActive) {
        // Finalize selection on mouseup
        if (pendingSelectedIds.size > 0) {
          onSelectionComplete?.(pendingSelectedIds);
        } else {
          // If no items selected (empty click), ensure selection is cleared
          onSelectionComplete?.(new Set());
        }
        setIsLassoActive(false);
        setLassoStart(null);
        setLassoEnd(null);
        setPendingSelectedIds(new Set());
      }
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, containerRef, isLassoActive, lassoStart, pendingSelectedIds, onSelectionComplete]);

  const clearSelection = useCallback(() => {
    setPendingSelectedIds(new Set());
  }, []);

  return {
    isLassoActive,
    lassoRect,
    pendingSelectedIds,
    clearSelection,
  };
}
