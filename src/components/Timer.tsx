import { useState, useEffect } from "react";

interface TimerProps {
    isActive: boolean; // true when puzzle is being played
    resetSignal?: boolean; // toggle this to reset timer when a new puzzle starts
}

export default function Timer({ isActive, resetSignal }: TimerProps) {
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [paused, setPaused] = useState(false);

    // Main timer effect
    useEffect(() => {
        if (!isActive || paused) return;

        const interval = setInterval(() => {
            setSecondsElapsed(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, paused]);

    // Reset timer when resetSignal changes
    useEffect(() => {
        setSecondsElapsed(0);
        setPaused(false);
    }, [resetSignal]);

    const formatTime = (secs: number) => {
        const minutes = Math.floor(secs / 60);
        const seconds = secs % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ marginBottom: 10 }}>
            <div>Timer: {formatTime(secondsElapsed)}</div>
            <div style={{ marginTop: 5 }}>
                <button onClick={() => setPaused(false)} disabled={!paused}>Resume</button>
                <button onClick={() => setPaused(true)} disabled={paused}>Pause</button>
            </div>
        </div>
    );
}
