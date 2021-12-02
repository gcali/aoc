import { multiplyCoordinate } from "../../../../support/geometry";
import { MyIterable } from "../../../../support/sequences";
import { Drawable, MediaQuery, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";
import { squaresWithThreeSides } from "../../2016/squares-with-three-sides";
import { Submarine } from "../support/submarine";

export interface ISonarSweepVisualizer {
    setup(items: number[], mediaQuery: MediaQuery): Promise<void>;
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
    // const submarineSize = {x: 15, y: 10};
    const submarineSize = {x: 0, y: 0};
    const padding = {x: 2, y: 0};
    const fullSize = {x: padding.x + cellSize.x, y: 0};
    const leftMargin = 0 + submarineSize.x;
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
    public async setup(items: number[], mediaQuery: MediaQuery): Promise<void> {
        if (mediaQuery.isMobile()) {
            constants.maxSize = 70;
        }
        items = items.map((i) => i * 0.05);
        this.items = items;
        const size = {
            x: constants.leftMargin + Math.min(constants.maxSize, items.length) * (constants.fullSize.x),
            y: Math.max(constants.submarineSize.y, new MyIterable(items).reduce(0, Math.max) * constants.cellSize.y)
        };
        const screenSize = size;
        this.printer = await this.screenBuilder.requireScreen(screenSize);
        this.printer.setManualRender();

        const sub = new Submarine();

        sub.magnify(2);

        sub.translate({x: 80, y: 18});

        sub.print(this.printer);

        // this.printer.add({
        //     c: {x: 2, y: 2},
        //     id: "submarine",
        //     color: "yellow",
        //     type: "rectangle",
        //     size: constants.submarineSize
        // });

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
            this.printer.remove((this.nextItem - constants.maxSize - 1).toString());
            const previousDrawables = this.drawables;
            this.drawables = [];
            for (const drawable of previousDrawables) {
                drawable.c.x -= constants.fullSize.x;
                if (drawable.c.x > constants.leftMargin) {
                    this.drawables.push(drawable);
                }
            }
        }
        const item: LocalDrawable = {
            c,
            color: increasing ? "#ff000042" : "#ffffff47",
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
        if (this.nextItem >= constants.maxSize) {
            this.printer.forceRender();
            await this.pause();
        }
    }

}

class DummyVisualizer implements ISonarSweepVisualizer {
    public async setup(items: number[]): Promise<void> {
    }
    public async update(): Promise<void> {
    }

}

