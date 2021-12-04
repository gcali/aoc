import { Board } from ".";
import { scalarCoordinates, sumCoordinate } from "../../../../support/geometry";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface IVisualizer {
    setup(boards: Board[]): Promise<void>;
    update(board: Board): Promise<void>;
    hasWon(board: Board): Promise<void>;
    highlight(board: Board): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

const constants = (() => {
    const cellSize = {
        x: 2.5, y: 2.5
    };

    const boardPadding = { ...cellSize };

    const boardSize = sumCoordinate(
        scalarCoordinates(
            sumCoordinate(
                cellSize,
                boardPadding
            )
            , 5),
        boardPadding
    );

    const boardMargin = scalarCoordinates(cellSize, 4);

    const boardDelta = sumCoordinate(boardMargin, boardSize);
    return {
        cellSize,
        boardSize,
        boardsPerLine: 10,
        boardDelta,
        boardMargin,
        boardPadding,
        cellDelta: sumCoordinate(boardPadding, cellSize)
    };
})();

type LocalDrawable = Drawable & { type: "rectangle" };

type BoardState = {
    main: LocalDrawable,
    cells: LocalDrawable[]
};

class RealVisualizer implements IVisualizer {
    private printer!: ScreenPrinter;
    private drawables: Map<Board, BoardState> = new Map<Board, BoardState>();

    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }
    public async update(board: Board): Promise<void> {
        const drawable = this.drawables.get(board)!;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                if (board[row][col].filled) {
                    drawable.cells[row * 5 + col].color = "purple";
                }
            }
        }

        await this.pause();
    }
    public async hasWon(board: Board): Promise<void> {
        this.drawables.get(board)!.main.color = "green";
        await this.pause();
    }
    public async highlight(board: Board): Promise<void> {
        this.drawables.get(board)!.main.color = "red";
        await this.pause();
    }

    public async setup(boards: Board[]): Promise<void> {
        const lines = Math.ceil(boards.length / constants.boardsPerLine);

        const fullSize = sumCoordinate(
            constants.boardMargin,
            {
                x: constants.boardDelta.x * constants.boardsPerLine + constants.boardMargin.x,
                y: constants.boardDelta.y * lines + constants.boardMargin.y
            }
        );

        this.printer = await this.screenBuilder.requireScreen(fullSize);

        let currentLine = 0;
        let currentColumn = 0;
        for (const board of boards) {
            if (currentColumn >= constants.boardsPerLine) {
                currentLine++;
                currentColumn -= constants.boardsPerLine;
            }
            const key = JSON.stringify({ currentLine, currentColumn });
            const c = {
                x: constants.boardDelta.x * currentColumn + constants.boardMargin.x,
                y: constants.boardDelta.y * currentLine + constants.boardMargin.y
            };
            const mainBoard: LocalDrawable = {
                c: {
                    x: constants.boardDelta.x * currentColumn + constants.boardMargin.x,
                    y: constants.boardDelta.y * currentLine + constants.boardMargin.y
                },
                color: "blue",
                id: key,
                size: constants.boardSize,
                type: "rectangle"
            };

            this.printer.add(mainBoard);

            const cells: LocalDrawable[] = [];
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    const cell: LocalDrawable = {
                        c: sumCoordinate(mainBoard.c, {
                            x: constants.cellDelta.x * col + constants.boardPadding.x,
                            y: constants.cellDelta.y * row + constants.boardPadding.y
                        }),
                        color: "white",
                        id: "cell-" + key + "-" + row + "-" + col,
                        size: constants.cellSize,
                        type: "rectangle"
                    };
                    cells.push(cell);
                    this.printer.add(cell);
                }
            }

            this.drawables.set(board, {
                cells,
                main: mainBoard
            });
            currentColumn++;
        }
    }
}

class DummyVisualizer implements IVisualizer {
    public async setup(boards: Board[]): Promise<void> {
    }
    public async update(board: Board): Promise<void> {
    }
    public async hasWon(board: Board): Promise<void> {
    }
    public async highlight(board: Board): Promise<void> {
    }

}
