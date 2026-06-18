"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

interface JwtPayload {
    id?: string;
    userId?: string;
    sub?: string;
}

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || fallback;
    }

    return fallback;
};

export default function SignUp() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.name || !formData.email || !formData.password) {
            setError("Please fill in all fields");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`${BACKEND_URL}/signup`, {
                name: formData.name,
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
                const payload = JSON.parse(jsonPayload) as JwtPayload;
                const userId =
                    payload.id ||
                    payload.userId ||
                    payload.sub ||
                    formData.email;

                localStorage.setItem("token", response.data.token);
                localStorage.setItem("userId", userId);
                localStorage.setItem("userEmail", formData.email);
                localStorage.setItem("userName", formData.name);
                router.push("/game");
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Sign up failed. Please try again."));
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
                    href="/signin"
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 ring-1 ring-[#d7d0c1] transition hover:ring-slate-400"
                >
                    Sign in
                </Link>
            </div>

            <div className="mx-auto grid max-w-6xl gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="mx-auto w-full max-w-lg rounded-4xl border border-[#d7d0c1] bg-white p-6 shadow-[0_18px_70px_rgba(18,24,38,0.08)] sm:p-8 lg:mx-0"
                >
                    <div className="mb-8">
                        <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                            Create account
                        </p>
                        <h1 className="mt-3 text-4xl font-black tracking-tight">
                            Start playing Hoop
                        </h1>
                        <p className="mt-3 text-slate-600">
                            Create your profile and jump straight into a trivia
                            room.
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
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Your name"
                                className="h-13 w-full rounded-2xl border border-[#d7d0c1] bg-[#fbfaf7] px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:bg-white"
                            />
                        </div>

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

                        <div className="grid gap-5 sm:grid-cols-2">
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

                            <div>
                                <label className="mb-2 block text-sm font-black text-slate-800">
                                    Confirm
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="h-13 w-full rounded-2xl border border-[#d7d0c1] bg-[#fbfaf7] px-4 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-700 focus:bg-white"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-13 w-full rounded-full bg-slate-950 px-6 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm font-medium text-slate-600">
                        Already have an account?{" "}
                        <Link
                            href="/signin"
                            className="font-black text-cyan-800 hover:text-cyan-900"
                        >
                            Sign in
                        </Link>
                    </p>
                </motion.section>

                <section className="hidden rounded-4xl border border-[#d7d0c1] bg-slate-950 p-8 text-white shadow-[0_18px_70px_rgba(18,24,38,0.14)] lg:block">
                    <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">
                        How it works
                    </p>
                    <h2 className="mt-5 text-5xl font-black leading-tight tracking-tighter">
                        Three steps from signup to showdown.
                    </h2>
                    <div className="mt-10 space-y-4">
                        {[
                            [
                                "01",
                                "Pick a sport",
                                "Choose the category you and your friend actually care about.",
                            ],
                            [
                                "02",
                                "Share the room",
                                "Send the room code and wait for your opponent to join.",
                            ],
                            [
                                "03",
                                "Answer fast",
                                "Correct answers and timing decide the winner.",
                            ],
                        ].map(([number, title, description]) => (
                            <div
                                key={number}
                                className="rounded-3xl bg-white/8 p-5 ring-1 ring-white/10"
                            >
                                <p className="text-sm font-black text-cyan-200">
                                    {number}
                                </p>
                                <h3 className="mt-2 text-xl font-black">
                                    {title}
                                </h3>
                                <p className="mt-2 leading-7 text-slate-300">
                                    {description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}
