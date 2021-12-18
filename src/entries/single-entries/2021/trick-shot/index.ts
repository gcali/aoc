import { Coordinate, sumCoordinate } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./visualizer";

type State = {
    position: Coordinate;
    speed: Coordinate;
};

const step = (state: State): State => {
    const position = sumCoordinate(state.position, state.speed);
    const speed = {
        x: state.speed.x - Math.sign(state.speed.x),
        y: state.speed.y - 1
    };
    return { speed, position };
};

export const trickShot = entryForFile(
    async ({ lines, resultOutputCallback, screen, pause }) => {

        const tokens = lines[0].split(" ");
        const [xFrom, xTo] = tokens[2].slice(2, tokens[2].length - 1).split("..").map((e) => parseInt(e, 10));
        const [yFrom, yTo] = tokens[3].slice(2).split("..").map((e) => parseInt(e, 10));


        let reallyBestY = 0;

        const vs = await buildVisualizer(screen, pause);

        await vs.setup({ x: xFrom, y: yFrom }, { x: xTo, y: yTo });

        for (let y = 0; y <= 1000; y++) {
            for (let x = 0; x <= xTo; x++) {
                const points: Coordinate[] = [];
                let state: State = {
                    position: { x: 0, y: 0 },
                    speed: { x, y }
                };
                let bestY = 0;

                if (screen) {
                    points.push(state.position);
                }

                while (state.position.x <= xTo && state.position.y >= yFrom) {
                    state = step(state);
                    if (screen) {
                        points.push(state.position);
                    }
                    bestY = Math.max(bestY, state.position.y);
                    if (
                        state.position.x >= xFrom &&
                        state.position.y <= yTo &&
                        state.position.x <= xTo &&
                        state.position.y >= yFrom) {
                        if (bestY > reallyBestY) {
                            reallyBestY = bestY;
                            await vs.showPoints(points);
                        }
                        break;
                    }
                }
            }
        }

        await resultOutputCallback(reallyBestY);
    },
    async ({ lines, resultOutputCallback, screen, pause }) => {
        const tokens = lines[0].split(" ");
        const [xFrom, xTo] = tokens[2].slice(2, tokens[2].length - 1).split("..").map((e) => parseInt(e, 10));
        const [yFrom, yTo] = tokens[3].slice(2).split("..").map((e) => parseInt(e, 10));


        let count = 0;

        const vs = await buildVisualizer(screen, pause);

        await vs.setup({ x: xFrom, y: yFrom }, { x: xTo, y: yTo });


        for (let y = yFrom; y < 1000; y++) {
            for (let x = 0; x < 1000; x++) {
                let state: State = {
                    position: { x: 0, y: 0 },
                    speed: { x, y }
                };

                const points: Coordinate[] = [];
                if (screen) {
                    points.push(state.position);
                }

                while (state.position.x <= xTo && state.position.y >= yFrom) {
                    state = step(state);
                    if (screen) {
                        points.push(state.position);
                    }
                    if (
                        state.position.x >= xFrom &&
                        state.position.y <= yTo &&
                        state.position.x <= xTo &&
                        state.position.y >= yFrom) {
                        count++;
                        await vs.showPoints(points);
                        break;
                    }
                }
            }
        }

        await resultOutputCallback(count);
    },
    {
        key: "trick-shot",
        title: "Trick Shot",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 10
    }
);
