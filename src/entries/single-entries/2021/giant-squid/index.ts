import { groupBy } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

export type Board = Array<Array<{ value: number, filled: boolean }>>;

const parseInput = (lines: string[]): {
    extraction: number[];
    boards: Board[];
} => {
    const extraction = lines[0]
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e)
        .map((e) => parseInt(e, 10))
        .filter((e) => !Number.isNaN(e));
    const boards = groupBy(lines.slice(2), 6).map((group) => {
        return group
            .map((g) => g.trim())
            .filter((e) => e.length > 5)
            .map((e) =>
                e.split(" ")
                    .map((x) => parseInt(x, 10))
                    .filter((x) => !Number.isNaN(x))
                    .map((x) => ({ value: x, filled: false }))
            );
    });
    return { extraction, boards };
};

const fillBoard = (item: number, board: Board) => {
    for (const line of board) {
        for (const cell of line) {
            if (cell.value === item) {
                cell.filled = true;
            }
        }
    }
};

const checkIfWon = (board: Board) => {
    for (const line of board) {
        if (line.every((cell) => cell.filled)) {
            return true;
        }
    }

    for (let i = 0; i < board[0].length; i++) {
        let foundFalse = false;
        for (const line of board) {
            if (!line[i].filled) {
                foundFalse = true;
                break;
            }
        }
        if (!foundFalse) {
            return true;
        }
    }
    return false;
};

const calculateBoardScore = (board: Board, extraction: number): number => {
    const unmarked = board
        .flatMap((line) => line.filter((cell) => !cell.filled).map((cell) => cell.value))
        .reduce((acc, next) => acc + next, 0);

    return unmarked * extraction;
};

export const giantSquid = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, pause, screen }) => {

        const vs = buildVisualizer(screen, pause);

        const input = parseInput(lines);

        await vs.setup(input.boards);

        for (const item of input.extraction) {
            for (const board of input.boards) {
                fillBoard(item, board);
                await vs.update(board);
                if (checkIfWon(board)) {
                    await vs.hasWon(board);
                    const score = calculateBoardScore(board, item);
                    await resultOutputCallback(score);
                    return;
                }
            }
        }
        await resultOutputCallback("Failed");
    },
    async ({ lines, outputCallback, resultOutputCallback, pause, screen }) => {
        const vs = buildVisualizer(screen, pause);
        const input = parseInput(lines);

        await vs.setup(input.boards);

        let lastWon: { n: number, b: Board } | null = null;
        for (const item of input.extraction) {
            const wonBoards: Board[] = [];
            for (const board of input.boards) {
                fillBoard(item, board);
                await vs.update(board);
                if (checkIfWon(board)) {
                    await vs.hasWon(board);
                    const score = calculateBoardScore(board, item);
                    lastWon = { n: score, b: board };
                    wonBoards.push(board);
                }
            }
            wonBoards.forEach((b) => input.boards = input.boards.filter((x) => x !== b));
        }
        if (lastWon) {
            await vs.highlight(lastWon.b);
        }

        await resultOutputCallback(lastWon && lastWon.n);
    },
    {
        key: "giant-squid",
        title: "Giant Squid",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 2
    }
);
