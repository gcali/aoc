import { CCoordinate, Coordinate } from '../../../../support/geometry';
import { Pause, ScreenBuilder, ScreenPrinter } from '../../../entry';

export interface IRestroomRedoubtVisualizer {

    setup(): Promise<void>;

    addRobot(robot: Coordinate): Promise<void>
    clear(): Promise<void>;
    iteration(robots: Coordinate[]): Promise<void>;

}

export const buildVisualizer = (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        return new RealVisualizer(screenBuilder, pause);
    } else {
        return new DummyVisualizer();
    }
}

const constants = (() => {
    const screenSize = {x: 210, y: 210};
    return {
        screenSize
    };
});

class RealVisualizer implements IRestroomRedoubtVisualizer {
    private printer!: ScreenPrinter;
    private constants!: ReturnType<typeof constants>;

    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) { 
    }

    public async setup() {
        this.constants = constants();
        this.printer = await this.screenBuilder.requireScreen(this.constants.screenSize);
    }

    public async addRobot(robot: CCoordinate) {
        this.printer.add({
            c: robot.times(2),
            color: "black",
            type: "rectangle",
            size: {x: 2, y: 2},
            id: robot.toString(),
        })
    }

    public async clear() {
        await this.printer.removeAll();
    }

    public async iteration(robots: CCoordinate[]) {
        await this.printer.removeAll();
        for (const robot of robots) {
            this.printer.add({
                c: robot.times(2),
                color: "black",
                type: "rectangle",
                size: {x: 2, y: 2},
                id: robot.toString(),
            })
        }
        await this.pause();
    }

}

class DummyVisualizer implements IRestroomRedoubtVisualizer {
    async addRobot(robot: Coordinate): Promise<void> {
    }
    async clear(): Promise<void> {
    }
    async iteration(robots: Coordinate[]): Promise<void> {
    }
    public async setup() {}
}