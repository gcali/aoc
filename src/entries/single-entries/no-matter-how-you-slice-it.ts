import { Entry } from "../entry";
import readLines from "../../support/file-reader";
import { Coordinate } from "../../support/geometry";
import { log } from "@/support/log";

interface Rectangle {
    id: number;
    position: Coordinate;
    size: Coordinate;
}

type Map = boolean[][];

let isFirstTime = true;
const parseRectangle = (line: string): Rectangle => {
    const trimmed = line.trim();
    const noSpaces = trimmed.replace(/ /g, "");
    const normalizedDelimiters = noSpaces.replace("#", "").replace("@", " ").replace(":", " ");
    if (isFirstTime) {
        isFirstTime = false;
        log(noSpaces);
        log(normalizedDelimiters);
    }
    const split = normalizedDelimiters.split(" ");
    const id = parseInt(split[0], 10);
    const fromCoupleToCoordinate = (s: string, d: string): Coordinate => {
        const argSplit = s.split(d);
        return {
            x: parseInt(argSplit[0], 10),
            y: parseInt(argSplit[1], 10),
        };
    };
    const position = fromCoupleToCoordinate(split[1], ",");
    const size = fromCoupleToCoordinate(split[2], "x");

    return {
        id,
        position,
        size,
    };
};
const entry: Entry = {
    first: () => readLines((lines) => {
        const map = mapCreator(lines.map(parseRectangle));

        const total = map.reduce<number>((acc, current) => acc + current.filter((e) => e).length, 0);
        log(total);
    }),
    second: () => readLines((lines) => {
        const rectangles = lines.map(parseRectangle);
        const map = mapCreator(rectangles);

        const candidate = rectangles.find((r) => {
            let isCandidate = true;
            executeOnMap(r, (argMap: Map, coordinate: Coordinate) => {
                if (argMap[coordinate.x][coordinate.y]) {
                    isCandidate = false;
                }
            }, map);
            return isCandidate;
        });
        log(candidate ? candidate.id : "null");
    }),
};

export default entry;

function mapCreator(rectangles: Rectangle[]) {
    const size = 1000;
    const map: Map = new Array<boolean[]>(size);
    for (let i = 0; i < size; i++) {
        map[i] = new Array<boolean>(size);
    }
    const first = rectangles[0];
    log(`First Rectangle: ${first.size.x}x${first.size.y}`);
    const callback = (argMap: Map, coordinate: Coordinate) => {
        if (argMap[coordinate.x][coordinate.y] === undefined) {
            argMap[coordinate.x][coordinate.y] = false;
        } else {
            argMap[coordinate.x][coordinate.y] = true;
        }
    };
    rectangles.forEach((r) => executeOnMap(r, callback, map));
    return map;

}

function executeOnMap(r: Rectangle, callback: (map: boolean[][], coordinate: Coordinate) => void, map: boolean[][]) {
    for (let i = 0; i < r.size.x; i++) {
        for (let j = 0; j < r.size.y; j++) {
            const coordinate: Coordinate = {
                x: i + r.position.x,
                y: j + r.position.y,
            };
            callback(map, coordinate);
        }
    }
}
