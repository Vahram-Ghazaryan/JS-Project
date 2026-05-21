import { useEffect, useRef, useState, useCallback } from "react";
import Head from "next/head";

const EXCLUSIONS = [
    "hot dog", "hotdog", "prairie dog", "polecat", "caterpillar",
    "catamaran", "tiger shark", "tiger beetle", "tiger snake", "tiger moth",
];

const CAT_INDICATORS = [
    "tabby", "tiger cat", "persian cat", "siamese", "egyptian cat",
    "lynx", "cougar", "puma", "snow leopard", "leopard", "jaguar",
    "lion", "tiger", "cheetah", "panther", "catamount", "mountain lion",
];

const DOG_INDICATORS = [
    "chihuahua", "spaniel", "maltese", "pekinese", "shih-tzu", "papillon",
    "terrier", "rhodesian", "afghan", "basset", "beagle", "bloodhound",
    "bluetick", "coonhound", "walker hound", "foxhound", "redbone",
    "borzoi", "wolfhound", "greyhound", "whippet", "ibizan", "elkhound",
    "otterhound", "saluki", "deerhound", "weimaraner", "staffordshire",
    "airedale", "cairn", "dandie dinmont", "boston bull", "schnauzer",
    "lhasa", "retriever", "pointer", "setter", "kuvasz", "schipperke",
    "groenendael", "malinois", "briard", "kelpie", "komondor", "sheepdog",
    "collie", "bouvier", "rottweiler", "german shepherd", "doberman",
    "pinscher", "mountain dog", "appenzeller", "entlebucher", "boxer",
    "mastiff", "bulldog", "great dane", "saint bernard", "eskimo dog",
    "malamute", "husky", "dalmatian", "affenpinscher", "basenji", "pug",
    "leonberg", "newfoundland", "great pyrenees", "samoyed", "pomeranian",
    "chow", "keeshond", "brabancon", "pembroke", "cardigan", "poodle",
    "mexican hairless", "dingo", "african hunting dog", "vizsla", "clumber",
    "sussex", "labrador", "chesapeake", "springer", "brittany",
];

function matchAnimal(className) {
    const lower = className.toLowerCase();
    for (const e of EXCLUSIONS) if (lower.includes(e)) return null;
    for (const c of CAT_INDICATORS) if (lower.includes(c)) return "cat";
    for (const d of DOG_INDICATORS) if (lower.includes(d)) return "dog";
    return null;
}

const ARCH_LAYERS = [
    { name: "Input", units: "224×224", color: "#10b981" },
    { name: "Conv2D", units: "32", color: "#14b8a6" },
    { name: "Bottleneck", units: "×17", color: "#06b6d4" },
    { name: "Conv2D", units: "1280", color: "#0ea5e9" },
    { name: "AvgPool", units: "1×1", color: "#6366f1" },
    { name: "Dense", units: "1000", color: "#8b5cf6" },
];


export default function CatDogClassifier() {
    const [modelStatus, setModelStatus] = useState("loading");
    const [modelRef, setModelRef] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [previewSrc, setPreviewSrc] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [webcamActive, setWebcamActive] = useState(false);

    const fileInputRef = useRef(null);
    const imgRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        const loadScript = (src) =>
            new Promise((resolve, reject) => {
                const s = document.createElement("script");
                s.src = src;
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });

        const boot = async () => {
            try {
                if (!window.tf)
                    await loadScript(
                        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"
                    );
                if (!window.mobilenet)
                    await loadScript(
                        "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0"
                    );

                setModelStatus("downloading");
                const model = await window.mobilenet.load({
                    version: 2,
                    alpha: 1.0,
                });
                setModelRef(model);
                setModelStatus("ready");
            } catch (err) {
                console.error(err);
                setModelStatus("error");
            }
        };

        boot();
    }, []);

    const classify = useCallback(
        async (imgElement) => {
            if (!modelRef) return;
            setIsProcessing(true);
            await new Promise((r) => setTimeout(r, 30)); 

            try {
                const predictions = await modelRef.classify(imgElement, 10);

                let catScore = 0;
                let dogScore = 0;
                const catBreeds = [];
                const dogBreeds = [];
                const allPredictions = [];

                for (const pred of predictions) {
                    const animal = matchAnimal(pred.className);
                    allPredictions.push({
                        name: pred.className,
                        probability: pred.probability,
                        type: animal,
                    });
                    if (animal === "cat") {
                        catScore += pred.probability;
                        catBreeds.push({
                            name: pred.className,
                            prob: pred.probability,
                        });
                    } else if (animal === "dog") {
                        dogScore += pred.probability;
                        dogBreeds.push({
                            name: pred.className,
                            prob: pred.probability,
                        });
                    }
                }

                const total = catScore + dogScore;

                if (total < 0.05) {
                    setPrediction({
                        label: "unknown",
                        confidence: 0,
                        catScore: 0,
                        dogScore: 0,
                        breeds: [],
                        topPredictions: allPredictions,
                    });
                } else {
                    const nCat = catScore / total;
                    const nDog = dogScore / total;
                    const isCat = nCat > nDog;
                    setPrediction({
                        label: isCat ? "cat" : "dog",
                        confidence: isCat ? nCat : nDog,
                        catScore: nCat,
                        dogScore: nDog,
                        breeds: isCat ? catBreeds : dogBreeds,
                        topPredictions: allPredictions,
                    });
                }
            } catch (err) {
                console.error(err);
            }

            setIsProcessing(false);
        },
        [modelRef]
    );

    const stopWebcam = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        setWebcamActive(false);
    }, []);

    const handleFile = useCallback(
        (file) => {
            if (!file || !file.type.startsWith("image/")) return;
            stopWebcam();
            setPrediction(null);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewSrc(e.target.result);
            reader.readAsDataURL(file);
        },
        [stopWebcam]
    );

    const handleImgLoad = useCallback(() => {
        if (modelStatus === "ready" && imgRef.current) classify(imgRef.current);
    }, [modelStatus, classify]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFile(e.dataTransfer.files[0]);
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                    width: 640,
                    height: 480,
                },
            });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setWebcamActive(true);
            setPreviewSrc(null);
            setPrediction(null);
        } catch {
            alert("Camera access denied or not available.");
        }
    };

    const captureWebcam = () => {
        if (!videoRef.current) return;
        const v = videoRef.current;
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        stopWebcam();
        setPreviewSrc(c.toDataURL("image/jpeg"));
    };

    const clearAll = () => {
        stopWebcam();
        setPreviewSrc(null);
        setPrediction(null);
    };

    const STATUS = {
        loading: { text: "Loading TensorFlow.js & MobileNet…", color: "#facc15" },
        downloading: {
            text: "Downloading MobileNet v2 model…",
            color: "#fb923c",
        },
        ready: {
            text: "Model ready — MobileNet v2 (ImageNet)",
            color: "#4ade80",
        },
        error: { text: "Failed to load model", color: "#f87171" },
    };


    return (
        <>
            <Head>
                <title>Cat vs Dog Classifier — AI</title>
                <meta
                    name="description"
                    content="Classify cats and dogs in real-time using MobileNet v2 and TensorFlow.js — entirely in your browser."
                />
            </Head>

            <div className="min-h-screen bg-gray-950 text-white p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                            Cat vs Dog Classifier
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Powered by MobileNet v2 pre-trained on ImageNet
                            (1000+ classes) — TensorFlow.js
                        </p>
                        <div
                            className="mt-2 text-sm font-medium"
                            style={{
                                color: STATUS[modelStatus]?.color,
                            }}
                        >
                            {STATUS[modelStatus]?.text}
                        </div>
                        {modelStatus === "downloading" && (
                            <div className="mt-2 mx-auto max-w-xs bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse"
                                    style={{ width: "60%" }}
                                />
                            </div>
                        )}
                    </div>

                    {modelStatus === "ready" && (
                        <div className="mb-8 bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-widest">
                                Network Architecture — MobileNet v2
                            </h2>
                            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                                {ARCH_LAYERS.map((layer, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 flex-shrink-0"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <div
                                                className="w-16 rounded-lg flex flex-col items-center justify-center py-3 text-xs font-bold"
                                                style={{
                                                    background: `${layer.color}22`,
                                                    border: `1px solid ${layer.color}66`,
                                                    color: layer.color,
                                                }}
                                            >
                                                <span className="text-center leading-tight">
                                                    {layer.name}
                                                </span>
                                                <span className="text-gray-500 font-normal mt-1">
                                                    {layer.units}
                                                </span>
                                            </div>
                                        </div>
                                        {i < ARCH_LAYERS.length - 1 && (
                                            <div className="flex-shrink-0 text-gray-600 text-lg">
                                                →
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => clearAll()}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                        !webcamActive
                                            ? "bg-emerald-600 text-white"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    }`}
                                >
                                    Upload Photo
                                </button>
                                <button
                                    onClick={
                                        webcamActive ? stopWebcam : startWebcam
                                    }
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                                        webcamActive
                                            ? "bg-emerald-600 text-white"
                                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                    }`}
                                >
                                    {webcamActive ? "Stop Camera" : "Use Camera"}
                                </button>
                            </div>

                            <div className="relative">
                                {webcamActive ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full rounded-xl border border-gray-700 aspect-square object-cover"
                                    />
                                ) : previewSrc ? (
                                    <img
                                        ref={imgRef}
                                        src={previewSrc}
                                        alt="Preview"
                                        crossOrigin="anonymous"
                                        onLoad={handleImgLoad}
                                        className="w-full rounded-xl border border-gray-700 aspect-square object-cover"
                                    />
                                ) : (
                                    <div
                                        className={`w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                                            isDragging
                                                ? "border-emerald-400 bg-emerald-900/20"
                                                : "border-gray-700 hover:border-gray-500 bg-gray-800/30"
                                        }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <div className="text-5xl mb-3">
                                            {isDragging ? "📥" : "📷"}
                                        </div>
                                        <p className="text-gray-400 text-sm font-medium">
                                            {isDragging
                                                ? "Drop image here"
                                                : "Drag & drop or click to upload"}
                                        </p>
                                        <p className="text-gray-600 text-xs mt-1">
                                            JPG, PNG, WebP
                                        </p>
                                    </div>
                                )}

                                {isProcessing && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                                        <div className="text-emerald-400 text-sm font-medium animate-pulse">
                                            Analyzing…
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />

                            <div className="flex gap-2 mt-3">
                                {!webcamActive && (
                                    <button
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-all"
                                    >
                                        Choose File
                                    </button>
                                )}
                                {webcamActive && (
                                    <button
                                        onClick={captureWebcam}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-all"
                                    >
                                        📸 Capture
                                    </button>
                                )}
                                {(previewSrc || webcamActive) && (
                                    <button
                                        onClick={clearAll}
                                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-all"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-gray-500 text-center mt-2">
                                Upload or capture a photo of a cat or dog
                            </p>
                        </div>

                        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
                            <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-widest">
                                Prediction
                            </h2>

                            {prediction ? (
                                prediction.label === "unknown" ? (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                        <div className="text-5xl mb-3">🤔</div>
                                        <p className="text-sm font-medium">
                                            Neither cat nor dog detected
                                        </p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Try uploading a clear photo of a cat
                                            or dog
                                        </p>
                                        {prediction.topPredictions?.length >
                                            0 && (
                                            <div className="mt-4 w-full">
                                                <p className="text-xs text-gray-500 mb-2">
                                                    Top predictions:
                                                </p>
                                                {prediction.topPredictions
                                                    .slice(0, 3)
                                                    .map((p, i) => (
                                                        <div
                                                            key={i}
                                                            className="text-xs text-gray-500 flex justify-between"
                                                        >
                                                            <span className="truncate mr-2">
                                                                {p.name}
                                                            </span>
                                                            <span>
                                                                {(
                                                                    p.probability *
                                                                    100
                                                                ).toFixed(1)}
                                                                %
                                                            </span>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-center mb-6">
                                            <div className="relative">
                                                <div
                                                    className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                                                    style={{
                                                        background:
                                                            prediction.label ===
                                                            "cat"
                                                                ? "linear-gradient(135deg, #10b981, #06b6d4)"
                                                                : "linear-gradient(135deg, #f59e0b, #ef4444)",
                                                        boxShadow:
                                                            prediction.label ===
                                                            "cat"
                                                                ? "0 0 40px rgba(16,185,129,0.4)"
                                                                : "0 0 40px rgba(245,158,11,0.4)",
                                                    }}
                                                >
                                                    {prediction.label === "cat"
                                                        ? "🐱"
                                                        : "🐶"}
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full px-2 py-0.5 text-xs text-green-400 font-medium border border-gray-700">
                                                    {(
                                                        prediction.confidence *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center mb-6">
                                            <span
                                                className="text-2xl font-bold"
                                                style={{
                                                    color:
                                                        prediction.label ===
                                                        "cat"
                                                            ? "#10b981"
                                                            : "#f59e0b",
                                                }}
                                            >
                                                {prediction.label === "cat"
                                                    ? "Cat"
                                                    : "Dog"}
                                            </span>
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>🐱 Cat</span>
                                                <span>Dog 🐶</span>
                                            </div>
                                            <div className="w-full h-6 bg-gray-800 rounded-full overflow-hidden flex">
                                                <div
                                                    className="h-full transition-all duration-700 rounded-l-full"
                                                    style={{
                                                        width: `${prediction.catScore * 100}%`,
                                                        background:
                                                            "linear-gradient(90deg, #10b981, #06b6d4)",
                                                    }}
                                                />
                                                <div
                                                    className="h-full transition-all duration-700 rounded-r-full"
                                                    style={{
                                                        width: `${prediction.dogScore * 100}%`,
                                                        background:
                                                            "linear-gradient(90deg, #f59e0b, #ef4444)",
                                                    }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs mt-1">
                                                <span className="text-emerald-400">
                                                    {(
                                                        prediction.catScore *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                                <span className="text-amber-400">
                                                    {(
                                                        prediction.dogScore *
                                                        100
                                                    ).toFixed(1)}
                                                    %
                                                </span>
                                            </div>
                                        </div>

                                        {prediction.breeds.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                                    Detected Breeds
                                                </h3>
                                                <div className="space-y-2">
                                                    {prediction.breeds
                                                        .sort(
                                                            (a, b) =>
                                                                b.prob - a.prob
                                                        )
                                                        .map((breed, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <span className="w-32 text-xs text-gray-300 truncate">
                                                                    {
                                                                        breed.name
                                                                    }
                                                                </span>
                                                                <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${breed.prob * 100}%`,
                                                                            background:
                                                                                prediction.label ===
                                                                                "cat"
                                                                                    ? "linear-gradient(90deg, #10b981, #06b6d4)"
                                                                                    : "linear-gradient(90deg, #f59e0b, #ef4444)",
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-500 w-14 text-right">
                                                                    {(
                                                                        breed.prob *
                                                                        100
                                                                    ).toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {prediction.topPredictions?.length >
                                            0 && (
                                            <div className="mt-4 pt-4 border-t border-gray-800">
                                                <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                                    All Top Predictions
                                                </h3>
                                                <div className="space-y-1">
                                                    {prediction.topPredictions
                                                        .slice(0, 5)
                                                        .map((p, i) => (
                                                            <div
                                                                key={i}
                                                                className="flex justify-between text-xs"
                                                            >
                                                                <span
                                                                    className={`truncate mr-2 ${
                                                                        p.type ===
                                                                        "cat"
                                                                            ? "text-emerald-400"
                                                                            : p.type ===
                                                                                "dog"
                                                                              ? "text-amber-400"
                                                                              : "text-gray-500"
                                                                    }`}
                                                                >
                                                                    {p.type ===
                                                                    "cat"
                                                                        ? "🐱 "
                                                                        : p.type ===
                                                                            "dog"
                                                                          ? "🐶 "
                                                                          : "• "}
                                                                    {p.name}
                                                                </span>
                                                                <span className="text-gray-600">
                                                                    {(
                                                                        p.probability *
                                                                        100
                                                                    ).toFixed(
                                                                        1
                                                                    )}
                                                                    %
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                                    <div className="text-5xl mb-3">🐾</div>
                                    <p className="text-sm">
                                        {modelStatus === "ready"
                                            ? "Upload a photo to see the prediction"
                                            : "Waiting for model…"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 bg-gray-900 rounded-2xl p-5 border border-gray-800">
                        <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-widest">
                            How It Works
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-400">
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="text-emerald-400 font-semibold mb-1">
                                    1. Pre-trained MobileNet
                                </div>
                                <p>
                                    Uses MobileNet v2 pre-trained on ImageNet —
                                    1.4M+ images across 1000 categories
                                    including 120+ dog breeds and domestic cat
                                    breeds.
                                </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="text-teal-400 font-semibold mb-1">
                                    2. Breed Aggregation
                                </div>
                                <p>
                                    Top‑10 predictions are classified as cat or
                                    dog breeds. Probabilities are summed per
                                    category to produce the final cat‑vs‑dog
                                    score.
                                </p>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="text-cyan-400 font-semibold mb-1">
                                    3. Browser Inference
                                </div>
                                <p>
                                    Your image is resized to 224×224 and
                                    processed through 53 convolutional layers.
                                    All computation runs locally — nothing
                                    leaves your device.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
