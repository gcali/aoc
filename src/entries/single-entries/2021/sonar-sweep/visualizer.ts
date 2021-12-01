import { multiplyCoordinate } from "../../../../support/geometry";
import { MyIterable } from "../../../../support/sequences";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface ISonarSweepVisualizer {
    setup(items: number[]): Promise<void>;
    update(increasing: boolean): Promise<void>;
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
    const submarineSize = {x: 10, y: 10};
    const padding = {x: 2, y: 0};
    const fullSize = {x: padding.x + cellSize.x, y: 0};
    const leftMargin = 20 + submarineSize.x;
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
        items = items.map(i => i * 0.1);
        this.items = items;
        const size = {
            x: constants.leftMargin + items.length * (constants.fullSize.x),
            y: Math.max(constants.submarineSize.y, new MyIterable(items).reduce(0, Math.max) * constants.cellSize.y)
        }
        const screenSize = size;
        this.printer = await this.screenBuilder.requireScreen(screenSize);
        this.printer.setManualRender();

        this.printer.add({
            c: {x: 2, y: 2},
            id: "submarine",
            color: "yellow",
            type: "rectangle",
            size: constants.submarineSize
        });

        this.printer.forceRender();
        await this.pause();
    }
    public async update(increasing: boolean): Promise<void> {
        if (this.items === null) {
            return;
        }
        this.printer.add({
            c: {
                x: constants.leftMargin + constants.fullSize.x * this.nextItem,
                y: 0
            },
            color: increasing ? "red" : "white",
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

