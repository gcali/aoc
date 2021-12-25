import { State } from ".";
import { permutationGenerator } from "../../../../support/sequences";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface IAmphipodVisualizer {
    showStates(states: string[]): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

class RealVisualizer implements IAmphipodVisualizer {
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }
    public async showStates(states: string[]): Promise<void> {
        const matching: {[key: string]: string} = {
            "#": "black",
            // ".": "white",
            "A": "yellow",
            "B": "green",
            "C": "red",
            "D": "blue"
        };

        const cellSize = 20;
        const cellPadding = 1;

        const grids = states.map((state) => state.split("\n"));

        const height = grids[0].length;
        const width = Math.max(...grids[0].map((s) => s.length));

        const printer = await this.screenBuilder.requireScreen({x: width * cellSize, y: height * cellSize});

        printer.setManualRender();

        for (const state of states) {
            const grid = state.split("\n");
            const drawables: Drawable[] = [];
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const color = matching[grid[row][col]];
                    if (!color) {
                        continue;
                    }
                    drawables.push({
                        type: "rectangle",
                        c: {
                            x: cellSize * col + cellPadding,
                            y: cellSize * row + cellPadding
                        },
                        color,
                        id: JSON.stringify({row, col}),
                        size: {x: cellSize - cellPadding, y: cellSize - cellPadding},
                    });
                }
            }
            printer.replace(drawables);
            printer.forceRender();
            await this.pause();
        }
    }
}

class DummyVisualizer implements IAmphipodVisualizer {
    public async showStates(states: string[]): Promise<void> {
    }

}
