import { oldEntryForFile, entryForFile } from "../../entry";
import { Coordinate, sumCoordinate, getBoundaries, Bounds } from "../../../support/geometry";
// import { log } from "@/support/log";

class MovablePoint {

    public static FromLine(line: string): MovablePoint {
        line = line.replace(/ /g, "");
        const firstPart = line.slice(line.indexOf("<") + 1, line.indexOf(">"));
        let secondPart = line.slice(line.indexOf(">") + 1);
        secondPart = secondPart.slice(secondPart.indexOf("<") + 1, secondPart.indexOf(">"));
        const coordinateTokens = firstPart.split(",");
        const speedTokens = secondPart.split(",");
        return new MovablePoint(
            {
                x: parseInt(coordinateTokens[0], 10),
                y: parseInt(coordinateTokens[1], 10),
            },
            {
                x: parseInt(speedTokens[0], 10),
                y: parseInt(speedTokens[1], 10),
            },
        );

    }
    constructor(
        public coordinates: Coordinate,
        public speed: Coordinate,
    ) {

    }

    public move(): MovablePoint {
        return new MovablePoint(
            sumCoordinate(this.coordinates, this.speed),
            this.speed,
        );
    }
}

export const entry = entryForFile(
    async ({lines, outputCallback}) => {
        let points = lines.map((line) => MovablePoint.FromLine(line));
        let lastBoundaries: Bounds | null = null;
        let lastPoints: typeof points | null = null;
        let done = false;
        function getArea(size: Coordinate) {
            return size.x * size.y;
        }
        while (!done) {
            const newPoints = points.map((p) => p.move());
            const boundaries = getBoundaries(newPoints.map((p) => p.coordinates));
            if (lastBoundaries === null) {
                lastBoundaries = boundaries;
                lastPoints = newPoints;
            } else {
                if (getArea(lastBoundaries.size) < getArea(boundaries.size)) {
                    done = true;
                } else {
                    lastBoundaries = boundaries;
                    lastPoints = newPoints;
                }
            }
            points = newPoints;
        }
        const mappedPoints = lastPoints!.map((p) => p.coordinates)
            .map((c) => ({
                x: c.x - lastBoundaries!.topLeft.x,
                y: c.y - lastBoundaries!.topLeft.y
            }))
            .sort((a, b) => (a.y - b.y) * 100000 + a.x - b.x);
        const dataMatrix: string[][] = [];
        for (let y = 0; y < lastBoundaries!.size.y; y++) {
            const l = [];
            for (let x = 0; x < lastBoundaries!.size.x; x++) {
                l.push(" ");
            }
            dataMatrix.push(l);
        }
        mappedPoints.forEach((p) => {
            dataMatrix[p.y][p.x] = "#";
        });
        for (const l of dataMatrix) {
            await outputCallback(l.join(""));
        }
    },
    async ({lines, outputCallback}) => {
        let points = lines.map((line) => MovablePoint.FromLine(line));
        let lastBoundaries: Bounds | null = null;
        let lastPoints: typeof points | null = null;
        let done = false;
        function getArea(size: Coordinate) {
            return size.x * size.y;
        }
        let iterationCounter = 0;
        while (!done) {
            iterationCounter++;
            const newPoints = points.map((p) => p.move());
            const boundaries = getBoundaries(newPoints.map((p) => p.coordinates));
            if (lastBoundaries === null) {
                lastBoundaries = boundaries;
                lastPoints = newPoints;
            } else {
                if (getArea(lastBoundaries.size) < getArea(boundaries.size)) {
                    done = true;
                } else {
                    lastBoundaries = boundaries;
                    lastPoints = newPoints;
                }
            }
            points = newPoints;
        }
        await outputCallback(iterationCounter - 1);
    },
    { key: "the-stars-align", title: "The Stars Align", stars: 2, }
);
