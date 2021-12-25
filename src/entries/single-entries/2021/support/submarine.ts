import { Coordinate, diffCoordinate, floatRotateRadians, multiplyCoordinate, scalarCoordinates, sumCoordinate } from "../../../../support/geometry";
import { Drawable, ScreenPrinter } from "../../../entry";

export class Submarine {
    private readonly rotationCenter: Coordinate = {x: 5, y: 5};
    private readonly translationPoints: Coordinate[];
    private readonly drawable: Drawable & {type: "points"};

    constructor() {
        this.translationPoints = [
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

        this.drawable = {
            type: "points",
            color: "yellow",
            id: "submarine",
            points: this.translationPoints.map((p) => ({...p}))
        };
    }

    public translate({x, y}: Coordinate) {
        for (const point of this.drawable.points) {
            point.x += x;
            point.y += y;
        }
        for (const point of this.translationPoints) {
            point.x += x;
            point.y += y;
        }
        this.rotationCenter.x += x;
        this.rotationCenter.y += y;
    }

    public rotate(angle: number) {
        for (let i = 0; i < this.translationPoints.length; i++) {
            const res = floatRotateRadians(this.rotationCenter, this.translationPoints[i], angle);
            const targetPoint = this.drawable.points[i];
            targetPoint.x = res.x;
            targetPoint.y = res.y;
        }
    }

    public magnify(times: number) {
        for (let i = 0; i < this.translationPoints.length; i++) {
            const delta = diffCoordinate(this.translationPoints[i], this.rotationCenter);
            const magnifiedDelta = scalarCoordinates(delta, times);
            const newPoint = sumCoordinate(magnifiedDelta, this.rotationCenter);
            this.translationPoints[i] = newPoint;
            this.drawable.points[i].x = newPoint.x;
            this.drawable.points[i].y = newPoint.y;
        }
    }

    public giveSomeMargin() {
        this.translate({x: 15, y: 20});
    }

    public print(printer: ScreenPrinter) {
        printer.addForeground(this.drawable);
    }

    public invalidate(printer: ScreenPrinter) {
        printer.invalidate(this.drawable);
    }

}


export const seaBackground = "#000071";
export const deepSea = "#07131f";
