import { useState, useCallback, useRef, useEffect } from "react";

interface LassoRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UseLassoSelectionOptions {
  containerRef: React.RefObject<HTMLElement>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  itemSelector: string; // CSS selector for selectable items
  getItemId: (element: Element) => string | null; // Function to extract ID from element
  enabled?: boolean;
}

interface UseLassoSelectionResult {
  isLassoActive: boolean;
  lassoRect: LassoRect | null;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  selectedIds: Set<string>;
  clearSelection: () => void;
}

export function useLassoSelection({
  containerRef,
  onSelectionChange,
  itemSelector,
  getItemId,
  enabled = true,
}: UseLassoSelectionOptions): UseLassoSelectionResult {
  const [isLassoActive, setIsLassoActive] = useState(false);
  const [lassoStart, setLassoStart] = useState<{ x: number; y: number } | null>(null);
  const [lassoEnd, setLassoEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const scrollOffsetRef = useRef({ x: 0, y: 0 });

  // Calculate lasso rectangle
  const lassoRect: LassoRect | null = lassoStart && lassoEnd ? {
    x: Math.min(lassoStart.x, lassoEnd.x),
    y: Math.min(lassoStart.y, lassoEnd.y),
    width: Math.abs(lassoEnd.x - lassoStart.x),
    height: Math.abs(lassoEnd.y - lassoStart.y),
  } : null;

  // Check if two rectangles intersect
  const rectsIntersect = useCallback((rect1: DOMRect, rect2: LassoRect): boolean => {
    return !(
      rect1.right < rect2.x ||
      rect1.left > rect2.x + rect2.width ||
      rect1.bottom < rect2.y ||
      rect1.top > rect2.y + rect2.height
    );
  }, []);

  // Update selection based on lasso rectangle
  const updateSelection = useCallback(() => {
    if (!lassoRect || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
    const scrollTop = scrollArea?.scrollTop || 0;
    const scrollLeft = scrollArea?.scrollLeft || 0;

    // Adjust lasso rect to account for scroll
    const adjustedLassoRect: LassoRect = {
      x: lassoRect.x + containerRect.left,
      y: lassoRect.y + containerRect.top,
      width: lassoRect.width,
      height: lassoRect.height,
    };

    const items = container.querySelectorAll(itemSelector);
    const newSelectedIds = new Set<string>();

    items.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      if (rectsIntersect(itemRect, adjustedLassoRect)) {
        const id = getItemId(item);
        if (id) {
          newSelectedIds.add(id);
        }
      }
    });

    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  }, [lassoRect, containerRef, itemSelector, getItemId, onSelectionChange, rectsIntersect]);

  // Update selection whenever lasso changes
  useEffect(() => {
    if (isLassoActive) {
      updateSelection();
    }
  }, [isLassoActive, lassoRect, updateSelection]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    
    // Only activate with Shift key held
    if (!e.shiftKey) return;
    
    // Don't activate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('[role="checkbox"]') ||
      target.closest('[data-radix-collection-item]') ||
      target.closest('[draggable="true"]') ||
      target.closest('.cursor-grab')
    ) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
    const scrollTop = scrollArea?.scrollTop || 0;
    const scrollLeft = scrollArea?.scrollLeft || 0;

    // Calculate position relative to container, accounting for scroll
    const x = e.clientX - containerRect.left + scrollLeft;
    const y = e.clientY - containerRect.top + scrollTop;

    scrollOffsetRef.current = { x: scrollLeft, y: scrollTop };
    setLassoStart({ x, y });
    setLassoEnd({ x, y });
    setIsLassoActive(true);
    setSelectedIds(new Set());
    
    e.preventDefault();
  }, [enabled, containerRef]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isLassoActive || !lassoStart) return;

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
    const scrollTop = scrollArea?.scrollTop || 0;
    const scrollLeft = scrollArea?.scrollLeft || 0;

    // Calculate position relative to container, accounting for scroll
    const x = e.clientX - containerRect.left + scrollLeft;
    const y = e.clientY - containerRect.top + scrollTop;

    setLassoEnd({ x, y });
  }, [isLassoActive, lassoStart, containerRef]);

  const handleMouseUp = useCallback(() => {
    if (isLassoActive) {
      setIsLassoActive(false);
      setLassoStart(null);
      setLassoEnd(null);
    }
  }, [isLassoActive]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  // Handle mouse up globally to catch mouseup outside container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isLassoActive) {
        setIsLassoActive(false);
        setLassoStart(null);
        setLassoEnd(null);
      }
    };

    if (isLassoActive) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isLassoActive]);

  return {
    isLassoActive,
    lassoRect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    selectedIds,
    clearSelection,
  };
}
