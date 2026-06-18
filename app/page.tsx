"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const SPORTS = [
    "Basketball",
    "Football",
    "Soccer",
    "Baseball",
    "Tennis",
    "Ice Hockey",
    "Cricket",
    "Golf",
    "Volleyball",
];

const FEATURES = [
    {
        title: "Live head-to-head rooms",
        description:
            "Create a private room, invite a friend, and play the same question set in real time.",
    },
    {
        title: "Fast rounds, clear scoring",
        description:
            "Short duels keep the pace up while the scoreboard makes every answer feel important.",
    },
    {
        title: "Sports-first categories",
        description:
            "Pick the sport you actually want to play instead of scrolling through generic trivia.",
    },
];

type User = { email: string; name: string };
type AuthState = { isLoggedIn: boolean; user: User | null };

const getInitialAuthState = (): AuthState => {
    if (typeof window === "undefined") {
        return { isLoggedIn: false, user: null };
    }

    const token = localStorage.getItem("token");
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");

    if (!token || !userEmail) {
        return { isLoggedIn: false, user: null };
    }

    return {
        isLoggedIn: true,
        user: { email: userEmail, name: userName || "Player" },
    };
};

export default function Home() {
    const [{ isLoggedIn, user }, setAuthState] =
        useState<AuthState>(getInitialAuthState);

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userName");
        setAuthState({ isLoggedIn: false, user: null });
    };

    return (
        <div className="min-h-screen bg-[#f6f4ef] text-slate-950">
            <header className="border-b border-[#dedbd2] bg-[#f6f4ef]/95">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                        aria-label="Hoop home"
                    >
                        <span className="grid size-11 place-items-center rounded-2xl border border-[#d9d3c6] bg-white text-xl shadow-sm">
                            🏀
                        </span>
                        <span className="text-2xl font-black tracking-tight text-slate-950">
                            Hoop
                        </span>
                    </Link>

                    <nav className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <>
                                <span className="hidden text-sm font-medium text-slate-600 sm:inline">
                                    {user?.name}
                                </span>
                                <Link
                                    href="/game"
                                    className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                                >
                                    Play
                                </Link>
                                <button
                                    onClick={logout}
                                    className="rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/signin"
                                    className="rounded-full px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-white"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main>
                <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-24">
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                    >
                        <p className="mb-5 inline-flex rounded-full border border-[#dedbd2] bg-white px-4 py-2 text-sm font-bold text-cyan-800 shadow-sm">
                            Real-time sports trivia for two players
                        </p>
                        <h1 className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tighter text-slate-950 sm:text-7xl lg:text-8xl">
                            Settle sports debates in a quick duel.
                        </h1>
                        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                            Hoop turns sports knowledge into fast, head-to-head
                            trivia rooms. Choose a sport, share a room code,
                            answer quickly, and see who really knows the game.
                        </p>

                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={isLoggedIn ? "/game" : "/signup"}
                                className="inline-flex h-13 items-center justify-center rounded-full bg-slate-950 px-7 text-base font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                            >
                                {isLoggedIn
                                    ? "Start a duel"
                                    : "Create free account"}
                            </Link>
                            <Link
                                href={isLoggedIn ? "/game" : "/signin"}
                                className="inline-flex h-13 items-center justify-center rounded-full border border-[#d7d0c1] bg-white px-7 text-base font-black text-slate-900 transition hover:-translate-y-0.5 hover:border-slate-400"
                            >
                                {isLoggedIn
                                    ? "Join room"
                                    : "I already have an account"}
                            </Link>
                        </div>

                        <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3 border-t border-[#dedbd2] pt-7">
                            <div>
                                <p className="text-3xl font-black tracking-tight text-slate-950">
                                    9
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Sports
                                </p>
                            </div>
                            <div>
                                <p className="text-3xl font-black tracking-tight text-slate-950">
                                    2P
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Live duels
                                </p>
                            </div>
                            <div>
                                <p className="text-3xl font-black tracking-tight text-slate-950">
                                    Fast
                                </p>
                                <p className="mt-1 text-sm font-medium text-slate-500">
                                    Rounds
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08 }}
                        className="rounded-4xl border border-[#d7d0c1] bg-white p-4 shadow-[0_24px_80px_rgba(18,24,38,0.12)]"
                    >
                        <div className="rounded-3xl border border-slate-200 bg-[#fbfaf7] p-5 sm:p-7">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-800">
                                        Room B7K2
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                                        Basketball Duel
                                    </h2>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                                    Live
                                </span>
                            </div>

                            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                                <div className="rounded-3xl bg-white p-5 text-center ring-1 ring-slate-200">
                                    <p className="text-sm font-bold text-slate-500">
                                        You
                                    </p>
                                    <p className="mt-2 text-5xl font-black tracking-tight text-slate-950">
                                        420
                                    </p>
                                </div>
                                <p className="text-sm font-black text-slate-400">
                                    VS
                                </p>
                                <div className="rounded-3xl bg-white p-5 text-center ring-1 ring-slate-200">
                                    <p className="text-sm font-bold text-slate-500">
                                        Rival
                                    </p>
                                    <p className="mt-2 text-5xl font-black tracking-tight text-slate-950">
                                        360
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
                                <div className="flex items-center justify-between text-sm font-bold text-slate-300">
                                    <span>Question 4 of 10</span>
                                    <span>+100 pts</span>
                                </div>
                                <p className="mt-4 text-2xl font-black leading-snug tracking-tight">
                                    Which franchise won the most NBA titles?
                                </p>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    {[
                                        "Lakers",
                                        "Celtics",
                                        "Bulls",
                                        "Warriors",
                                    ].map((answer) => (
                                        <div
                                            key={answer}
                                            className={`rounded-2xl px-4 py-3 text-sm font-black ${
                                                answer === "Celtics"
                                                    ? "bg-cyan-700 text-white"
                                                    : "bg-white/10 text-slate-200"
                                            }`}
                                        >
                                            {answer}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                <section className="border-y border-[#dedbd2] bg-white">
                    <div className="mx-auto grid max-w-7xl gap-px px-5 py-8 sm:px-8 md:grid-cols-3">
                        {FEATURES.map((feature) => (
                            <article
                                key={feature.title}
                                className="border-[#dedbd2] py-6 md:border-r md:px-8 md:last:border-r-0"
                            >
                                <h3 className="text-xl font-black tracking-tight text-slate-950">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 leading-7 text-slate-600">
                                    {feature.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                                Choose your lane
                            </p>
                            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
                                Available sports
                            </h2>
                        </div>
                        <p className="max-w-xl text-slate-600">
                            Start with one sport, switch whenever you want, and
                            keep the competition fresh.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
                        {SPORTS.map((sport) => (
                            <div
                                key={sport}
                                className="rounded-2xl border border-[#dedbd2] bg-white px-4 py-4 text-center text-sm font-black text-slate-800 shadow-sm"
                            >
                                {sport}
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-[#dedbd2] bg-white">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <p>© 2024 Hoop. All rights reserved.</p>
                    <p>Built for fast sports trivia duels.</p>
                </div>
            </footer>
        </div>
    );
}
