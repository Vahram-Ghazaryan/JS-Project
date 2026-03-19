import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import auth from "../../lib/auth";
import { useRouter } from "next/router";
import { AuthProvider } from "@/context/AuthContext";

export default function App({ Component, pageProps }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (
                !currentUser &&
                router.pathname !== "/login" &&
                router.pathname !== "/register"
            ) {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, []);
    if (loading) {
        return <div>Loading...</div>;
    }
    return (
        <AuthProvider>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AuthProvider>
    );
}
