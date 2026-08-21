import { useState, useEffect, useRef, useCallback } from "react";

// ─── AlgorithmVisualizer Component (Draggable & Interactive) ────────────────
//
// WHAT IT DOES:
//   An interactive playback controller that lets the user step through each
//   2-Opt improvement step in slow motion.
//   Movable & draggable across the map so it never obstructs route polyline!
// ───────────────────────────────────────────────────────────────────────────

function AlgorithmVisualizer({ isOpen = false, steps = [], onClose, onSelectStep }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // Draggable position state
    const [position, setPosition] = useState({ x: window.innerWidth > 900 ? 420 : 20, y: 70 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffsetRef = useRef({ x: 0, y: 0 });

    const totalSteps = steps.length;
    const currentStep = steps[currentStepIndex] || steps[0];

    // Whenever currentStepIndex changes, notify parent to update map polyline
    useEffect(() => {
        if (currentStep && onSelectStep) {
            onSelectStep(currentStep);
        }
    }, [currentStepIndex, currentStep, onSelectStep]);

    // Auto-play effect
    useEffect(() => {
        if (!isPlaying || totalSteps === 0) return;

        const interval = setInterval(() => {
            setCurrentStepIndex((prev) => {
                if (prev >= totalSteps - 1) {
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, 1200);

        return () => clearInterval(interval);
    }, [isPlaying, totalSteps]);

    // Pointer Drag Handlers
    const handlePointerDown = useCallback((e) => {
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
        const newX = Math.max(10, Math.min(window.innerWidth - 420, e.clientX - dragOffsetRef.current.x));
        const newY = Math.max(60, Math.min(window.innerHeight - 150, e.clientY - dragOffsetRef.current.y));
        setPosition({ x: newX, y: newY });
    }, [isDragging]);

    const handlePointerUp = useCallback((e) => {
        if (isDragging) {
            setIsDragging(false);
            try {
                e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
                // Ignore
            }
        }
    }, [isDragging]);

    // Do not render anything if not open or no steps available
    if (!isOpen || totalSteps === 0 || !currentStep) {
        return null;
    }

    function handlePrev() {
        setIsPlaying(false);
        setCurrentStepIndex((prev) => Math.max(0, prev - 1));
    }

    function handleNext() {
        setIsPlaying(false);
        setCurrentStepIndex((prev) => Math.min(totalSteps - 1, prev + 1));
    }

    function handleTogglePlay() {
        if (currentStepIndex >= totalSteps - 1) {
            setCurrentStepIndex(0);
        }
        setIsPlaying((prev) => !prev);
    }

    function handleReset() {
        setIsPlaying(false);
        setCurrentStepIndex(0);
    }

    return (
        <div
            style={{
                position: "fixed",
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: isDragging ? 1200 : 1050
            }}
            className="select-none max-w-lg w-[440px] transition-shadow"
        >
            <div className="bg-gray-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-gray-700/80 p-4">
                
                {/* ── DRAGGABLE HEADER ── */}
                <div
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-3 cursor-move group hover:bg-gray-950/40 rounded-lg p-1 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <span className="text-base select-none">🔬</span>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                                2-Opt Optimization Visualizer
                            </h4>
                            <p className="text-[10px] text-gray-400">
                                Step {currentStepIndex + 1} of {totalSteps} • <span className="text-gray-500">Drag to move</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-600 text-xs tracking-tighter opacity-60 group-hover:opacity-100 mr-1">
                            ⋮⋮
                        </span>
                        <button
                            onClick={onClose}
                            className="w-6 h-6 rounded-md bg-gray-800 hover:bg-rose-900/60 text-gray-400 hover:text-rose-300 text-xs flex items-center justify-center transition-colors cursor-pointer"
                            title="Close Visualizer"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Step Explanation Banner */}
                <div className="bg-gray-800/80 rounded-xl p-3 mb-3 border border-gray-700/50">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-emerald-400">
                            {currentStep.type === "initial" ? "🏁 Initial Nearest-Neighbor Tour" : `🔄 2-Opt Swap #${currentStepIndex}`}
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-200">
                            {Math.round((currentStep.distance || 0) * 100) / 100} km
                        </span>
                    </div>
                    <p className="text-xs text-gray-300">
                        {currentStep.description || "Iterative 2-Opt local search untangling crossing edges."}
                    </p>
                </div>

                {/* Progress Scrub Bar */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
                        />
                    </div>
                    <span className="text-[11px] font-mono text-gray-400">
                        {currentStepIndex + 1}/{totalSteps}
                    </span>
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={handleReset}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        ↺ Reset
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={currentStepIndex === 0}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            ⏮ Prev
                        </button>

                        <button
                            onClick={handleTogglePlay}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>{isPlaying ? "⏸ Pause" : "▶️ Play"}</span>
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={currentStepIndex === totalSteps - 1}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            Next ⏭
                        </button>
                    </div>

                    <div className="text-[10px] text-gray-500">
                        Auto-play: 1.2s
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AlgorithmVisualizer;
