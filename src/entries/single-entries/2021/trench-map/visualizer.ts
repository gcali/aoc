import { UnknownSizeField } from "../../../../support/field";
import { Coordinate, scalarCoordinates, sumCoordinate } from "../../../../support/geometry";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

type Cell = "#" | ".";

export interface ITrenchMapVisualizer {
    setup(baseSize: Coordinate, iterations: number): Promise<void>;
    show(points: UnknownSizeField<Cell>, empty: Cell): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

class RealVisualizer implements ITrenchMapVisualizer {
    private get marginCell() {
        return {x: this.margin, y: this.margin};
    }
    private printer!: ScreenPrinter;

    private cellSize = 2;
    private delta!: Coordinate;
    private margin!: number;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }
    public async setup(baseSize: Coordinate, iterations: number): Promise<void> {
        this.margin = iterations;
        const screenSize = this.scale(sumCoordinate(baseSize, scalarCoordinates(this.marginCell, 2)));
        this.printer = await this.screenBuilder.requireScreen(screenSize);
        this.printer.setManualRender();
    }
    public async show(points: UnknownSizeField<Cell>, empty: Cell): Promise<void> {
        const d: Array<Drawable & {type: "rectangle"}> = [];
        for (const point of points.getPoints()) {
            d.push({
                c: this.transform(point.c),
                color: point.e === "#" ? "white" : "black",
                id: JSON.stringify(point.c),
                size: {x: this.cellSize, y: this.cellSize},
                type: "rectangle",
            });
        }
        this.printer.replace(d);
        this.printer.forceRender();
        await this.pause();
    }
    private scale(c: Coordinate): Coordinate {
        return scalarCoordinates(c, this.cellSize);
    }

    private transform(c: Coordinate): Coordinate {
        return this.scale(sumCoordinate(c, this.marginCell));
    }
}

class DummyVisualizer implements ITrenchMapVisualizer {
    public async setup(baseSize: Coordinate, iterations: number): Promise<void> {
    }
    public async show(points: UnknownSizeField<Cell>, empty: Cell): Promise<void> {
    }

}
