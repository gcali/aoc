import { Coordinate, scalarCoordinates, serialization, sumCoordinate } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface ITransparentOrigamiVisualizer {
    show(matrix: FixedSizeMatrix<"#">): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause, isSmall: boolean) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause, isSmall);
    } else {
        return new DummyVisualizer();
    }
};

class RealVisualizer implements ITransparentOrigamiVisualizer {
    private shown: boolean = false;
    private readonly zoom: Coordinate;
    private printer!: ScreenPrinter;
    private readonly cellSize: Coordinate;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause,
        isSmall: boolean
    ) {
        this.zoom = isSmall ? {x: 0.7, y: 0.7} : {x: 10, y: 10};
        this.cellSize = isSmall ? scalarCoordinates(this.zoom, 3) : this.zoom;
    }

    public async show(matrix: FixedSizeMatrix<"#">): Promise<void> {
        if (this.shown) {
            throw new Error("Can show only once");
        }
        this.shown = true;

        this.printer = await this.screenBuilder.requireScreen(
            sumCoordinate(this.scale(matrix.size), this.cellSize)
        );

        const points: Coordinate[] = [];

        matrix.onEveryCellSync((c, e) => {
            if (e === "#") {
                points.push(c);
            }
        });

        const drawables = points.map((c) => ({
            type: "rectangle",
            c: this.scale(c),
            color: "black",
            id: serialization.serialize(c),
            size: this.cellSize,
        } as Drawable & {type: "rectangle"}));

        this.printer.setManualRender();

        this.printer.replace(drawables);

        this.printer.forceRender();
    }

    private scale(c: Coordinate): Coordinate {
        return {
            x: c.x * this.zoom.x,
            y: c.y * this.zoom.y
        };
    }
}

class DummyVisualizer implements ITransparentOrigamiVisualizer {
    public async show(matrix: FixedSizeMatrix<"#">): Promise<void> {
    }

}
