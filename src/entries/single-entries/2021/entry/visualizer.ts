import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "entries/entry";
import { Coordinate, multiplyCoordinate } from "support/geometry";
import { FixedSizeMatrix } from "support/matrix";
import { MyIterable } from "support/sequences";

export interface ISonarSweepVisualizer {
    setup(items: number[]): Promise<void>;
    update(): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

const constants = (() => {
    const cellSize = {x: 2, y: 2};
    const submarineSize = {x: 10, y: 2};
    const padding = {x: 5, y: 0};
    const fullSize = {x: padding.x + cellSize.x, y: 0};
    const leftMargin = padding.x + submarineSize.x;
    return {
        cellSize,
        submarineSize,
        padding,
        fullSize,
        leftMargin,
    };
})();

type LocalDrawable = Drawable & {type: "rectangle"};

class RealVisualizer implements ISonarSweepVisualizer {
    private printer!: ScreenPrinter;
    private nextItem: number = 0;
    private items: number[] | null = null;

    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }
    public async setup(items: number[]): Promise<void> {
        const size = {
            x: constants.submarineSize.x + items.length + (constants.padding.x + constants.cellSize.x),
            y: Math.max(constants.submarineSize.y, new MyIterable(items).reduce(0, Math.max))
        }
        const screenSize = multiplyCoordinate(size, constants.cellSize);
        this.printer = await this.screenBuilder.requireScreen(screenSize);
        this.printer.setManualRender();

        this.printer.add({
            c: {x: 0, y: 0},
            id: "submarine",
            color: "yellow",
            type: "rectangle",
            size: constants.submarineSize
        });

        this.printer.forceRender();
        await this.pause();
    }
    public async update(): Promise<void> {
        if (this.items === null) {
            return;
        }
        this.printer.add({
            c: {
                x: constants.leftMargin + constants.fullSize.x * this.nextItem,
                y: this.items[this.nextItem] * constants.cellSize.y
            },
            color: "white",
            id: this.nextItem.toString(),
            type: "rectangle",
            size: {
                x: constants.cellSize.x,
                y: constants.cellSize.y * this.items[this.nextItem]
            }
        });
        this.nextItem++;
        if (this.nextItem >= this.items.length) {
            this.items = null;
        }
        this.printer.forceRender();
        await this.pause();
    }

}

class DummyVisualizer implements ISonarSweepVisualizer {
    async setup(items: number[]): Promise<void> {
    }
    async update(): Promise<void> {
    }

}

