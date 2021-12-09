import { Coordinate, scalarCoordinates, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { Drawable, MediaQuery, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface ISmokeBasinVisualizer {
    setup(data: FixedSizeMatrix<number>): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause, mediaQuery: MediaQuery) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause, mediaQuery);
    } else {
        return new DummyVisualizer();
    }
};

const co = (() => {
    return {
        fullZoom: 5,
        smallZoom: 3
    };
})();

class RealVisualizer implements ISmokeBasinVisualizer {
    private printer!: ScreenPrinter;
    private readonly zoom: number;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause,
        mediaQuery: MediaQuery
    ) {
        this.zoom = mediaQuery.isMobile() ? co.smallZoom : co.fullZoom;
    }
    public async setup(data: FixedSizeMatrix<number>): Promise<void> {
        this.printer = await this.screenBuilder.requireScreen(this.scale(data.size));
        const drawables: Array<Drawable & {type: "rectangle"}> = [];
        const baseColor = "#722424";
        const colorCalculator = (v: number) => {
            if (v === 9) {
                return "black";
            }
            const ratio = 1 - v / 9;
            const alpha = 128 + Math.floor(128 * ratio);
            return baseColor + alpha.toString(16).padStart(2, "0");
        };
        data.onEveryCellSync((c, e) => {
            if (e === undefined) {
                return;
            }
            drawables.push({
                color: colorCalculator(e),
                c: this.scale(c),
                id: serialization.serialize(c),
                type: "rectangle",
                size: {x: this.zoom, y: this.zoom}
            });
        });

        drawables.forEach((d) => this.printer.add(d));

        this.printer.forceRender();
    }

    private scale(c: Coordinate): Coordinate {
     return scalarCoordinates(c, this.zoom);
    }
}

class DummyVisualizer implements ISmokeBasinVisualizer {
    public async setup(data: FixedSizeMatrix<number>): Promise<void> {
    }

}
