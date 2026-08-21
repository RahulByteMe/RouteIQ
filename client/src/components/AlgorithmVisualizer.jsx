import { useState, useEffect } from "react";

// ─── AlgorithmVisualizer Component ─────────────────────────────────────────
//
// WHAT IT DOES:
//   An interactive playback controller that lets the user step through each
//   2-Opt improvement step in slow motion.
//   Reviewers can watch crossing route segments untangle live on the map!
// ───────────────────────────────────────────────────────────────────────────

function AlgorithmVisualizer({ steps, onClose, onStepSelect }) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const totalSteps = steps.length;
    const currentStep = steps[currentStepIndex] || steps[0];

    // Whenever currentStepIndex changes, notify parent to update map polyline
    useEffect(() => {
        if (currentStep && onStepSelect) {
            onStepSelect(currentStep);
        }
    }, [currentStepIndex, currentStep, onStepSelect]);

    // Auto-play effect
    useEffect(() => {
        if (!isPlaying) return;

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
        <div className="absolute top-4 left-4 right-4 z-[1000] max-w-xl mx-auto bg-gray-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-gray-700/80 p-4 transition-all">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-base">🧬</span>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400">
                            2-Opt Optimization Visualizer
                        </h4>
                        <p className="text-[11px] text-gray-400">
                            Step {currentStepIndex + 1} of {totalSteps}
                        </p>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                    title="Close Visualizer"
                >
                    ✕
                </button>
            </div>

            {/* Step Explanation Banner */}
            <div className="bg-gray-800/80 rounded-xl p-3 mb-3 border border-gray-700/50">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-400">
                        {currentStep.type === "initial" ? "🏁 Initial Nearest-Neighbor Tour" : `🔄 2-Opt Swap #${currentStepIndex}`}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-200">
                        {Math.round(currentStep.distance * 100) / 100} km
                    </span>
                </div>
                <p className="text-xs text-gray-300">
                    {currentStep.description}
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
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                    ↺ Reset
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        ⏮ Prev
                    </button>

                    <button
                        onClick={handleTogglePlay}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow transition-all flex items-center gap-1.5"
                    >
                        <span>{isPlaying ? "⏸ Pause" : "▶️ Play"}</span>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={currentStepIndex === totalSteps - 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        Next ⏭
                    </button>
                </div>

                <div className="text-[11px] text-gray-500">
                    Auto-play: 1.2s
                </div>
            </div>

        </div>
    );
}

export default AlgorithmVisualizer;
