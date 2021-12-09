import { Coordinate } from "../../../../support/geometry";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";
import { Segment } from "./bruteVariant";

export type LineState = {
    input: Segment[][];
    output: Segment[][];
};

export interface ISegmentSearchVisualizer {
    setup(): Promise<void>;
    addLine(): Promise<void>;
    setCurrentLineState(state: LineState): Promise<void>;
    finishLine(): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

const c = (() => {
    const lineThickness = 2;
    const lineLength = 10;
    const digitPadding = 2;

    const digitInterspace = 2;

    const separatorMargin = 5;

    const digitWidth = digitPadding * 3 + lineLength;

    const digitHeight = lineThickness * 3 + lineLength * 2;
    const lineHeight = digitHeight + separatorMargin;

    return {
        lineThickness,
        lineLength,
        digitPadding,
        digitInterspace,
        separatorMargin,
        digitWidth,
        lineHeight,
        digitHeight,
        turnedOnColor: "white",
        turnedOffColor: "slategrey",
        winColor: "lime",
        maxLines: 10
    };
})();

type DigitDrawable = { [key: string]: Drawable };

class RealVisualizer implements ISegmentSearchVisualizer {
    private printer!: ScreenPrinter;

    private currentLine?: {
        input: DigitDrawable[];
        output: DigitDrawable[];
    };

    private lines: {
        [key: number]: Drawable[]
    } = {};

    private nextLine: number = 0;

    private readonly pause: Pause;

    constructor(
        private readonly screenBuilder: ScreenBuilder,
        pause: Pause
    ) {
        let counter = 0;
        let lastPrint = 0;
        this.pause = async (n: number = 1) => {
            counter += n;
            if (counter - lastPrint > 100) {
                await pause();
                lastPrint = counter;
            }
        };
    }
    public async finishLine(): Promise<void> {
        this.nextLine++;
        if (this.currentLine) {
            for (const d of this.currentLine.input) {
                for (const key of Object.keys(d)) {
                    if (d[key].color === c.turnedOnColor) {
                        d[key].color = c.winColor;
                    }
                }
            }

            for (const d of this.currentLine.output) {
                for (const key of Object.keys(d)) {
                    if (d[key].color === c.turnedOnColor) {
                        d[key].color = c.winColor;
                    }
                }
            }
        }

        this.printer.forceRender();
    }
    public async setup(): Promise<void> {
        this.printer = await this.screenBuilder.requireScreen({ x: c.digitWidth * 14 + c.separatorMargin * 4 + c.lineThickness, y: c.maxLines * c.lineHeight + c.separatorMargin });
    }
    public async addLine(): Promise<void> {

        const index = this.nextLine % c.maxLines;
        const toClearIndexes = [index + 1];
        if (index === 0) {
            toClearIndexes.push(0);
        }
        for (const toClear of toClearIndexes) {
            if (this.lines[toClear]) {
                for (const item of this.lines[toClear]) {
                    this.printer.remove(item.id);
                }
                delete this.lines[toClear];
            }
        }
        const buildDigit = (start: Coordinate): { [key: string]: Drawable } => {
            return {
                a: {
                    type: "rectangle",
                    color: "c.turnedOffColor",
                    id: `${index}-${start.x}-a`,
                    size: { x: c.lineLength, y: c.lineThickness },
                    c: { x: start.x + c.digitPadding, y: start.y }
                },
                b: {
                    type: "rectangle",
                    color: "c.turnedOffColor",
                    id: `${index}-${start.x}-b`,
                    size: { y: c.lineLength, x: c.lineThickness },
                    c: { x: start.x, y: start.y + c.digitPadding }
                },
                c: {
                    type: "rectangle",
                    color: "c.turnedOffColor",
                    id: `${index}-${start.x}-c`,
                    size: { y: c.lineLength, x: c.lineThickness },
                    c: { x: start.x + c.digitPadding + c.lineLength, y: start.y + c.digitPadding }
                },
                d: {
                    type: "rectangle",
                    color: "c.turnedOffColor",
                    id: `${index}-${start.x}-d`,
                    size: { x: c.lineLength, y: c.lineThickness },
                    c: { x: start.x + c.digitPadding, y: start.y + c.digitPadding + c.lineLength }
                },
                e: {
                    type: "rectangle",
                    color: "c.turnedOffColor",
                    id: `${index}-${start.x}-e`,
                    size: { y: c.lineLength, x: c.lineThickness },
                    c: { x: start.x, y: start.y + c.digitPadding * 2 + c.lineLength }
                },
                f: {
                    type: "rectangle",
                    color: "c.turnedOffColor",
                    id: `${index}-${start.x}-f`,
                    size: { y: c.lineLength, x: c.lineThickness },
                    c: { x: start.x + c.digitPadding + c.lineLength, y: start.y + c.digitPadding * 2 + c.lineLength }
                },
                g: {
                    type: "rectangle",
                    color: "c.turnedOffColor",
                    id: `${index}-${start.x}-g`,
                    size: { x: c.lineLength, y: c.lineThickness },
                    c: { x: start.x + c.digitPadding, y: start.y + c.digitPadding * 2 + c.lineLength * 2 }
                }
            };
        };

        const input: DigitDrawable[] = [];

        const allDrawables: Drawable[] = [];

        const start = { x: c.separatorMargin, y: index * c.lineHeight + c.separatorMargin };

        for (let i = 0; i < 10; i++) {
            const digit = buildDigit(start);
            Object.values(digit).forEach((d) => allDrawables.push(d));
            for (const k of Object.keys(digit)) {
                this.printer.add(digit[k]);
            }
            input.push(digit);
            start.x += c.digitWidth;
        }

        const separator: Drawable = {
            color: c.turnedOnColor,
            c: { x: start.x + c.separatorMargin, y: start.y + c.digitPadding },
            type: "rectangle",
            id: `${index}-separator`,
            size: { x: c.lineThickness, y: c.digitHeight - c.digitPadding * 2 }
        };

        allDrawables.push(separator);

        start.x += c.separatorMargin * 2 + c.lineThickness;

        this.printer.add(separator);

        const output: DigitDrawable[] = [];

        for (let i = 0; i < 4; i++) {
            const digit = buildDigit(start);
            Object.values(digit).forEach((d) => allDrawables.push(d));
            for (const k of Object.keys(digit)) {
                this.printer.add(digit[k]);
            }
            output.push(digit);
            start.x += c.digitWidth;
        }

        this.currentLine = {
            input,
            output
        };

        this.lines[index] = allDrawables;

        await this.pause();

    }
    public async setCurrentLineState(state: LineState): Promise<void> {
        if (this.currentLine) {
            for (let i = 0; i < state.input.length; i++) {
                const currentDigit = this.currentLine.input[i];
                for (const key of Object.keys(currentDigit)) {
                    if (state.input[i].includes(key as Segment)) {
                        currentDigit[key].color = c.turnedOnColor;
                    } else {
                        currentDigit[key].color = c.turnedOffColor;
                    }
                }
            }
            for (let i = 0; i < state.output.length; i++) {
                const currentDigit = this.currentLine.output[i];
                for (const key of Object.keys(currentDigit)) {
                    if (state.output[i].includes(key as Segment)) {
                        currentDigit[key].color = c.turnedOnColor;
                    } else {
                        currentDigit[key].color = c.turnedOffColor;
                    }
                }
            }

            await this.pause();
        }
    }
}

class DummyVisualizer implements ISegmentSearchVisualizer {
    public async setup(): Promise<void> {
    }
    public async addLine(): Promise<void> {
    }
    public async setCurrentLineState(state: LineState): Promise<void> {
    }
    public async finishLine(): Promise<void> {
    }

}
