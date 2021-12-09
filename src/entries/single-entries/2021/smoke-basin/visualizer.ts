import { scalarCoordinates, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface ISmokeBasinVisualizer {
    setup(data: FixedSizeMatrix<number>): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

const co = (() => {
    return {
        zoom: 5
    };
})();

class RealVisualizer implements ISmokeBasinVisualizer {
    private printer!: ScreenPrinter;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }
    public async setup(data: FixedSizeMatrix<number>): Promise<void> {
        this.printer = await this.screenBuilder.requireScreen(scalarCoordinates(data.size, co.zoom));
        const drawables: Array<Drawable & {type: "rectangle"}> = [];
        const baseColor = "#722424";
        const colorCalculator = (v: number) => {
            if (v === 9) {
                return "black";
            }
            const ratio = 1 - v / 9;
            const alpha = Math.floor(256 * ratio);
            return baseColor + alpha.toString(16).padStart(2, "0");
        };
        data.onEveryCellSync((c, e) => {
            if (e === undefined) {
                return;
            }
            drawables.push({
                color: colorCalculator(e),
                c: scalarCoordinates(c, co.zoom),
                id: serialization.serialize(c),
                type: "rectangle",
                size: {x: co.zoom, y: co.zoom}
            });
        });

        drawables.forEach((d) => this.printer.add(d));

        this.printer.forceRender();
    }
}

class DummyVisualizer implements ISmokeBasinVisualizer {
    public async setup(data: FixedSizeMatrix<number>): Promise<void> {
    }

}
