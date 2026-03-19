import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import auth from "../../lib/auth";
import { useRouter } from "next/router";
import Link from "next/link";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password,
            );
            router.push("/");
        } catch (error) {
            alert("Error logging in user. Please try again.");
        }
    };
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-linear-to-r from-purple-400 to-purple-600">
            <div className="bg-white/80 p-6 rounded-md z-10 w-96 border border-gray-300 shadow-lg">
                <h2 className="text-5xl font-bold mb-4 text-center text-purple-600 hover:text-shadow-purple-700 hover:text-shadow-[0_0_10px_rgba(128,0,128,0.5)] transition-all duration-600 ease-in-out cursor-pointer">
                    Welcome Back
                </h2>
                <form className="mt-5" onSubmit={handleLogin}>
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
                        Sign In
                    </button>
                    <Link
                        href="/register"
                        className="block mt-5 text-center !text-purple-600 hover:text-purple-800 transition-all duration-300 ease-in-out hover:scale-[1.02]"
                    >
                        Don't have an account? Register
                    </Link>
                </form>
            </div>
        </div>
    );
};
export default Login;
