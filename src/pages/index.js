import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";

const PROJECTS = [
    {
        title: "Sapper",
        description: "A classic logical game where you have to board without detonating hidden bombs.",
        href: "/sapper",
        image: "/sapper.png",
        color: "from-blue-500 to-indigo-600",
        tags: ["Logic", "Game"]
    },
    {
        title: "Digit Recognizer",
        description: "An AI-powered drawing board that guesses the handwritten digits using a custom Convolutional Neural Network.",
        href: "/digit-recognizer",
        image: "/digit-recognizer.png",
        color: "from-purple-500 to-purple-600",
        tags: ["AI", "TensorFlow", "Computer Vision"]
    },
    {
        title: "Cat vs Dog Classifier",
        description: "Upload a photo or use your webcam to let the MobileNet v2 neural network instantly distinguish between cats and dogs.",
        href: "/cat-dog-classifier",
        image: "/cat-dog-classifier.jpeg",
        color: "from-emerald-400 to-teal-500",
        tags: ["AI", "Image Classification", "MobileNet"]
    }
];

export default function Home() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
            <Head>
                <title>Our JS Projects</title>
                <meta name="description" content="A collection of web apps and AI experiments" />
            </Head>

            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-20 flex flex-col items-center">

                <div className={`text-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-sm text-gray-400 mb-6">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Welcome to our projects
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                        Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Projects</span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed">
                        This is a collection of projects made by our team.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                    {PROJECTS.map((project, idx) => (
                        <Link
                            key={idx}
                            href={project.href}
                            className={`group relative flex flex-col bg-gray-900 rounded-3xl border border-gray-800 overflow-hidden transition-all duration-700 hover:shadow-2xl hover:shadow-${project.color.split('-')[1]}/20 hover:-translate-y-2 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                            style={{ transitionDelay: `${idx * 150}ms` }}
                        >
                            <div className="relative h-56 w-full overflow-hidden bg-gray-800">
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10 opacity-80" />
                                <img
                                    src={project.image}
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            </div>

                            <div className="relative p-6 flex-1 flex flex-col">
                                <h3 className="text-2xl font-bold mb-3 text-gray-100 group-hover:text-white transition-colors">
                                    {project.title}
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                                    {project.description}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    {project.tags.map((tag, i) => (
                                        <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className={`mt-auto w-full py-3 px-4 rounded-xl font-semibold text-sm text-center text-white bg-gradient-to-r \${project.color} opacity-90 transition-opacity duration-300 group-hover:opacity-100`}>
                                    Launch Project
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}
