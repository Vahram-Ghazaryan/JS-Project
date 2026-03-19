import Link from "next/link";
import Image from "next/image";
import { signOut } from "firebase/auth";
import auth from "../../lib/auth";
import { useAuth } from "@/context/AuthContext";

const Header = () => {
    const { user } = useAuth();

    return (
        <header>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Image
                    src="/favicon.ico"
                    alt="Description of image"
                    width={50}
                    height={50}
                />
                <h1>My Next.js App</h1>
            </div>
            <nav>
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
                {user ? (
                    <button
                        onClick={async () => {
                            await signOut(auth);
                        }}
                        className="ml-4 bg-purple-500/50 text-white py-1 px-3 rounded-md cursor-pointer hover:bg-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]"
                    >
                        Logout
                    </button>
                ) : (
                    <Link
                        href="/login"
                        className="ml-4 bg-purple-500/50 text-white py-1 px-3 rounded-md hover:bg-purple-600 transition-all duration-300 ease-in-out hover:scale-[1.02]"
                    >
                        Login
                    </Link>
                )}
            </nav>
        </header>
    );
};

export default Header;
