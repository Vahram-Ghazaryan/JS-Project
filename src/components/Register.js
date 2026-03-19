import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import auth from "../../lib/auth";
import { useRouter } from "next/router";
import Link from "next/link";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password,
            );
            router.push("/login");
        } catch (error) {
            switch (error.code) {
                case "auth/weak-password":
                    alert("Password must be at least 6 characters long.");
                    break;
                case "auth/email-already-in-use":
                    alert("This email is already in use. Try logging in.");
                    break;
                case "auth/invalid-email":
                    alert("Invalid email format.");
                    break;
                case "auth/operation-not-allowed":
                    alert("Email/password accounts are not enabled.");
                    break;
                case "auth/network-request-failed":
                    alert("Network error. Please check your connection.");
                    break;
                default:
                    alert("Error: " + error.message);
            }
        }
    };
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-linear-to-r from-purple-400 to-purple-600">
            <div className="bg-white/80 p-6 rounded-md z-10 w-96 border border-gray-300 shadow-lg">
                <h2 className="text-7xl font-bold mb-4 text-center text-purple-600 hover:text-shadow-purple-700 hover:text-shadow-[10px_10px_10px_rgba(128,0,128,0.5)] transition-all duration-600 ease-in-out cursor-pointer">
                    Welcome
                </h2>
                <form className="mt-5" onSubmit={handleRegister}>
                    <input
                        type="text"
                        placeholder="Name"
                        className="outline-0 w-full p-2 border border-gray-300 rounded-md mb-4 focus:border-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Surname"
                        className="outline-0 w-full p-2 border border-gray-300 rounded-md mb-4 focus:border-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                        required
                    />
                    <div className="flex gap-2">
                        <select
                            className="appearance-none outline-0 w-full p-2 border border-gray-300 rounded-md mb-4 focus:border-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                            required
                        >
                            <option value="">Day</option>
                            {[...Array(31)].map((_, i) => (
                                <option key={i} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                        <select
                            className=" appearance-none outline-0 bg-transparent w-full p-2 border border-gray-300 rounded-md mb-4 focus:border-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                            required
                        >
                            <option value="">Month</option>
                            {[...Array(12)].map((_, i) => (
                                <option key={i} value={i + 1}>
                                    {i + 1}
                                </option>
                            ))}
                        </select>
                        <select
                            className="appearance-none outline-0 w-full p-2 border border-gray-300 rounded-md mb-4 focus:border-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                            required
                        >
                            <option value="">Year</option>
                            {[...Array(100)].map((_, i) => (
                                <option key={i} value={2024 - i}>
                                    {2024 - i}
                                </option>
                            ))}
                        </select>
                    </div>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="outline-0 w-full p-2 border border-gray-300 rounded-md mb-4 focus:border-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="outline-0 w-full p-2 border border-gray-300 rounded-md mb-4 focus:border-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                    />
                    <button
                        type="submit"
                        className="outline-0 w-full bg-purple-500 text-white py-2 px-4 rounded-md hover:bg-purple-600 cursor-pointer transition-all duration-300 ease-in-out hover:scale-[1.02]
hover:shadow-lg hover:shadow-purple-300"
                    >
                        Sign Up
                    </button>
                    <Link
                        href="/login"
                        className="block mt-5 text-center !text-purple-600 hover:text-purple-800 transition-all duration-300 ease-in-out hover:scale-[1.02]"
                    >
                        Already have an account? Login
                    </Link>
                </form>
            </div>
        </div>
    );
};

export default Register;
