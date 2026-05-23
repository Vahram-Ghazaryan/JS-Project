import { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";

const CANVAS_SIZE = 280;

export default function DigitRecognizer() {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [confidences, setConfidences] = useState([]);
    const [modelStatus, setModelStatus] = useState("idle");
    const [mode, setMode] = useState("draw");
    const [isProcessing, setIsProcessing] = useState(false);
    const lastPos = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const trainServerModel = async () => {
        try {
            setModelStatus("training");
            const res = await fetch('/api/digit-recognizer/train', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setModelStatus("ready");
                alert("Model trained successfully on the server and saved to Server.");
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error(error);
            setModelStatus("error");
            alert("Error training model: " + error.message);
        }
    };

    const getCanvasPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const startDrawing = (e) => {
        if (mode !== "draw") return;
        e.preventDefault();
        setIsDrawing(true);
        lastPos.current = getCanvasPos(e, canvasRef.current);
    };

    const draw = (e) => {
        if (!isDrawing || mode !== "draw") return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const pos = getCanvasPos(e, canvas);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 22;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
    };

    const stopDrawing = async () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        lastPos.current = null;
        await predict();
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setPrediction(null);
        setConfidences([]);
    };

    const predict = useCallback(async () => {
        setIsProcessing(true);
        try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 28;
            tempCanvas.height = 28;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCtx.drawImage(canvasRef.current, 0, 0, 28, 28);

            const imgData = tempCtx.getImageData(0, 0, 28, 28);
            const pixelArray = new Array(28 * 28);
            for (let i = 0; i < 28 * 28; i++) {
                pixelArray[i] = imgData.data[i * 4] / 255.0;
            }

            const res = await fetch('/api/digit-recognizer/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pixelArray })
            });

            const data = await res.json();

            if (res.ok) {
                setPrediction(data.prediction);
                setConfidences(data.confidences);
            } else {
                console.error("Prediction failed:", data.error);
                alert("Prediction failed: " + data.error);
            }
        } catch (error) {
            console.error("Network error:", error);
        }
        setIsProcessing(false);
    }, []);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext("2d");
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                const aspect = img.width / img.height;
                let drawW = CANVAS_SIZE * 0.8;
                let drawH = drawW / aspect;
                if (drawH > CANVAS_SIZE * 0.8) { drawH = CANVAS_SIZE * 0.8; drawW = drawH * aspect; }
                ctx.drawImage(img, (CANVAS_SIZE - drawW) / 2, (CANVAS_SIZE - drawH) / 2, drawW, drawH);
                predict();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    };

    const statusMessages = {
        idle: "Ready to predict. (Click 'Train on Server' if model is missing)",
        training: "Training on server... (this might take a minute)",
        ready: `Model trained and ready in Server`,
        error: "Failed to train or load model",
    };

    const statusColors = {
        idle: "text-gray-400",
        training: "text-purple-400 animate-pulse",
        ready: "text-green-400",
        error: "text-red-400",
    };

    return (
        <>
            <Head><title>Digit Recognizer — Server API</title></Head>
            <div className="min-h-screen bg-gray-950 text-white p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Handwritten Digit Recognition
                        </h1>
                        <p className="text-gray-400 text-sm">CNN deployed on the Next.js API route</p>
                        <div className={`mt-2 text-sm font-medium ${statusColors[modelStatus]}`}>
                            {statusMessages[modelStatus]}
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={trainServerModel}
                                disabled={modelStatus === "training"}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-all"
                            >
                                {modelStatus === "training" ? "Training..." : "Train Model on Server"}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">Only needed once to create the model in Server.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <div className="flex gap-2 mb-4">
                                <button onClick={() => { setMode("draw"); clearCanvas(); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "draw" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                                    Draw
                                </button>
                                <button onClick={() => { setMode("upload"); clearCanvas(); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === "upload" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                                    Upload Photo
                                </button>
                            </div>

                            <div className="relative">
                                <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE}
                                    className="w-full rounded-xl border border-gray-700 touch-none"
                                    style={{ cursor: mode === "draw" ? "crosshair" : "default", background: "black" }}
                                    onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                                />
                                {isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                                        <div className="text-purple-400 text-sm font-medium animate-pulse">Predicting on Server...</div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-3">
                                <button onClick={clearCanvas} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-all">Clear</button>
                                {mode === "upload" && (
                                    <>
                                        <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-all">Choose File</button>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    </>
                                )}
                                {mode === "draw" && (
                                    <button onClick={predict} className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-all">Predict</button>
                                )}
                            </div>
                            {mode === "draw" && <p className="text-xs text-gray-500 text-center mt-2">Draw a digit (0–9) on the canvas above</p>}
                        </div>

                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-widest">Server Prediction</h2>
                            {prediction !== null ? (
                                <>
                                    <div className="flex items-center justify-center mb-6">
                                        <div className="relative">
                                            <div className="w-28 h-28 rounded-full flex items-center justify-center text-6xl font-bold"
                                                style={{ background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)", boxShadow: "0 0 40px rgba(168,85,247,0.4)" }}>
                                                {prediction}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full px-2 py-0.5 text-xs text-green-400 font-medium border border-gray-700">
                                                {(confidences[prediction] * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {confidences.map((conf, idx) => ({ conf, idx }))
                                            .sort((a, b) => b.conf - a.conf)
                                            .map(({ conf, idx }) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <span className={`w-5 text-sm font-bold text-right ${idx === prediction ? "text-purple-400" : "text-gray-500"}`}>{idx}</span>
                                                    <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${conf * 100}%`, background: idx === prediction ? "linear-gradient(90deg, #6366f1, #a855f7)" : "#374151" }} />
                                                    </div>
                                                    <span className={`text-xs w-12 text-right ${idx === prediction ? "text-purple-300" : "text-gray-600"}`}>{(conf * 100).toFixed(1)}%</span>
                                                </div>
                                            ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                                    <div className="text-5xl mb-3">🧠</div>
                                    <p className="text-sm">Draw or upload a digit to see the prediction</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}