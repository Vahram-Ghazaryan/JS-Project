import { useEffect } from "react";
import Head from "next/head";

export default function SapperPage() {
    useEffect(() => {
        const size = 8;
        const bombCount = 10;
        const board = [];
        const totalSafeCells = size * size - bombCount;

        let gameOver = false;
        let revealedCount = 0;

        let timer = 0;
        let timerInterval = null;
        let timerStarted = false;

        const boardAndBtn = document.createElement("div");
        boardAndBtn.id = "boardAndBtn";
        boardAndBtn.className =
            "flex flex-col items-center fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]";
        document.body.appendChild(boardAndBtn);

        const timerElement = document.createElement("div");
        timerElement.id = "timer";
        timerElement.className =
            "pb-2.5 text-[32px] font-mono font-bold text-[#30dcef] border-none bg-transparent";
        timerElement.textContent = "000";
        boardAndBtn.appendChild(timerElement);

        const boardElement = document.createElement("div");
        boardElement.id = "board";
        boardElement.className =
            "grid grid-cols-[repeat(8,40px)] grid-rows-[repeat(8,40px)] gap-0.5";
        boardAndBtn.appendChild(boardElement);

        const messageElement = document.createElement("div");
        messageElement.id = "gameMessage";
        messageElement.className =
            "absolute top-[25%] left-1/2 -translate-x-1/2 text-center text-[64px] font-bold text-[hsl(178,90%,84%)] bg-[hsla(240,86%,59%,0.556)] shadow-[0_0_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,0,0,0.3)] px-10 py-2 z-10 pointer-events-none whitespace-nowrap hidden";
        boardAndBtn.appendChild(messageElement);

        const directions = [
            [-1, -1],
            [-1, 0],
            [-1, 1],
            [0, -1],
            [0, 1],
            [1, -1],
            [1, 0],
            [1, 1],
        ];

        function placeBombs() {
            let bombs = 0;
            while (bombs < bombCount) {
                const x = Math.floor(Math.random() * size);
                const y = Math.floor(Math.random() * size);
                if (!board[y][x].isBomb) {
                    board[y][x].isBomb = true;
                    ++bombs;
                }
            }
        }

        function calculateNumbers() {
            placeBombs();
            for (let y = 0; y < size; ++y) {
                for (let x = 0; x < size; ++x) {
                    if (!board[y][x].isBomb) {
                        let count = 0;
                        for (let [dy, dx] of directions) {
                            const nextY = y + dy,
                                nextX = x + dx;
                            if (
                                nextY >= 0 &&
                                nextY < size &&
                                nextX >= 0 &&
                                nextX < size &&
                                board[nextY][nextX].isBomb
                            ) {
                                ++count;
                            }
                        }
                        board[y][x].number = count;
                    }
                }
            }
        }

        function reveal(y, x) {
            if (gameOver) return;
            if (y < 0 || y >= size || x < 0 || x >= size) {
                return;
            }
            if (!timerStarted) {
                timerStarted = true;
                timerInterval = setInterval(() => {
                    ++timer;
                    timerElement.textContent = timer
                        .toString()
                        .padStart(3, "0");
                }, 1000);
            }
            const cell = board[y][x];
            const element = cell.element;
            if (cell.revealed) {
                return;
            }
            cell.revealed = true;
            element.classList.remove(
                "bg-[#6262f3]",
                "hover:scale-105",
                "hover:bg-[#a0a0f4]",
                "cursor-pointer",
            );
            element.classList.add("bg-[#a4a2a2]", "cursor-default");
            ++revealedCount;

            if (cell.number > 0) {
                element.textContent = cell.number;
            }

            if (revealedCount === totalSafeCells) {
                endGame(true);
                return;
            }

            if (cell.isBomb) {
                element.textContent = "💣";
                element.classList.remove("bg-[#a4a2a2]");
                element.classList.add("bg-red-600");
                revealAllBombs();
                endGame(false);
                return;
            }

            for (let [dy, dx] of directions) {
                const nextY = y + dy;
                const nextX = x + dx;
                if (nextY >= 0 && nextY < size && nextX >= 0 && nextX < size) {
                    const neighbor = board[nextY][nextX];
                    if (!neighbor.revealed && !neighbor.isBomb) {
                        neighbor.revealed = true;
                        neighbor.element.classList.remove(
                            "bg-[#6262f3]",
                            "hover:scale-105",
                            "hover:bg-[#a0a0f4]",
                            "cursor-pointer",
                        );
                        neighbor.element.classList.add(
                            "bg-[#a4a2a2]",
                            "cursor-default",
                        );
                        ++revealedCount;
                        if (neighbor.number > 0) {
                            neighbor.element.textContent = neighbor.number;
                        }
                        if (revealedCount === totalSafeCells) {
                            endGame(true);
                            return;
                        }
                    }
                }
            }
        }

        function revealAllBombs() {
            let time = 2;
            for (let y = 0; y < size; ++y) {
                for (let x = 0; x < size; ++x) {
                    const cell = board[y][x];
                    if (cell.isBomb) {
                        setTimeout(() => {
                            cell.element.textContent = "💣";
                            cell.element.classList.remove(
                                "bg-[#6262f3]",
                                "hover:scale-105",
                                "hover:bg-[#a0a0f4]",
                            );
                            cell.element.classList.add("bg-red-600");
                        }, time * 150);
                        ++time;
                    }
                }
            }
        }

        function endGame(win) {
            clearInterval(timerInterval);
            gameOver = true;
            messageElement.textContent = win ? "You Win!!!" : "You Lost!";
            messageElement.classList.remove("hidden");
            createRestartBtn();
        }

        function createRestartBtn() {
            const btn = document.createElement("button");
            btn.textContent = "New Game";
            btn.id = "restartBtn";
            btn.className =
                "w-[135px] h-[58px] mt-5 px-5 py-2.5 text-lg bg-[#0000f4] text-white border-none rounded-[10px] cursor-pointer transition-all duration-300 ease-in-out hover:bg-[#4b4bf5] hover:scale-110 hover:no-underline";

            btn.addEventListener("click", () => {
                window.location.reload();
            });

            boardAndBtn.appendChild(btn);
        }

        for (let y = 0; y < size; ++y) {
            board[y] = [];
            for (let x = 0; x < size; ++x) {
                const element = document.createElement("div");
                element.className =
                    "w-10 h-10 bg-[#6262f3] text-white font-bold text-xl flex justify-center items-center cursor-pointer select-none transition-all duration-300 ease-in-out hover:scale-105 hover:bg-[#a0a0f4]";
                boardElement.appendChild(element);

                const cell = {
                    x,
                    y,
                    isBomb: false,
                    number: 0,
                    revealed: false,
                    element,
                };

                element.addEventListener("click", () => reveal(y, x));
                board[y][x] = cell;
            }
        }

        calculateNumbers();

        // Cleanup function
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
            if (boardAndBtn && boardAndBtn.parentNode) {
                boardAndBtn.parentNode.removeChild(boardAndBtn);
            }
        };
    }, []);

    return (
        <>
            <Head>
                <title>Sapper</title>
            </Head>
            <div className="flex justify-center items-center bg-[#3535ad] min-h-screen"></div>
        </>
    );
}
