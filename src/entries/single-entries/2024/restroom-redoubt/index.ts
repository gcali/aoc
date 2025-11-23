import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { CCoordinate, Coordinate, manhattanDistance } from "../../../../support/geometry";
import { FixedSizeMatrix } from "../../../../support/matrix";
import { UnknownSizeField } from "../../../../support/field";
import { buildVisualizer } from "./visualizer";
import { calculateExtended } from "../../../../support/algebra";

type Robot = {
    position: CCoordinate;
    velocity: CCoordinate;
}

type BoardState = Robot[];


const iterate = (boardState: BoardState, size: CCoordinate): BoardState => {
    return boardState.map(e => ({
        velocity: e.velocity,
        position: e.velocity.sum(e.position).wrap(size)
    }))
}

const quadrantIndex = (c: Coordinate, size: Coordinate): number | null => {
        const middleX = Math.floor(size.x / 2);
        const middleY = Math.floor(size.y / 2);
        let result = 0;
        if (c.x < middleX) {
            result = 0;
        } else if (c.x > middleX) {
            result = 2;
        } else {
            return null;
        }
        if (c.y < middleY) {
            result += 0;
        } else if (c.y > middleY) {
            result += 1;
        } else {
            return null;
        }
        return result;


}

// 81 133
// 182 236

// 81 + 101x = 133 + 103x
// 81 - 133 = 2x
// 81 + 101a = 133 + 103b
// 101a - 103b = 52

export const restroomRedoubt = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, isExample }) => {
        const ns = new Parser(lines)
            .tokenize(" ")
            .startLabeling()
            .label(e => e.extractCoordinates(), "position")
            .label(e => e.extractCoordinates(), "velocity")
            .run();

        const boardSize = CCoordinate.fromCoordinate(isExample ? {x: 11, y: 7 } : {x: 101, y: 103});

        const quadrants = [0,0,0,0];

        for (const robot of ns) {
            const newPosition = robot.position.sum(robot.velocity.times(100)).wrap(boardSize);
            const index = quadrantIndex(newPosition, boardSize);
            if (index !== null) {
                quadrants[index] += 1;
            }
        }

        await resultOutputCallback(quadrants.reduce((acc, next) => acc * next, 1));
    },
    async ({ lines, outputCallback, resultOutputCallback, isExample, screen, pause }) => {
        const visualizer = buildVisualizer(screen, pause);
        await visualizer.setup();
        const ns = new Parser(lines)
            .tokenize(" ")
            .startLabeling()
            .label(e => e.extractCoordinates(), "position")
            .label(e => e.extractCoordinates(), "velocity")
            .run();

        const boardSize = CCoordinate.fromCoordinate(isExample ? {x: 11, y: 7 } : {x: 101, y: 103});

        await outputCallback(calculateExtended(101, -103, 52));
        await pause();


        const LIMIT = 7858;

        for (let i = 0; i < LIMIT + 1; i++) {
            await visualizer.clear();
            const quadrants = [0,0,0,0];
            for (const robot of ns) {
                const newPosition = robot.position.sum(robot.velocity.times(i)).wrap(boardSize);
                await visualizer.addRobot(newPosition);
                const index = quadrantIndex(newPosition, boardSize);
                if (index !== null) {
                    quadrants[index] += 1;
                }
            }
            await outputCallback(null);
            await outputCallback(i);
            await pause();
            // const sorted = quadrants.sort((a, b) => b-a);
            // if (sorted[0] - sorted[1] > 100) {
            //     await resultOutputCallback(i);
            // }
        }
        await resultOutputCallback(LIMIT);
    },
    {
        key: "restroom-redoubt",
        title: "Restroom Redoubt",
        supportsQuickRunning: true,
        embeddedData: true,
        customComponent: "pause-and-run",
        date: 14,
        stars: 2,
        exampleInput: `p=0,4 v=3,-3
p=6,3 v=-1,-3
p=10,3 v=-1,2
p=2,0 v=2,-1
p=0,0 v=1,3
p=3,0 v=-2,-2
p=7,6 v=-1,-3
p=3,0 v=-1,-2
p=9,3 v=2,3
p=7,3 v=-1,2
p=2,4 v=2,-3
p=9,5 v=-3,-3`
    }
);