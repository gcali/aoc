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
        maxSize: 200
    };
})();

type LocalDrawable = Drawable & {type: "rectangle"};

class RealVisualizer implements ISonarSweepVisualizer {
    private printer!: ScreenPrinter;
    private nextItem: number = 0;
    private items: number[] | null = null;
    private drawables: LocalDrawable[] = [];

    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }
    public async setup(items: number[]): Promise<void> {
        items = items.map(i => i * 0.05);
        this.items = items;
        const size = {
            x: constants.leftMargin + Math.min(constants.maxSize, items.length) * (constants.fullSize.x),
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
        const c = this.nextItem >= constants.maxSize ? {
            x: constants.leftMargin + constants.fullSize.x * constants.maxSize,
            y: 0
        } : {
            x: constants.leftMargin + constants.fullSize.x * this.nextItem,
            y: 0
        };
        // const c = {
        //     x: constants.leftMargin + constants.fullSize.x * this.nextItem,
        //     y: 0
        // };
        if (this.nextItem > constants.maxSize) {
            this.printer.remove((this.nextItem-constants.maxSize-1).toString());
            for (const item of this.drawables) {
                item.c.x -= constants.fullSize.x;
            }
        }
        // if (this.nextItem >= 51) {
        //     this.printer.remove((this.nextItem-51).toString());
        //     for (const item of this.drawables) {
        //         item.c.x -= constants.fullSize.x;
        //     }
        // }
        const item: LocalDrawable = 
            {
            c,
            color: increasing ? "red" : "white",
            id: this.nextItem.toString(),
            type: "rectangle",
            size: {
                x: constants.cellSize.x,
                y: constants.cellSize.y * this.items[this.nextItem]
            }
        };
        this.drawables.push(item);
        this.printer.add(item);
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
