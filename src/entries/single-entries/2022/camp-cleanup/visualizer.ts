import { Dictionary } from 'linq-typescript';
import { Pair, Range } from '.';
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from '../../../entry';

export interface ICampCleanupVisualizer {
    showPairs(pairs: Pair[]): Promise<void>;
    higlightPairs(pairs: Pair[]): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
}

const constants = (() => {
    const internalPadding = 2;
    const boxPadding = 4;
    const borderThickness = 1;
    const lineMaxWidth = 20;
    const lineThickness = 2;
    return {
        internalPadding,
        boxPadding,
        borderThickness,
        lineMaxWidth,
        lineThickness,
        boxSize: {
            x: lineMaxWidth + internalPadding * 2 + borderThickness * 2,
            y: borderThickness * 2 + internalPadding * 3 + lineThickness * 2
        },
        cols: 15
    }
})();

class RealVisualizer implements ICampCleanupVisualizer {
    private printer!: ScreenPrinter;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }

    private pairs: Dictionary<number, Drawable> = new Dictionary<number, Drawable>();

    async showPairs(pairs: Pair[]): Promise<void> {

        const maxValue = Math.max(...pairs.flatMap(p => [p.a.from, p.a.to, p.b.from, p.b.to]));

        this.printer = await this.screenBuilder.requireScreen({
            x: (constants.boxSize.x + constants.boxPadding) * constants.cols,
            y: (constants.boxSize.y + constants.boxPadding) * (Math.ceil(pairs.length / constants.cols))
        });

        this.printer.setManualRender();

        let currentY = 0;

        let currentCol = 0;

        for (const pair of pairs) {
            const startY = currentY;
            const topLeft = {
                x: currentCol * (constants.boxSize.x + constants.boxPadding),
                y: currentY
            };
            const size = { ...constants.boxSize };


            const box: Drawable = {
                c: topLeft,
                size,
                color: "white",
                shouldStroke: true,
                id: pair.id.toString(),
                type: "rectangle"
            };

            this.pairs.set(pair.id, box);

            const buildLine = (range: Range, startY: number): Drawable & {type: 'rectangle'} => {
                const width = ((range.to - range.from) / maxValue) * constants.lineMaxWidth;
                const startX = (range.from / maxValue) * constants.lineMaxWidth;

                return {
                    type: "rectangle",
                    c: {
                        x: topLeft.x + constants.borderThickness + constants.internalPadding + startX,
                        y: startY
                    },
                    color: "white",
                    size: {
                        x: width,
                        y: constants.lineThickness
                    },
                    id: `${pair.id}_${startY}`
                }
            };

            currentY += constants.borderThickness + constants.internalPadding;
            
            const first = buildLine(pair.a, currentY);

            currentY += first.size.y + constants.internalPadding;

            const second = buildLine(pair.b, currentY);
            currentY += second.size.y + constants.internalPadding + constants.borderThickness + constants.boxPadding;

            this.printer.add(box);
            this.printer.add(first);
            this.printer.add(second);


            currentCol = (currentCol + 1) % constants.cols;
            if (currentCol !== 0) {
                currentY = startY;
            }
        }
        this.printer.forceRender();
        await this.pause();
    }
    async higlightPairs(pairs: Pair[]): Promise<void> {
        for (const pair of pairs) {
            this.pairs.get(pair.id).color = "yellow";
            this.printer.forceRender();
            await this.pause();
        }
    }
}

class DummyVisualizer implements ICampCleanupVisualizer {
    async showPairs(pairs: Pair[]): Promise<void> { }
    async higlightPairs(pairs: Pair[]): Promise<void> { }

}