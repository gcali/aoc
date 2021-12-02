import { entryForFile } from "../../../entry";
import { seaBackground } from "../support/submarine";
import { buildVisualizer } from "./visualizer";

type Direction = "f" | "u" | "d";

const parseLine = (line: string): {direction: Direction, amount: number} => {
    const match = line.match(/([fud]).*? (\d*)/);
    if (!match) {
        throw new Error("Invalid input");
    }
    return ({direction: match[1] as Direction, amount: parseInt(match[2], 10)});
};

export const dive = entryForFile(
    async ({ lines, resultOutputCallback, screen, pause }) => {
        const data = lines.map(parseLine);

        const vs = buildVisualizer(screen, pause);

        await vs.setup(1);

        let x = 0;
        let y = 0;
        for (const {amount, direction} of data) {
            if (direction === "d") {
                await vs.update({x: 0, y: amount, aim: 0});
                y += amount;
            } else if (direction === "u") {
                await vs.update({x: 0, y: -amount, aim: 0});
                y -= amount;
            } else {
                await vs.update({x: amount, y: 0, aim: 0});
                x += amount;
            }
        }
        await resultOutputCallback(x * y);
    },
    async ({ lines, outputCallback, resultOutputCallback, screen, pause }) => {
        const data = lines.map(parseLine);

        const vs = buildVisualizer(screen, pause);

        await vs.setup(1000);

        let x = 0;
        let y = 0;
        let aim = 0;
        for (const {amount, direction} of data) {
            if (direction === "d") {
                aim += amount;
                await vs.update({x: 0, y: 0, aim});
            } else if (direction === "u") {
                aim -= amount;
                await vs.update({x: 0, y: 0, aim});
            } else {
                x += amount;
                y += amount * aim;
                await vs.update({x: amount, y: amount * aim});
            }
        }
        await resultOutputCallback(x * y);
    },
    {
        key: "dive",
        title: "Dive!",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 1,
        canvasBackground: seaBackground
    }
);
