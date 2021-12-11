import { Coordinate, scalarCoordinates, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface IDumboOctopusVisualizer {
    setup(size: Coordinate): Promise<void>;
    update(data: FixedSizeMatrix<number>): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

class RealVisualizer implements IDumboOctopusVisualizer {
    private printer!: ScreenPrinter;
    private readonly zoom: number;
    private drawables!: FixedSizeMatrix<Drawable & { type: "rectangle"; }>;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
        this.zoom = 10;
    }

    public async setup(size: Coordinate) {
        this.printer = await this.screenBuilder.requireScreen(this.scale(size));
        this.printer.setManualRender();
        this.drawables = new FixedSizeMatrix<Drawable & {type: "rectangle"}>(size);

        for (let x = 0; x < size.x; x++) {
            for (let y = 0; y < size.y; y++) {
                const d: Drawable & {type: "rectangle"} = {
                    c: this.scale({x, y}),
                    color: "black",
                    id: serialization.serialize({x, y}),
                    size: this.scale({x: 1, y: 1}),
                    type: "rectangle"
                };

                this.drawables.set({x, y}, d);
                this.printer.add(d);
            }
        }

        this.printer.forceRender();
    }

    public async update(data: FixedSizeMatrix<number>): Promise<void> {
        const baseColor = "#cccccc";
        const colorCalculator = (v: number) => {
            if (v > 9) {
                return "white";
            }
            const ratio = v / 9;
            const alpha = 50 + Math.floor(150 * ratio);
            return baseColor + alpha.toString(16).padStart(2, "0");
        };
        data.onEveryCellSync((c, e) => {
            if (e === undefined) {
                return;
            }
            const d = this.drawables.get(c);
            if (d === undefined) {
                return;
            }
            d.color = colorCalculator(e);
        });

        this.printer.forceRender();
        await this.pause();

    }

    private scale(c: Coordinate): Coordinate {
        return scalarCoordinates(c, this.zoom);
    }
}

class DummyVisualizer implements IDumboOctopusVisualizer {
    public async setup(size: Coordinate): Promise<void> {
    }
    public async update(data: FixedSizeMatrix<number>): Promise<void> {
    }

}
