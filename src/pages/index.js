import { TextField } from "@mui/material";
import { useState, useEffect } from "react";
import Link from "next/link";
const Root = () => {
    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-4 text-center">
                Welcome to the Home Page
            </h1>
            <h3 className="text-xl font-semibold mb-4 text-center">
                Select the Game
            </h3>
            <div className="flex justify-center gap-4 flex-wrap">
                <Link
                    href="/sapper"
                    className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-300"
                >
                    Sapper
                </Link>
                <Link
                    href="/digit-recognizer"
                    className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-300"
                >
                    Digit Recognizer (Neural Network)
                </Link>
            </div>
        </div>
    );
};

export default Root;
