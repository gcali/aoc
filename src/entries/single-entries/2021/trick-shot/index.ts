import { Coordinate, sumCoordinate } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

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
    async ({ lines, outputCallback, resultOutputCallback }) => {

        const tokens = lines[0].split(" ");
        const [xFrom, xTo] = tokens[2].slice(2, tokens[2].length - 1).split("..").map((e) => parseInt(e, 10));
        const [yFrom, yTo] = tokens[3].slice(2).split("..").map((e) => parseInt(e, 10));


        let reallyBestY = 0;


        for (let x = 0; x <= xTo; x++) {
            for (let y = 0; y <= xTo * xTo; y++) {
                let state: State = {
                    position: { x: 0, y: 0 },
                    speed: { x, y }
                };
                let bestY = 0;

                while (state.position.x <= xTo && state.position.y >= yFrom) {
                    state = step(state);
                    bestY = Math.max(bestY, state.position.y);
                    if (
                        state.position.x >= xFrom &&
                        state.position.y <= yTo &&
                        state.position.x <= xTo &&
                        state.position.y >= yFrom) {
                        reallyBestY = Math.max(reallyBestY, bestY);
                        break;
                    }
                }
            }
        }

        await resultOutputCallback(reallyBestY);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const tokens = lines[0].split(" ");
        const [xFrom, xTo] = tokens[2].slice(2, tokens[2].length - 1).split("..").map((e) => parseInt(e, 10));
        const [yFrom, yTo] = tokens[3].slice(2).split("..").map((e) => parseInt(e, 10));


        let count = 0;


        for (let x = 0; x < 1000; x++) {
            for (let y = yFrom; y < 1000; y++) {
                let state: State = {
                    position: { x: 0, y: 0 },
                    speed: { x, y }
                };

                while (state.position.x <= xTo && state.position.y >= yFrom) {
                    state = step(state);
                    if (
                        state.position.x >= xFrom &&
                        state.position.y <= yTo &&
                        state.position.x <= xTo &&
                        state.position.y >= yFrom) {
                        count++;
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
        stars: 2
    }
);
