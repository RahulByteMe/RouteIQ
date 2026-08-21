import { useState, useRef, useCallback } from "react";

// ─── Draggable & Minimizable Map Overlay Widget ───────────────────────────
//
// WHAT IT DOES:
//   Wraps floating map HUD components (RouteSummary, AlgorithmBenchmark)
//   allowing users to:
//   1. Click and drag the header anywhere across the map canvas.
//   2. Minimize into a compact single-line chip so routes are never obscured.
//   3. Close / hide with 1 click.
// ───────────────────────────────────────────────────────────────────────────

export function DraggableWidget({
    title,
    icon = "📊",
    badge = null,
    defaultPosition = { x: 20, y: 70 },
    isMinimizedDefault = false,
    isOpen = true,
    onClose,
    children
}) {
    const [isMinimized, setIsMinimized] = useState(isMinimizedDefault);
    const [position, setPosition] = useState(defaultPosition);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    // Handle drag start
    const handlePointerDown = useCallback((e) => {
        // Only trigger drag if clicked on the header or handle (not buttons)
        if (e.target.closest("button") || e.target.closest("input")) return;

        setIsDragging(true);
        dragOffsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [position]);

    const handlePointerMove = useCallback((e) => {
        if (!isDragging) return;
        
        // Calculate new position within window bounds
        const newX = Math.max(10, Math.min(window.innerWidth - 320, e.clientX - dragOffsetRef.current.x));
        const newY = Math.max(60, Math.min(window.innerHeight - 100, e.clientY - dragOffsetRef.current.y));
        
        setPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handlePointerUp = useCallback((e) => {
        if (isDragging) {
            setIsDragging(false);
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                // Ignore if already released
            }
        }
    }, [isDragging]);

    if (!isOpen) return null;

    return (
        <div
            ref={dragRef}
            style={{
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: isDragging ? 1100 : 1000
            }}
            className={`transition-shadow select-none ${
                isDragging ? "shadow-2xl opacity-95 scale-[1.01]" : "shadow-xl"
            }`}
        >
            <div className="bg-gray-900/95 border border-gray-700/80 rounded-2xl overflow-hidden backdrop-blur-md text-white shadow-2xl max-w-sm w-[340px]">
                
                {/* ── DRAGGABLE HEADER ── */}
                <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="px-3.5 py-2.5 bg-gray-950/90 border-b border-gray-800 flex items-center justify-between cursor-move group hover:bg-gray-950 transition-colors"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm select-none">{icon}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-200 truncate">
                            {title}
                        </span>
                        {badge && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                                {badge}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        {/* Drag Indicator dots */}
                        <span className="text-gray-600 text-xs tracking-tighter opacity-60 group-hover:opacity-100 mr-1">
                            ⋮⋮
                        </span>

                        {/* Minimize / Expand Toggle */}
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-6 h-6 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
                            title={isMinimized ? "Expand Widget" : "Minimize Widget"}
                        >
                            {isMinimized ? "□" : "—"}
                        </button>

                        {/* Close / Hide Button */}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="w-6 h-6 rounded-md bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 text-xs flex items-center justify-center transition-colors cursor-pointer"
                                title="Hide Widget"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* ── WIDGET CONTENT (Hidden when minimized) ── */}
                {!isMinimized && (
                    <div className="p-3.5 max-h-[70vh] overflow-y-auto">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}

export default DraggableWidget;
