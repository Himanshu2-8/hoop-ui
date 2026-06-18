"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { io, type Socket } from "socket.io-client";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
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

type GamePhase = "menu" | "lobby" | "waiting" | "playing" | "results";
type SocketStatus = "connecting" | "connected" | "disconnected";

interface Question {
    question: string;
    correctAnswer: string;
    incorrectAnswers: string[];
}

interface GameState {
    question?: Question;
    questionNumber?: number;
    totalQuestions?: number;
    player1Score?: number;
    player2Score?: number;
    isCorrect?: boolean;
    correctAnswer?: string;
    winner?: string;
}

interface CreateRoomResponse {
    code?: string | number;
    roomCode?: string | number;
}

const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message || fallback;
    }

    return fallback;
};

const normalizeRoomCode = (code: string | number) =>
    String(code).trim().toUpperCase();

const getStoredUserId = () => {
    const storedUserId = localStorage.getItem("userId");

    if (
        storedUserId &&
        storedUserId !== "undefined" &&
        storedUserId !== "null"
    ) {
        return storedUserId;
    }

    const userEmail = localStorage.getItem("userEmail");

    if (userEmail) {
        return userEmail;
    }

    const anonymousUserId = crypto.randomUUID();
    localStorage.setItem("userId", anonymousUserId);
    return anonymousUserId;
};

const hashString = (value: string) => {
    let hash = 0;

    for (let i = 0; i < value.length; i += 1) {
        hash = (hash << 5) - hash + value.charCodeAt(i);
        hash |= 0;
    }

    return hash;
};

const getShuffledAnswers = (question: Question) =>
    [question.correctAnswer, ...question.incorrectAnswers].sort((a, b) => {
        const hashA = hashString(`${question.question}:${a}`);
        const hashB = hashString(`${question.question}:${b}`);

        if (hashA === hashB) {
            return a.localeCompare(b);
        }

        return hashA - hashB;
    });

export default function GamePage() {
    const router = useRouter();
    const socketRef = useRef<Socket | null>(null);
    const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [gamePhase, setGamePhase] = useState<GamePhase>("menu");
    const [selectedSport, setSelectedSport] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [gameState, setGameState] = useState<GameState>({});
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(false);
    const [startingGame, setStartingGame] = useState(false);
    const [socketStatus, setSocketStatus] =
        useState<SocketStatus>("connecting");
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/signin");
            return;
        }

        const socket = io(BACKEND_URL, {
            transports: ["websocket", "polling"],
            auth: { token },
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketStatus("connected");
            setError("");
        });

        socket.on("disconnect", () => {
            setSocketStatus("disconnected");
        });

        socket.on("connect_error", (err) => {
            setSocketStatus("disconnected");
            setError(`Socket connection failed: ${err.message}`);
        });

        socket.on("room_ready", () => {
            setGamePhase("waiting");
            setError("");
        });

        socket.on("game_started", (data: GameState) => {
            if (startTimeoutRef.current) {
                clearTimeout(startTimeoutRef.current);
                startTimeoutRef.current = null;
            }

            setStartingGame(false);
            setGameState(data);
            setGamePhase("playing");
            setSelectedAnswer(null);
            setIsAnswered(false);
            setError("");
        });

        socket.on("next_question", (data: GameState) => {
            setStartingGame(false);
            setGameState(data);
            setSelectedAnswer(null);
            setIsAnswered(false);
            setError("");
        });

        socket.on(
            "answered",
            (data: { isCorrect: boolean; correctAnswer: string }) => {
                setGameState((prev) => ({
                    ...prev,
                    isCorrect: data.isCorrect,
                    correctAnswer: data.correctAnswer,
                }));
            },
        );

        socket.on(
            "scores_updated",
            (data: { player1Score: number; player2Score: number }) => {
                setGameState((prev) => ({
                    ...prev,
                    player1Score: data.player1Score,
                    player2Score: data.player2Score,
                }));
            },
        );

        socket.on("game_over", (data: GameState) => {
            setGameState(data);
            setGamePhase("results");
        });

        socket.on("error", (data: { message?: string } | string) => {
            setStartingGame(false);
            setError(
                typeof data === "string"
                    ? data
                    : data.message || "Socket error",
            );
        });

        socket.on("game_error", (data: { message?: string } | string) => {
            setStartingGame(false);
            setError(
                typeof data === "string" ? data : data.message || "Game error",
            );
        });

        socket.on("room_error", (data: { message?: string } | string) => {
            setError(
                typeof data === "string" ? data : data.message || "Room error",
            );
        });

        return () => {
            if (startTimeoutRef.current) {
                clearTimeout(startTimeoutRef.current);
                startTimeoutRef.current = null;
            }

            socket.removeAllListeners();
            socket.disconnect();
            socketRef.current = null;
        };
    }, [router]);

    const handleCreateRoom = async () => {
        if (!selectedSport) {
            setError("Please select a sport");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const token = localStorage.getItem("token");
            const response = await axios.get<CreateRoomResponse>(
                `${BACKEND_URL}/create`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            const createdCode = response.data.code ?? response.data.roomCode;

            if (!createdCode) {
                setError("Failed to create room");
                return;
            }

            if (!socketRef.current?.connected) {
                setError(
                    "Socket is still connecting. Please try again in a moment.",
                );
                return;
            }

            const normalizedCode = normalizeRoomCode(createdCode);
            const userId = getStoredUserId();
            socketRef.current.emit("join_room", {
                code: normalizedCode,
                userId,
            });
            setRoomCode(normalizedCode);
            setGamePhase("waiting");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to create room"));
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = () => {
        if (!joinCode) {
            setError("Please enter a room code");
            return;
        }

        setError("");

        if (!socketRef.current?.connected) {
            setError(
                "Socket is still connecting. Please try again in a moment.",
            );
            return;
        }

        const normalizedCode = normalizeRoomCode(joinCode);
        const userId = getStoredUserId();
        socketRef.current.emit("join_room", { code: normalizedCode, userId });
        setRoomCode(normalizedCode);
        setGamePhase("waiting");
    };

    const startGame = () => {
        if (!roomCode || !selectedSport) {
            setError(
                "Missing room code or sport. Please create the room again.",
            );
            return;
        }

        if (!socketRef.current?.connected) {
            setError("Socket is disconnected. Refresh and try again.");
            return;
        }

        setError("");
        setStartingGame(true);

        const payload = {
            code: normalizeRoomCode(roomCode),
            sport: selectedSport,
            userId: getStoredUserId(),
        };

        socketRef.current.emit("game_start", payload);

        if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current);
        }

        startTimeoutRef.current = setTimeout(() => {
            setStartingGame(false);
            setError(
                "Start request was sent, but the backend did not send a game_started event. Check the backend socket event name and room-code handling.",
            );
        }, 10000);
    };

    const submitAnswer = () => {
        if (
            socketRef.current?.connected &&
            roomCode &&
            selectedAnswer &&
            !isAnswered
        ) {
            socketRef.current.emit("submit_answer", {
                code: normalizeRoomCode(roomCode),
                answer: selectedAnswer,
                userId: getStoredUserId(),
            });
            setIsAnswered(true);
        }
    };

    const resetGame = () => {
        setGamePhase("menu");
        setGameState({});
        setSelectedAnswer(null);
        setIsAnswered(false);
        setSelectedSport("");
        setRoomCode("");
        setJoinCode("");
        setError("");
    };

    const progress =
        ((gameState.questionNumber || 0) / (gameState.totalQuestions || 1)) *
        100;

    return (
        <div className="min-h-screen bg-[#f6f4ef] text-slate-950">
            <header className="border-b border-[#dedbd2] bg-[#f6f4ef]/95">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="grid size-11 place-items-center rounded-2xl border border-[#d9d3c6] bg-white text-xl shadow-sm">
                            🏀
                        </span>
                        <span className="text-2xl font-black tracking-tight">
                            Hoop
                        </span>
                    </Link>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            router.push("/");
                        }}
                        className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 ring-1 ring-[#d7d0c1] transition hover:ring-slate-400"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="mx-auto min-h-[calc(100vh-80px)] max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
                <AnimatePresence mode="wait">
                    {gamePhase === "menu" && (
                        <motion.section
                            key="menu"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="grid gap-8 lg:grid-cols-[1fr_420px]"
                        >
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                                    Game lobby
                                </p>
                                <h1 className="mt-4 max-w-3xl text-5xl font-black leading-none tracking-tighter sm:text-7xl">
                                    Pick your sport and set the room.
                                </h1>
                                <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                                    Choose a category, create a private room, or
                                    join with a code from your opponent.
                                </p>

                                <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {SPORTS.map((sport) => {
                                        const selected =
                                            selectedSport === sport;

                                        return (
                                            <button
                                                key={sport}
                                                onClick={() =>
                                                    setSelectedSport(sport)
                                                }
                                                className={`rounded-3xl border px-5 py-5 text-left transition ${
                                                    selected
                                                        ? "border-slate-950 bg-slate-950 text-white shadow-[0_14px_35px_rgba(18,24,38,0.2)]"
                                                        : "border-[#dedbd2] bg-white text-slate-900 hover:border-slate-400"
                                                }`}
                                            >
                                                <span className="block text-lg font-black">
                                                    {sport}
                                                </span>
                                                <span
                                                    className={`mt-2 block text-sm ${selected ? "text-slate-300" : "text-slate-500"}`}
                                                >
                                                    Trivia duel
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <aside className="h-fit rounded-4xl border border-[#d7d0c1] bg-white p-6 shadow-[0_18px_70px_rgba(18,24,38,0.08)]">
                                <div className="rounded-3xl bg-[#fbfaf7] p-5 ring-1 ring-[#dedbd2]">
                                    <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                                        Selected sport
                                    </p>
                                    <p className="mt-3 text-4xl font-black tracking-tight">
                                        {selectedSport || "None yet"}
                                    </p>
                                    <p className="mt-3 leading-7 text-slate-600">
                                        Create a room after selecting a sport,
                                        or join a room if your opponent already
                                        has a code.
                                    </p>
                                </div>

                                {error && (
                                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-6 grid gap-3">
                                    <button
                                        onClick={handleCreateRoom}
                                        disabled={
                                            !selectedSport ||
                                            loading ||
                                            socketStatus !== "connected"
                                        }
                                        className="h-13 rounded-full bg-slate-950 px-6 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {loading
                                            ? "Creating room..."
                                            : socketStatus !== "connected"
                                              ? "Connecting..."
                                              : "Create room"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setError("");
                                            setGamePhase("lobby");
                                        }}
                                        className="h-13 rounded-full bg-white px-6 text-base font-black text-slate-900 ring-1 ring-[#d7d0c1] transition hover:ring-slate-400"
                                    >
                                        Join with code
                                    </button>
                                </div>
                            </aside>
                        </motion.section>
                    )}

                    {gamePhase === "lobby" && (
                        <motion.section
                            key="lobby"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="mx-auto flex max-w-xl flex-col justify-center py-12"
                        >
                            <div className="rounded-4xl border border-[#d7d0c1] bg-white p-6 shadow-[0_18px_70px_rgba(18,24,38,0.08)] sm:p-8">
                                <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                                    Join room
                                </p>
                                <h1 className="mt-3 text-4xl font-black tracking-tight">
                                    Enter your room code
                                </h1>
                                <p className="mt-3 leading-7 text-slate-600">
                                    Ask your opponent for the code, then jump
                                    into the waiting room.
                                </p>

                                <input
                                    type="text"
                                    placeholder="B7K2"
                                    value={joinCode}
                                    onChange={(e) =>
                                        setJoinCode(
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                    className="mt-7 h-16 w-full rounded-3xl border border-[#d7d0c1] bg-[#fbfaf7] px-5 text-center font-mono text-3xl font-black uppercase tracking-[0.18em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-cyan-700 focus:bg-white"
                                />

                                {error && (
                                    <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                        {error}
                                    </div>
                                )}

                                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                                    <button
                                        onClick={handleJoinRoom}
                                        disabled={
                                            !joinCode ||
                                            socketStatus !== "connected"
                                        }
                                        className="h-13 rounded-full bg-slate-950 px-6 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {socketStatus !== "connected"
                                            ? "Connecting..."
                                            : "Join room"}
                                    </button>
                                    <button
                                        onClick={() => setGamePhase("menu")}
                                        className="h-13 rounded-full bg-white px-6 text-base font-black text-slate-900 ring-1 ring-[#d7d0c1] transition hover:ring-slate-400"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {gamePhase === "waiting" && (
                        <motion.section
                            key="waiting"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="mx-auto flex max-w-2xl flex-col justify-center py-12"
                        >
                            <div className="rounded-4xl border border-[#d7d0c1] bg-white p-6 text-center shadow-[0_18px_70px_rgba(18,24,38,0.08)] sm:p-8">
                                <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                                    Waiting room
                                </p>
                                <h1 className="mt-4 text-5xl font-black tracking-tight">
                                    Room {roomCode}
                                </h1>
                                <p className="mt-4 text-lg leading-8 text-slate-600">
                                    {selectedSport
                                        ? `Sport: ${selectedSport}`
                                        : "Waiting for the host to start the game."}
                                </p>

                                <div className="mx-auto mt-8 flex w-fit gap-2 rounded-full bg-[#fbfaf7] px-5 py-4 ring-1 ring-[#dedbd2]">
                                    {[0, 1, 2].map((i) => (
                                        <motion.span
                                            key={i}
                                            animate={{
                                                opacity: [0.25, 1, 0.25],
                                            }}
                                            transition={{
                                                duration: 1.4,
                                                repeat: Infinity,
                                                delay: i * 0.2,
                                            }}
                                            className="block size-3 rounded-full bg-cyan-700"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                        {error}
                                    </div>
                                )}

                                <p className="mt-5 text-sm font-semibold text-slate-500">
                                    Socket: {socketStatus}
                                </p>

                                {selectedSport && roomCode && (
                                    <button
                                        onClick={startGame}
                                        disabled={
                                            startingGame ||
                                            socketStatus !== "connected"
                                        }
                                        className="mt-8 h-13 w-full rounded-full bg-slate-950 px-6 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-56"
                                    >
                                        {startingGame
                                            ? "Starting..."
                                            : socketStatus !== "connected"
                                              ? "Reconnecting..."
                                              : "Start game"}
                                    </button>
                                )}
                            </div>
                        </motion.section>
                    )}

                    {gamePhase === "playing" && gameState.question && (
                        <motion.section
                            key="playing"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="mx-auto max-w-4xl"
                        >
                            <div className="rounded-4xl border border-[#d7d0c1] bg-white p-5 shadow-[0_18px_70px_rgba(18,24,38,0.08)] sm:p-8">
                                <div className="grid gap-4 border-b border-[#dedbd2] pb-6 sm:grid-cols-[1fr_auto] sm:items-center">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                                            Question {gameState.questionNumber}/
                                            {gameState.totalQuestions}
                                        </p>
                                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#ece7dc]">
                                            <motion.div
                                                className="h-full rounded-full bg-cyan-700"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-[#fbfaf7] px-5 py-3 text-center ring-1 ring-[#dedbd2]">
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                                P1
                                            </p>
                                            <p className="mt-1 text-3xl font-black">
                                                {gameState.player1Score ?? 0}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-[#fbfaf7] px-5 py-3 text-center ring-1 ring-[#dedbd2]">
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                                P2
                                            </p>
                                            <p className="mt-1 text-3xl font-black">
                                                {gameState.player2Score ?? 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <h1 className="mt-8 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
                                    {gameState.question.question}
                                </h1>

                                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                    {getShuffledAnswers(gameState.question).map(
                                        (answer) => {
                                            const selected =
                                                selectedAnswer === answer;
                                            const correct =
                                                answer ===
                                                gameState.correctAnswer;
                                            const revealCorrect =
                                                isAnswered && correct;
                                            const revealWrong =
                                                isAnswered &&
                                                selected &&
                                                !gameState.isCorrect;

                                            return (
                                                <button
                                                    key={answer}
                                                    onClick={() =>
                                                        !isAnswered &&
                                                        setSelectedAnswer(
                                                            answer,
                                                        )
                                                    }
                                                    disabled={isAnswered}
                                                    className={`rounded-3xl border px-5 py-5 text-left text-base font-black transition ${
                                                        revealCorrect
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                                                            : revealWrong
                                                              ? "border-red-400 bg-red-50 text-red-900"
                                                              : selected
                                                                ? "border-slate-950 bg-slate-950 text-white"
                                                                : "border-[#dedbd2] bg-[#fbfaf7] text-slate-900 hover:border-slate-400 hover:bg-white"
                                                    }`}
                                                >
                                                    {answer}
                                                </button>
                                            );
                                        },
                                    )}
                                </div>

                                <div className="mt-7">
                                    {!isAnswered ? (
                                        <button
                                            onClick={submitAnswer}
                                            disabled={!selectedAnswer}
                                            className="h-13 w-full rounded-full bg-slate-950 px-6 text-base font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Submit answer
                                        </button>
                                    ) : (
                                        <div
                                            className={`rounded-3xl border px-5 py-4 text-center font-black ${
                                                gameState.isCorrect
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                                    : "border-red-200 bg-red-50 text-red-800"
                                            }`}
                                        >
                                            {gameState.isCorrect
                                                ? "Correct answer"
                                                : `Correct answer: ${gameState.correctAnswer}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {gamePhase === "results" && (
                        <motion.section
                            key="results"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.3 }}
                            className="mx-auto flex max-w-2xl flex-col justify-center py-12"
                        >
                            <div className="rounded-4xl border border-[#d7d0c1] bg-white p-6 text-center shadow-[0_18px_70px_rgba(18,24,38,0.08)] sm:p-8">
                                <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-800">
                                    Final score
                                </p>
                                <h1 className="mt-4 text-5xl font-black tracking-tight">
                                    {gameState.winner === "tie"
                                        ? "It's a tie"
                                        : "Game over"}
                                </h1>

                                <div className="mt-8 grid grid-cols-2 gap-3">
                                    <div className="rounded-3xl bg-[#fbfaf7] p-5 ring-1 ring-[#dedbd2]">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                                            Player 1
                                        </p>
                                        <p className="mt-2 text-5xl font-black">
                                            {gameState.player1Score ?? 0}
                                        </p>
                                    </div>
                                    <div className="rounded-3xl bg-[#fbfaf7] p-5 ring-1 ring-[#dedbd2]">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">
                                            Player 2
                                        </p>
                                        <p className="mt-2 text-5xl font-black">
                                            {gameState.player2Score ?? 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                    <button
                                        onClick={resetGame}
                                        className="h-13 rounded-full bg-slate-950 px-6 text-base font-black text-white transition hover:bg-slate-800"
                                    >
                                        Play again
                                    </button>
                                    <button
                                        onClick={() => router.push("/")}
                                        className="h-13 rounded-full bg-white px-6 text-base font-black text-slate-900 ring-1 ring-[#d7d0c1] transition hover:ring-slate-400"
                                    >
                                        Home
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
