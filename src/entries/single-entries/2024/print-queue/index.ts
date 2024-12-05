import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";
import { Graph } from "../../../../support/graph";

type Input = {
    rules: {left: number; right: number}[];
    updates: number[][];
}

export const printQueue = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);

        const orders = buildOrders(input);
        const correctUpdates = input.updates.filter(update => isUpdateCorrect(orders, update));
        const middles = findMiddles(correctUpdates);
        const result = middles.reduce((acc, next) => acc + next, 0);
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);

        const orders = buildOrders(input);
        const incorrectUpdates = input.updates.filter((update) => !isUpdateCorrect(orders, update));
        const middles = findMiddles(incorrectUpdates.map(quickOrder));
        const result = middles.reduce((acc, next) => acc + next, 0)
        await resultOutputCallback(result);

        function getSortIndex(a: number, b: number): number {
            if (orders.isConnectedTo(a, b)) {
                return 1;
            } else if (orders.isConnectedTo(b, a)) {
                return -1;
            } else {
                return 0;
            }
        }

        function quickOrder(update: number[]) {
            return [...update].sort(getSortIndex);
        }
    },
    {
        key: "print-queue",
        title: "Print Queue",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 5,
        stars: 2,
        exampleInput: exampleInput
    }
);

function findMiddles(correctUpdates: number[][]) {
    return correctUpdates.map(e => e[Math.floor(e.length / 2)]);
}

function buildOrders(input: Input) {
    return new Graph<number>(input.rules.map(e => ({ from: e.right, to: e.left })), { serializer: e => e });
}

function parseInput(lines: string[]): Input {
    return new Parser(lines)
        .group(s => s === "")
        .startSimpleLabeling()
        .label(e => new Parser(e).tokenize("|").startLabeling().label(i => i.n(), "left").label(i => i.n(), "right").run(), "rules")
        .label(e => new Parser(e).extractAllNumbers().run(), "updates")
        .run();
}

function isUpdateCorrect(orders: Graph<number>, update: number[]): boolean {
    for (let i = 0; i < update.length; i++) {
        for (let j = i + 1; j < update.length; j++) {
            if (orders.isConnectedTo(update[i], update[j])) {
                return false;
            }
        }
    }
    return true;
}
