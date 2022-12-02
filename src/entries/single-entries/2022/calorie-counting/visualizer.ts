import { CalorieCountingData } from '.';
import { sumCoordinate } from '../../../../support/geometry';
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from '../../../entry';

export interface ICalorieCountingVisualizer {
    showOnScreen(data: CalorieCountingData): Promise<void>;
    setMax(index: number): Promise<void>;
    setCurrent(index: number | undefined): Promise<void>;
    removeMax(index: number): Promise<void>;
}

const constants = (() => {
    const cols = 15;
    const padding = 2;
    const border = 1;
    const miniSize = 2;

    const miniCols = 4;
    const miniRows = 4;

    const itemSize = {
        x: border * 2 + padding * (miniCols + 1) + miniSize * miniCols,
        y: border * 2 + padding * (miniRows + 1) + miniSize * miniRows
    };

    return {
        cols,
        padding,
        miniSize,
        miniCols,
        miniRows,
        border,
        itemSize,
        itemBackgrounds: {
            normal: "white",
            max: "greenyellow",
            current: "slateblue"
        }
    }
})();

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
}

class RealVisualizer implements ICalorieCountingVisualizer {
    private printer!: ScreenPrinter;

    private items: Drawable[] = [];

    private current: number | undefined;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) { 
    }
    async setCurrent(index: number | undefined): Promise<void> {
        if (this.current !== undefined) {
            if (this.items[this.current].color === constants.itemBackgrounds.current) {
                this.items[this.current].color = constants.itemBackgrounds.normal;
            }
        }
        if (index !== undefined) {
            this.items[index].color = constants.itemBackgrounds.current;
        }
        this.current = index;
        await this.printer.forceRender();
        await this.pause();
    }
    async showOnScreen(data: CalorieCountingData): Promise<void> {
        const rows = Math.ceil(data.length / constants.cols);
        this.printer = await this.screenBuilder.requireScreen({
            x: constants.padding * (constants.cols + 1) + constants.cols * constants.itemSize.x,
            y: constants.padding * (rows + 1) + rows * constants.itemSize.y
        });

        this.printer.setManualRender();

        const minCalorie = data.flatMap(e => e).reduce((acc, next) => Math.min(acc, next), Number.POSITIVE_INFINITY);
        const maxCalorie = data.flatMap(e => e).reduce((acc, next) => Math.max(acc, next), Number.NEGATIVE_INFINITY);

        const colorCalculator = (e: number): string => {
            const percentage = 1 - ((e - minCalorie) / (maxCalorie / minCalorie));
            const value = ((255 - 120) * percentage) + 120;
            return `rgb(${value}, 0, 0)`;
        }

        for (let i = 0; i < data.length; i++) {
            const row = Math.floor(i / constants.cols);
            const col = i % constants.cols;

            const topLeft = {
                x: constants.padding * (col + 1) + col * constants.itemSize.x,
                y: constants.padding * (row + 1) + row * constants.itemSize.y
            };
            const item: Drawable = {
                c: topLeft,
                color: "white",
                id: i.toString(),
                type: 'rectangle',
                size: constants.itemSize
            }

            await this.printer.add(item);
            
            this.items.push(item);

            for (let j = 0; j < data[i].length; j++) {
                const mini = data[i][j];
                const c = colorCalculator(mini);
                const miniItem: Drawable = {
                    c: sumCoordinate(topLeft, {
                        x: constants.padding + (constants.padding + constants.miniSize) * (j % constants.miniCols),
                        y: constants.padding + (constants.padding + constants.miniSize) * Math.floor(j / constants.miniCols)
                    }),
                    color: c,
                    id: `mini_${i}_${j}`,
                    type: "rectangle",
                    size: {
                        x: constants.miniSize,
                        y: constants.miniSize
                    }
                }
                await this.printer.add(miniItem);
            }
        }

        await this.printer.forceRender();
    }
    async setMax(index: number): Promise<void> {
        this.items[index].color = constants.itemBackgrounds.max;
        await this.pause();
    }
    async removeMax(index: number): Promise<void> {
        this.items[index].color = constants.itemBackgrounds.normal;
    }
}

class DummyVisualizer implements ICalorieCountingVisualizer {
    async setCurrent(index: number | undefined): Promise<void> { }
    async showOnScreen(data: CalorieCountingData): Promise<void> { }
    async setMax(index: number): Promise<void> { }
    async removeMax(index: number): Promise<void> { }

}