import { Coordinate, floatRotateRadians } from "../../../../support/geometry";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";
import { amplificationCircuit } from "../../2019/amplification-circuit";
import { Submarine } from "../support/submarine";

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

class RealVisualizer implements IDiveVisualizer {
    private printer!: ScreenPrinter;
    private submarine: Submarine = new Submarine();
    private yFactor: number = 1;
    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause,
    ) {
    }
    public async setup(yFactor: number): Promise<void> {
        this.printer = await this.screenBuilder.requireScreen({x: 300, y: 200});
        this.printer.setManualInvalidate();

        this.submarine.magnify(2);
        this.submarine.giveSomeMargin();
        this.submarine.print(this.printer);
        this.yFactor = yFactor;
    }
    public async update({x, y, aim}: { x: number; y: number; aim?: number; }): Promise<void> {
        if (aim !== undefined) {
            this.submarine.rotate(Math.atan(-aim / this.yFactor));
            this.submarine.invalidate(this.printer);
        }
        if (x !== 0 || y !== 0) {
            this.submarine.translate({x: x / 8, y: y / (8 * this.yFactor)});
            this.submarine.invalidate(this.printer);
            await this.pause();
        }
    }

}

class DummyVisualizer implements IDiveVisualizer {
    public async setup(): Promise<void> {
    }
    public async update(): Promise<void> {
    }

}
