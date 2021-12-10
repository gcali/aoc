import { scalarCoordinates, serialization } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { Drawable, MediaQuery, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface IHydrothermalVentureVisualizer {
    show(matrix: FixedSizeMatrix<number>): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause, mediaQuery: MediaQuery) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause, mediaQuery);
    } else {
        return new DummyVisualizer();
    }
};

class RealVisualizer implements IHydrothermalVentureVisualizer {
    private printer!: ScreenPrinter;
    private readonly zoom: number;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause,
        mediaQuery: MediaQuery
    ) {
        this.zoom = mediaQuery.isMobile() ? 0.35 : 1;
    }
    public async show(matrix: FixedSizeMatrix<number>): Promise<void> {
        this.printer = await this.screenBuilder.requireScreen(scalarCoordinates(matrix.size, this.zoom));

        let maxValue = 0;

        await matrix.onEveryCell(async (c, e) => {
            maxValue = Math.max(e || 0, maxValue);
            await this.pause();
        });

        const colorCalculator = (n: number): string => {
            const baseColor = "#000000";
            const base = 128;
            const alpha = base + Math.ceil((256 - base) * (n / maxValue));
            return baseColor + alpha.toString(16).padStart(2, "0");
        };

        const unpause = this.printer.pause();

        await matrix.onEveryCell(async (c, e) => {
            if (e && e > 0) {
                const d: Drawable = {
                    id: serialization.serialize(c),
                    c: scalarCoordinates(c, this.zoom),
                    color: colorCalculator(e),
                    type: "rectangle",
                    size: scalarCoordinates({x: 1, y: 1}, this.zoom)
                };
                this.printer.add(d);
                await this.pause();
            }
        });

        unpause();

        this.printer.forceRender();

        this.printer.pause();
    }
}

class DummyVisualizer implements IHydrothermalVentureVisualizer {
    public async show(matrix: FixedSizeMatrix<number>): Promise<void> {
    }

}
