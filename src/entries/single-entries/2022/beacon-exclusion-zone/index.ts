import { Coordinate, drawStraightLine, getBoundaries, isInBounds, manhattanDistance, serialization } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

const exampleInput = `Sensor at x=2, y=18: closest beacon is at x=-2, y=15
Sensor at x=9, y=16: closest beacon is at x=10, y=16
Sensor at x=13, y=2: closest beacon is at x=15, y=3
Sensor at x=12, y=14: closest beacon is at x=10, y=16
Sensor at x=10, y=20: closest beacon is at x=10, y=16
Sensor at x=14, y=17: closest beacon is at x=10, y=16
Sensor at x=8, y=7: closest beacon is at x=2, y=10
Sensor at x=2, y=0: closest beacon is at x=2, y=10
Sensor at x=0, y=11: closest beacon is at x=2, y=10
Sensor at x=20, y=14: closest beacon is at x=25, y=17
Sensor at x=17, y=20: closest beacon is at x=21, y=22
Sensor at x=16, y=7: closest beacon is at x=15, y=3
Sensor at x=14, y=3: closest beacon is at x=15, y=3
Sensor at x=20, y=1: closest beacon is at x=15, y=3`;


type SensorReading = {
    sensor: Coordinate;
    beacon: Coordinate;
    radius: number;
};

const parseLines = (lines: string[]): SensorReading[] => {
    return lines.map(line => {
        const matches = line.match(/x=(-?\d*).*y=(-?\d*).*x=(-?\d*).*y=(-?\d*)/);
        if (!matches) {
            throw new Error("Invalid line: " + line);
        }
        const [sx,sy,bx,by] = matches.slice(1).map(e => parseInt(e, 10));
        const sensor = {x: sx, y: sy};
        const beacon = {x: bx, y: by};
        return {
            sensor,
            beacon,
            radius: manhattanDistance(sensor, beacon)
        };
    });
}

const isInRange = (reading: SensorReading, position: Coordinate) => {
    return manhattanDistance(reading.sensor, position) <= reading.radius;
}

const getEdges = (reading: SensorReading): Coordinate[] => {
    const r = reading.radius;
    const {x: sx, y: sy} = reading.sensor;
    const corners = [
        {x: sx, y: sy - r - 1},
        {x: sx - r - 1, y: sy},
        {x: sx, y: sy + r + 1},
        {x: sx + r + 1, y: sy}
    ];
    const points = [];
    for (let i = 0; i < corners.length; i++) {
        for (const point of drawStraightLine(corners[i], corners[(i+1)%corners.length], false)) {
            points.push(point)
        }
    }
    return points;
}

export const beaconExclusionZone = entryForFile(
    async ({ lines, pause, resultOutputCallback, isExample }) => {
        const readings = parseLines(lines);
        const y = isExample ? 10 : 2000000;
        const xs = readings.flatMap(r => [r.sensor.x - r.radius, r.sensor.x + r.radius]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const beacons = new Set<string>(readings.map(r => r.beacon).map(e => serialization.serialize(e)));
        let counter = 0;
        for (let x = minX; x <= maxX; x++) {
            if (beacons.has(serialization.serialize({x, y}))) {
                continue;
            }
            for (const reading of readings) {
                if (isInRange(reading, {y, x})) {
                    counter++;
                    break;
                }
            }
            await pause();
        }
        await resultOutputCallback(counter);
    },
    async ({ lines, outputCallback, resultOutputCallback, pause, isExample }) => {
        const limit = isExample? 20 : 4000000;
        const factor = 4000000;
        const bounds = getBoundaries([{x: 0, y: 0}, {x: limit, y: limit}]);
        const readings = parseLines(lines);
        for (const reading of readings) {
            const edges = getEdges(reading);
            for (const point of edges) {
                await pause();
                if (!isInBounds(point, bounds)) {
                    continue;
                }
                let isInRangeOfAnySensor = false;
                for (const nested of readings) {
                    if (nested === reading) {
                        continue;
                    }
                    if (isInRange(nested, point)) {
                        isInRangeOfAnySensor = true;
                        break;
                    }
                }
                if (!isInRangeOfAnySensor) {
                    //found it!
                    await outputCallback(point);
                    await resultOutputCallback(point.x * factor + point.y);
                    return;
                }
            }
        }
    },
    {
        key: "beacon-exclusion-zone",
        title: "Beacon Exclusion Zone",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        exampleInput
    }
);