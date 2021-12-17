import { Coordinate } from "../../../../support/geometry";
import { Drawable, Pause, ScreenBuilder, ScreenPrinter } from "../../../entry";

export interface ITrickShotVisualizer {
    setup(from: Coordinate, to: Coordinate): Promise<void>;
    showPoints(coordinate: Coordinate[]): Promise<void>;
}

export const buildVisualizer = async (screenBuilder: ScreenBuilder | undefined, pause: Pause) => {
    if (screenBuilder) {
        const vs = new RealVisualizer(screenBuilder, pause);
        return vs;
    } else {
        return new DummyVisualizer();
    }
};

class RealVisualizer implements ITrickShotVisualizer {
    private printer!: ScreenPrinter;
    private basePoint!: { x: number; y: number; };

    constructor(
        private readonly screenBuilder: ScreenBuilder,
        private readonly pause: Pause
    ) {
    }

    public async setup(from: Coordinate, to: Coordinate) {
       await this.screenBuilder.requireScreen({x: 500, y: 600}).then((e) => {
           this.printer = e;
           this.printer.setManualRender();
       });

       this.basePoint = {x: 0, y: 500};

       from = this.map(from);
       to = this.map(to);

       this.printer.addForeground({
           type: "points",
           color: "yellow",
           id: "target",
           points: [
               {x: from.x, y: from.y},
               {x: to.x, y: from.y},
               {x: to.x, y: to.y},
               {x: from.x, y: to.y},
           ]
       });

    }
    public async showPoints(coordinate: Coordinate[]): Promise<void> {

        coordinate = coordinate.map((e) => this.map(e));

        const i = 0;

        // const drawables = coordinate.map(c => {
        //     return {
        //         color: "white",
        //         id: (i++).toString(),
        //         type: "rectangle",
        //         c: c,
        //         size: {x: 1, y: 1}
        //     } as Drawable & {type: "rectangle"};
        // });

        const drawable: Drawable & {type: "points"} = {
            type: "points",
            color: "white",
            id: "line",
            points: coordinate,
            shouldStroke: true
        };

        this.printer.replace([drawable]);

        this.printer.forceRender();

        await this.pause();
    }

    private scale(c: Coordinate) {
        return {
            x: c.x * 2,
            y: c.y * 0.1
        };
    }

    private map(c: Coordinate) {
        const scaled = this.scale(c);

        return {
            x: scaled.x,
            y: -scaled.y + this.basePoint.y

        };
    }
}

class DummyVisualizer implements ITrickShotVisualizer {
    public async setup(from: Coordinate, to: Coordinate): Promise<void> {
    }
    public async showPoints(coordinate: Coordinate[]): Promise<void> {
    }

}
