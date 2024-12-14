import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";
import { DefaultDict } from "../../../../support/data-structure";

const iterate = (ns: number[]): number[] => {
    return ns.flatMap(iterateN);
}

const iterateN = (n: number): number[] => {
    if (n === 0) {
        return [1];
    } else {
        const k = n.toString();
        if (k.length % 2 === 0) {
            return [k.slice(0, k.length/2), k.slice(k.length/2)].map(e => parseInt(e, 10));
        } else {
            return [n * 2024];
        }
    }

}

const iteratePacked = (ns: DefaultDict<number, number>) => {
    const result = new DefaultDict<number, number>(() => 0);
    for (const n of ns) {
        const local = iterateN(n.key);
        for (const inner of local) {
            result.update(inner, v => v + n.value);
        }
    }
    return result;
}

export const plutonianPebbles = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        let ns = new Parser(lines)
            .extractAllNumbers()
            .flat()
            .run();
        for (let i = 0; i < 25; i++) {
            ns = iterate(ns);
        }
        await resultOutputCallback(ns.length);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .extractAllNumbers()
            .flat()
            .run();
        let packed = new DefaultDict<number, number>(() => 0);
        ns.forEach(n => packed.update(n, v => v + 1));
        for (let i = 0; i < 75; i++) { 
            packed = iteratePacked(packed);
        }
        await resultOutputCallback([...packed.values].reduce((acc, next) => acc + next, 0));
    },
    {
        key: "plutonian-pebbles",
        title: "Plutonian Pebbles",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 11,
        exampleInput,
        stars: 2
    }
);