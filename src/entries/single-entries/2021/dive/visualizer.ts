import { Coordinate, floatRotateRadians } from "../../../../support/geometry";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";
import { amplificationCircuit } from "../../2019/amplification-circuit";

export interface IDiveVisualizer {
    setup(yFactor: number): Promise<void>;
    update(m: {x: number, y: number, aim?: number}): Promise<void>;
}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
};

type LocalDrawable = Drawable & {type: "points"};

class RealVisualizer implements IDiveVisualizer {
    private printer!: ScreenPrinter;
    private submarine!: {
        center: Coordinate;
        basePoints: Coordinate[];
        drawable: LocalDrawable
    };
    private yFactor: number = 1;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause,
    ) {
    }
    public async setup(yFactor: number): Promise<void> {
        this.printer = await this.screenBuilder.requireScreen({x: 300, y: 200});

        const pointGenerator = (): Coordinate[] => [
            {x: 0, y: 0},
            {x: 4, y: 0},
            {x: 4, y: -4},
            {x: 6, y: -4},
            {x: 6, y: 0},
            {x: 10, y: 0},
            {x: 15, y: 2.5},
            {x: 10, y: 5},
            {x: 0, y: 5}
        ];
        this.submarine = {
            center: {x: 5, y: 5},
            basePoints: pointGenerator(),
            drawable: {
                type: "points",
                color: "yellow",
                id: "sub",
                points: pointGenerator()
            }
        };
        this.translate({x: 10, y: 10});
        this.printer.add(this.submarine.drawable);
        this.yFactor = yFactor;
    }
    public async update({x, y, aim}: { x: number; y: number; aim?: number; }): Promise<void> {
        if (aim !== undefined) {
            this.rotate(Math.atan(-aim / this.yFactor));
        }
        this.translate({x: x / 8, y: y / (8 * this.yFactor)});
        await this.pause();
    }

    private translate({x, y}: Coordinate) {
        for (const point of this.submarine.drawable.points) {
            point.x += x;
            point.y += y;
        }
        for (const point of this.submarine.basePoints) {
            point.x += x;
            point.y += y;
        }
        this.submarine.center.x += x;
        this.submarine.center.y += y;
    }

    private rotate(angle: number) {
        for (let i = 0; i < this.submarine.basePoints.length; i++) {
            const res = floatRotateRadians(this.submarine.center, this.submarine.basePoints[i], angle);
            const targetPoint = this.submarine.drawable.points[i];
            targetPoint.x = res.x;
            targetPoint.y = res.y;
        }
    }
}

class DummyVisualizer implements IDiveVisualizer {
    public async setup(): Promise<void> {
    }
    public async update(): Promise<void> {
    }

}
