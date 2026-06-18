"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || fallback;
    }

    return fallback;
};

export default function SignIn() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.email || !formData.password) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${BACKEND_URL}/signin`, {
                email: formData.email,
                password: formData.password,
            });

            if (response.data.token) {
                const base64Url = response.data.token.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                    atob(base64)
                        .split("")
                        .map(
                            (c) =>
                                "%" +
                                ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                        )
                        .join(""),
                );
                const { id } = JSON.parse(jsonPayload);

                localStorage.setItem("token", response.data.token);
                localStorage.setItem("userId", id);
                localStorage.setItem("userEmail", formData.email);
                router.push("/game");
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Sign in failed. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f6f4ef] px-5 py-6 text-slate-950 sm:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl border border-[#d9d3c6] bg-white text-xl shadow-sm">
                        🏀
                    </span>
                    <span className="text-2xl font-black tracking-tight">
                        Hoop
                    </span>
                </Link>
                <Link
                    href="/signup"
                    className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                    Sign up
                </Link>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
                <section className="hidden rounded-4xl border border-[#d7d0c1] bg-white p-8 shadow-[0_18px_70px_rgba(18,24,38,0.08)] lg:block">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                        Welcome back
                    </p>
                    <h1 className="mt-5 text-5xl font-black leading-tight tracking-tighter">
                        Jump back into your next duel.
                    </h1>
                    <p className="mt-5 text-lg leading-8 text-slate-600">
                        Sign in, create a room, and invite a friend. Hoop keeps
                        the focus on the matchup, the questions, and the score.
                    </p>
                    <div className="mt-10 rounded-3xl bg-[#fbfaf7] p-5 ring-1 ring-[#dedbd2]">
                        <div className="flex items-center justify-between border-b border-[#dedbd2] pb-4">
                            <span className="font-black">
                                Tonight&apos;s room
                            </span>
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800 ring-1 ring-cyan-100">
                                Ready
                            </span>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#dedbd2]">
                                <p className="text-sm font-bold text-slate-500">
                                    Sport
                                </p>
                                <p className="mt-2 text-2xl font-black">
                                    Basketball
                                </p>
                            </div>
                            <div className="rounded-2xl bg-white p-4 ring-1 ring-[#dedbd2]">
                                <p className="text-sm font-bold text-slate-500">
                                    Format
                                </p>
                                <p className="mt-2 text-2xl font-black">1v1</p>
                            </div>
                        </div>
                    </div>
                </section>

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mx-auto w-full max-w-lg rounded-4xl border border-[#d7d0c1] bg-white p-6 shadow-[0_18px_70px_rgba(18,24,38,0.08)] sm:p-8 lg:mx-0 lg:justify-self-end"
                >
                    <div className="mb-8">
                        <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                            Sign in
                        </p>
                        <h2 className="mt-3 text-4xl font-black tracking-tight">
                            Welcome back
                        </h2>
                        <p className="mt-3 text-slate-600">
                            Use your account to continue to the game lobby.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="mb-2 block text-sm font-black text-slate-800">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="h-13 w-full rounded-2xl border border-[#d7d0c1] bg-[#fbfaf7] px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-black text-slate-800">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="h-13 w-full rounded-2xl border border-[#d7d0c1] bg-[#fbfaf7] px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:bg-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-13 w-full rounded-full bg-slate-950 px-6 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm font-medium text-slate-600">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-black text-cyan-800 hover:text-cyan-900"
                        >
                            Create one
                        </Link>
                    </p>
                </motion.section>
            </div>
        </main>
    );
}
