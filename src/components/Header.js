import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "firebase/auth";
import auth from "../../lib/auth";
import { useAuth } from "@/context/AuthContext";

const THEME = {
    "/cat-dog-classifier": {
        gradient: "linear-gradient(to right, #34d399, #2dd4bf, #22d3ee)",
        buttonColor: "#059669",
        borderColor: "rgba(6, 78, 59, 0.5)",
        shadowColor: "rgba(16,185,129,0.3)",
        bgColor: "rgba(2, 44, 34, 0.85)",
    },
    "/digit-recognizer": {
        gradient: "linear-gradient(to right, #818cf8, #c084fc, #f472b6)",
        buttonColor: "#4f46e5",
        borderColor: "rgba(49, 46, 129, 0.5)",
        shadowColor: "rgba(99,102,241,0.3)",
        bgColor: "rgba(30, 27, 75, 0.85)",
    },
    "/sapper": {
        gradient: "linear-gradient(to right, #60a5fa, #818cf8)",
        buttonColor: "#2563eb",
        borderColor: "rgba(30, 58, 138, 0.5)",
        shadowColor: "rgba(59,130,246,0.3)",
        bgColor: "rgba(15, 23, 60, 0.85)",
    },
    default: {
        gradient: "linear-gradient(to right, #818cf8, #c084fc, #f472b6)",
        buttonColor: "#7c3aed",
        borderColor: "rgba(55, 48, 163, 0.3)",
        shadowColor: "rgba(147,51,234,0.3)",
        bgColor: "rgba(3, 7, 18, 0.85)",
    },
};

const Header = () => {
    const { user } = useAuth();
    const router = useRouter();

    const theme = THEME[router.pathname] ?? THEME.default;

    return (
        <header
            className="sticky top-0 z-50 p-4 backdrop-blur-md transition-all duration-500"
            style={{
                borderBottom: `1px solid ${theme.borderColor}`,
                backgroundColor: theme.bgColor,
            }}
        >
            <div className="flex items-center gap-2 mb-4">
                <span className="text-white font-bold text-2xl tracking-tight">Ai</span>
                <h1
                    className="font-bold text-2xl tracking-tight"
                    style={{
                        background: theme.gradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}
                >
                    Projects
                </h1>
            </div>

            <nav className="flex items-center gap-4 text-gray-300 font-medium">
                <Link href="/" className="hover:text-white transition-all">Home</Link>
                <Link href="/about" className="hover:text-white transition-all">About</Link>

                {user ? (
                    <button
                        onClick={async () => { await signOut(auth); }}
                        className="ml-4 text-white py-1 px-3 rounded-md cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                        style={{
                            backgroundColor: theme.buttonColor + "99",
                            boxShadow: `0 0 0px ${theme.shadowColor}`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${theme.shadowColor}`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 0px ${theme.shadowColor}`}
                    >
                        Logout
                    </button>
                ) : (
                    <Link
                        href="/login"
                        className="ml-4 text-white py-1 px-3 rounded-md transition-all duration-300 hover:scale-[1.02]"
                        style={{ backgroundColor: theme.buttonColor + "99" }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${theme.shadowColor}`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 0px ${theme.shadowColor}`}
                    >
                        Login
                    </Link>
                )}
            </nav>
        </header>
    );
};

export default Header;