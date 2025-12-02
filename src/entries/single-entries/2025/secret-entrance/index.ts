import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";
import { buildCommunicator } from "./communication";

type Rotation = {
    direction: "L" | "R";
    magnitude: number;
}

const DIAL_SIZE = 100;

const parseLine = (line: string): Rotation => {
    const direction = line[0] as "L" | "R";
    const magnitude = parseInt(line.slice(1), 10);
    return {direction, magnitude};
}

const parseLineUnwrapMultiples = (line: string): Rotation[] => {
    const direction = line[0] as "L" | "R";
    let magnitude = parseInt(line.slice(1), 10);
    const result = [];
    while (magnitude > DIAL_SIZE) {
        result.push({direction, magnitude});
        magnitude -= DIAL_SIZE;
    }
    result.push({direction, magnitude});
    return result;
}

const convertToNumber = (rotation: Rotation): number => rotation.direction === "R" ? rotation.magnitude : -rotation.magnitude;
const applyRotation = (position: number, rotation: Rotation) => ((position + convertToNumber(rotation)) + DIAL_SIZE) % DIAL_SIZE;

export const secretEntrance = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback}) => {
        const startingPosition = 50;
        const rotations = lines.map(parseLine);
        let currentPosition = startingPosition;
        let timesIsZero = 0;
        for (const rotation of rotations) {
            currentPosition = applyRotation(currentPosition, rotation);
            if (currentPosition === 0) {
                timesIsZero += 1;
            }
        }
        await resultOutputCallback(timesIsZero);
    },
    async ({ lines, outputCallback, resultOutputCallback, sendMessage, pause, setAutoStop }) => {
        setAutoStop();
        const startingPosition = 50;
        const rotations = lines.map(parseLine);
        let currentPosition = startingPosition;
        let timesIsZero = 0;
        const communicator = buildCommunicator(sendMessage, pause);
        await communicator.init();
        for (const rotation of rotations) {
            await communicator.setRotationName(`${rotation.direction}${rotation.magnitude}`);
            for (let i = 0; i < rotation.magnitude; i++) {
                const delta = (rotation.direction === "L" ? -1 : +1)
                currentPosition = (currentPosition + (delta + DIAL_SIZE)) % DIAL_SIZE;
                if (currentPosition === 0) {
                    timesIsZero += 1;
                    await communicator.rotate(delta, true);
                } else {
                    await communicator.rotate(delta, false);
                }
            }
        }
        await resultOutputCallback(timesIsZero);
    },
    {
        key: "secret-entrance",
        title: "Secret Entrance",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 1,
        exampleInput: exampleInput,
        suggestedDelay: 1,
        description: "The second part has an animation!"
    }
);