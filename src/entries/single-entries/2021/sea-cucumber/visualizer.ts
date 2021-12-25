import { Cell } from ".";
import { Coordinate, diffCoordinate, scalarCoordinates, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { Drawable, MediaQuery, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";
import { deepSea, seaBackground } from "../support/submarine";

export interface ISeaCucumberVisualizer {
    setup(size: Coordinate): Promise<void>;
    show(matrix: FixedSizeMatrix<Cell>): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause, mediaQuery: MediaQuery) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause, mediaQuery);
    } else {
        return new DummyVisualizer();
    }
};

class RealVisualizer implements ISeaCucumberVisualizer {
    private printer!: ScreenPrinter;
    private drawables?: FixedSizeMatrix<Drawable>;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause,
        private readonly mediaQuery: MediaQuery
    ) {
    }
    public async setup(size: Coordinate): Promise<void> {
        const cellSize = this.mediaQuery.isMobile() ? 2 : 5;
        const cellPadding = this.mediaQuery.isMobile() ? 0 : 1;
        this.printer = await this.screenBuilder.requireScreen(scalarCoordinates(size, cellSize));
        // this.printer.setManualRender();
        // this.printer.setManualInvalidate();
        this.drawables = new FixedSizeMatrix<Drawable>(size);
        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                const d: Drawable = {
                    type: "rectangle",
                    c: sumCoordinate(scalarCoordinates({x, y}, cellSize), {x: cellPadding, y: cellPadding}),
                    color: "white",
                    id: JSON.stringify({x, y}),
                    size: {
                        x: cellSize - cellPadding,
                        y: cellSize - cellPadding
                    }
                };
                this.drawables.set({x, y}, d);
                this.printer.add(d);
            }
        }
    }
    public async show(matrix: FixedSizeMatrix<Cell>): Promise<void> {
        matrix.onEveryCellSyncUnsafe((c, e) => {
            const color = e === "." ? deepSea : (e === ">" ? "#fae520" : "teal");
            if (!this.drawables) {
                throw new Error("Setup not called");
            }
            const drawable = this.drawables.getUnsafe(c);
            // this.printer.invalidate(drawable);
            drawable.color = color;
        });
        // this.printer.forceRender();
        await this.pause();
    }
}

class DummyVisualizer implements ISeaCucumberVisualizer {
    public async setup(size: Coordinate): Promise<void> {
    }
    public async show(matrix: FixedSizeMatrix<Cell>): Promise<void> {
    }

}
