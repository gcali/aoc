import { Cube } from '.';
import { oppositeCoordinate, scalarCoordinates, sumCoordinate } from '../../../../support/geometry';
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from '../../../entry';

export interface ICubeConundromVisualizer {
    setBag(bag: BagContent): Promise<void>;
    setup(): Promise<void>;
    extractGems({cube, amount}: {cube: Cube, amount: number}): Promise<void>;
    setRunOver(hasRunOver: boolean): Promise<void>;

}

export type BagContent = Record<Cube, number>;

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
}

const constants = ((maxCubes: number) => {
    const cubeSize = {x: 8, y: 8};
    const borderSize = {x: 1, y: 1};
    const cubeMargin = {x: 2, y: 2};
    const bagSize = {
        x: borderSize.x * 2 + cubeMargin.x + (cubeMargin.x + cubeSize.x) * 6,
        y: borderSize.y * 2 + cubeMargin.y + (cubeMargin.y + cubeSize.y) * (Math.ceil(maxCubes/2))
    };
    const bagStart = borderSize;
    const tableLine = {
        c: {x: bagStart.x - 1, y: bagStart.y + bagSize.y },
        size: {x: bagSize.x * 3, y: cubeMargin.y * 2}
    };
    const bagBottom = {
        x: bagStart.x + borderSize.x + cubeMargin.x,
        y: bagStart.y + bagSize.y - borderSize.y - cubeMargin.y - cubeSize.y
    };
    const screenSize = {
        x: tableLine.size.x + cubeMargin.x,
        y: tableLine.c.y + tableLine.size.y
    };

    const tablePositions = {
        y: tableLine.c.y - cubeMargin.y - cubeSize.y,
        x: {
            "red": bagStart.x + bagSize.x + cubeMargin.x * 2,
            "green": bagStart.x + bagSize.x + cubeMargin.x * 2 + (cubeSize.x + cubeMargin.x) *  2,
            "blue": bagStart.x + bagSize.x + cubeMargin.x * 2 + (cubeSize.x + cubeMargin.x) * 4
        } as Record<Cube, number>
    };

    const winSquareSize = {
        x: 40,
        y: 40
    };
    return {
        cubeSize,
        borderSize,
        cubeMargin,
        bagSize,
        bagStart,
        tableLine,
        bagBottom,
        screenSize,
        tablePositions,
        winSquareSize
    };
});

type CubeDrawable = Drawable & {type: "rectangle"};

class RealVisualizer implements ICubeConundromVisualizer {
    private printer!: ScreenPrinter;
    private size!: { x: number; y: number; };
    private constants!: ReturnType<typeof constants>;

    private mainBagItems: Record<Cube, CubeDrawable[]> = {
        "red": [],
        "green": [],
        "blue": []
    };

    private tableItems: Record<Cube, CubeDrawable[]> = {
        "red": [],
        "green": [],
        "blue": []
    };

    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) { 
    }

    public async setup() {
        this.constants = constants(20);
        this.size = this.constants.screenSize;
        this.printer = await this.screenBuilder.requireScreen(this.size);
        this.printer.add({
            type: "rectangle",
            color: "black",
            c: this.constants.bagStart,
            size: this.constants.bagSize,
            id: "main-bag-border"
        });
        this.printer.add({
            type: "rectangle",
            color: "navajowhite",
            c: sumCoordinate(this.constants.bagStart, this.constants.borderSize),
            size: sumCoordinate(this.constants.bagSize, oppositeCoordinate(scalarCoordinates(this.constants.borderSize, 2))),
            id: "main-bag-background"
        });
        this.printer.add({
            type: "rectangle",
            color: "brown",
            c: this.constants.tableLine.c,
            size: this.constants.tableLine.size,
            id: "table"
        });
    }

    public async setBag(bag: BagContent) {
        for (const value of Object.values(this.mainBagItems)) {
            for (const item of value) {
                this.printer.remove(item.id);
            }
            value.length = 0;
        }
        for (const range of Object.values(this.tableItems)) {
            for (const item of range) {
                this.printer.remove(item.id);
            }
            range.length = 0;
        }
        const cubeSize = {x: 8, y: 8};
        let {x,y} = this.constants.bagBottom;
        let i = 0;
        for (const key of Object.keys(bag) as Cube[]) {
            const amount = bag[key];
            for (let i = 0; i < amount; i++) {
                const item = {
                    type: "rectangle",
                    color: key,
                    c: {x, y },
                    size: cubeSize,
                    id: `${key}-main-${i}`
                } as CubeDrawable;

                this.mainBagItems[key].push(item)
                this.printer.add(item);
                y -= this.constants.cubeSize.y + this.constants.cubeMargin.y;
                if (y <= this.constants.bagStart.y) {
                    y = this.constants.bagBottom.y;
                    x += this.constants.cubeMargin.x + this.constants.cubeSize.x;
                }
            }
            i++;
            y = this.constants.bagBottom.y;
            x = this.constants.bagBottom.x + (this.constants.cubeMargin.x + this.constants.cubeSize.x) * (i * 2);
        }
    }

    public async extractGems({cube, amount}: {cube: Cube, amount: number}) {
        const tableItems = this.tableItems[cube];
        let x = this.constants.tablePositions.x[cube];
        for (let i = 0; i < amount; i++) {
            const lastItem = this.mainBagItems[cube].pop();
            if (lastItem) {
                const baseY = this.constants.tablePositions.y;
                const lastY = Math.min(baseY + this.constants.cubeSize.y + this.constants.cubeMargin.y, ...tableItems.map(t => t.c.y));
                let nextY = lastY - this.constants.cubeSize.y - this.constants.cubeMargin.y;
                if (nextY <= this.constants.bagStart.y) {
                    nextY = this.constants.tablePositions.y;
                    x += this.constants.cubeMargin.x + this.constants.cubeSize.x;
                }
                lastItem.c = {x, y: nextY};
                tableItems.push(lastItem);
                await this.pause();
            } else {
            }
        }
    }

    public async setRunOver(hasRunOver: boolean) {
        const square: Drawable = {
            type: "rectangle",
            size: this.constants.winSquareSize,
            color: hasRunOver ? "red" : "green",
            c: {
                x: this.size.x - this.constants.winSquareSize.x - this.constants.cubeMargin.x,
                y: Math.floor(this.size.y / 2 - this.constants.winSquareSize.y / 2)
            },
            id: "win-state"
        };
        this.printer.add(square);
        await this.pause(20);
        this.printer.remove(square.id);
    }
}

class DummyVisualizer implements ICubeConundromVisualizer {
    async extractGems({ cube, amount }: { cube: 'red' | 'green' | 'blue'; amount: number; }): Promise<void> { }
    async setup(): Promise<void> {}
    async setBag(bag: BagContent): Promise<void> { }
    async setRunOver(hasRunOver: boolean): Promise<void> {}

}