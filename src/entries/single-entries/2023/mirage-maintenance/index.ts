import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

export const mirageMaintenance = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .extractAllNumbers(true)
            .run();
            let result = 0;
        for (const line of ns) {
            let currentState = [...line];
            const lastElements = [currentState[currentState.length-1]];
            let newState = [];
            while (currentState.length > 1 && currentState.some(e => e !== 0)) {
                for (let i = 1; i < currentState.length; i++) {
                    newState.push(currentState[i] - currentState[i-1]);
                }
                lastElements.push(newState[newState.length-1]);
                currentState = newState;
                newState = [];
            }
            let extrapolation = 0;
            for (let i = lastElements.length-1; i--; i >= 0) {
                extrapolation = lastElements[i] + extrapolation;
            }
            result += extrapolation;
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .extractAllNumbers(true)
            .run();
            let result = 0;
        for (const line of ns) {
            let currentState = [...line];
            const firstElements = [currentState[0]];
            let newState = [];
            while (currentState.length > 1 && currentState.some(e => e !== 0)) {
                for (let i = 1; i < currentState.length; i++) {
                    newState.push(currentState[i] - currentState[i-1]);
                }
                firstElements.push(newState[0]);
                currentState = newState;
                newState = [];
            }
            let extrapolation = 0;
            for (let i = firstElements.length-1; i--; i >= 0) {
                extrapolation = firstElements[i] - extrapolation;
            }
            result += extrapolation;
        }
        await resultOutputCallback(result);
    },
    {
        key: "mirage-maintenance",
        title: "Mirage Maintenance",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 9,
        exampleInput: `0 3 6 9 12 15
1 3 6 10 15 21
10 13 16 21 30 45`
    }
);