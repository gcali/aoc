import { State } from '.';
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from '../../../entry';

export interface IVisualizer {
    setup(logarithmic: boolean): Promise<void>;
    update(currentDay: number, state: State): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
}

const c = (() => {
    return {
        internalMargin: 2,
        margin: 4,
        size: 5,
        heightPerCell: {
            current: 10,
            delayed: 10
        },
        logFactor: 0.008/5,
        startY: 20
    }
})();

type LocalDrawable = Drawable & {type: "rectangle"};

class RealVisualizer implements IVisualizer {
    private printer!: ScreenPrinter;
    private drawableState: {current: LocalDrawable, delayed: LocalDrawable, arrowPosition: number}[] = [];
    private arrow: {draw: Drawable & {type: "points"}, update: (x: number) => void};
    private logarithmic: boolean = false;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) { 
        let lastDelta = 0;
        const basePoints = [
            {x: 3, y: 10},
            {x: 3, y: 0},
            {x: 5, y: 0},
            {x: 5, y: 10},
            {x: 0, y: 7},
            {x: 8, y: 7},
            {x: 4, y: 10}
        ]
        this.arrow = {
            draw: {
                color: "white",
                id: "arrow",
                type: "points",
                points: basePoints.map(p => ({...p}))
            },
            update: (x: number) => {
                this.arrow.draw.points.forEach(p => p.x = p.x - lastDelta + x);
                lastDelta = x;
            }
        };
    }
    async setup(logarithmic: boolean): Promise<void> {
        let currentX = 0;
        this.logarithmic = logarithmic;
        for (let i = 0; i < 7; i++) {
            const current: LocalDrawable = {
                c: {
                    x: currentX,
                    y: c.startY
                },
                color: "red",
                id: `${i}-current`,
                size: {
                    x: c.size,
                    y: 0
                },
                type: "rectangle"
            };
            currentX += c.size + c.internalMargin;
            const arrowPosition = currentX;
            const delayed: LocalDrawable = {
                c: {
                    x: currentX,
                    y: c.startY
                },
                color: "yellow",
                id: `${i}-delayed`,
                size: {
                    x: c.size,
                    y: 0
                },
                type: "rectangle"
            };
            currentX += c.size + c.margin;
            this.drawableState.push({current, delayed, arrowPosition});
        }

        this.printer = await this.screenBuilder.requireScreen({
            x: currentX,
            y: 1000
        });
        this.drawableState.forEach(e => {
            this.printer.add(e.current);
            this.printer.add(e.delayed);
        })
        this.printer.add(this.arrow.draw);
    }

    async update(currentDay: number, state: State): Promise<void> {
        for (let i = 0; i < state.length; i++) {
            if (this.logarithmic) {
                this.drawableState[i].current.size.y = Math.log(state[i].current) * c.heightPerCell.current;
                this.drawableState[i].delayed.size.y = Math.log(state[i].delayed) * c.heightPerCell.delayed;
            } else {
                this.drawableState[i].current.size.y = state[i].current * c.heightPerCell.current * c.logFactor;
                this.drawableState[i].delayed.size.y = state[i].delayed * c.heightPerCell.delayed * c.logFactor;
            }
        }
        this.arrow.update(this.drawableState[currentDay % 7].arrowPosition);
        await this.pause();
    }
}

class DummyVisualizer implements IVisualizer {
    async setup(): Promise<void> {
    }
    async update(currentDay: number, state: State): Promise<void> {
    }

}