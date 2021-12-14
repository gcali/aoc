import { Counter } from "../../../../support/data-structure";
import { MyIterable } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

export const entry = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const start = lines[0];

        const rules = parseInput(lines);

        let res = start.split("");
        for (let i = 0; i < 10; i++) {
            let current = 0;
            while (true) {
                let found = false;
                for (const rule in rules) {
                    if (res[current] === rule[0] && res[current+1] === rule[1]) {
                        res.splice(current+1, 0, rules[rule]);
                        current += 2;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    current++;
                }
                if (current >= res.length-1) {
                    break;
                }
            }
        }

        const frequencies = new Counter();

        for (const x of res) {
            frequencies.incr(x);
        }

        const counter: {l: string; c: number}[] = [];

        for (const x of frequencies.keys) {
            counter.push({l: x, c: frequencies.get(x)});
        }

        counter.sort((a, b) => b.c - a.c);

        await resultOutputCallback(counter[0].c - counter[counter.length-1].c);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const start = lines[0];

        const rules: {[key: string]: string} = {};

        for (const l of lines.slice(2)) {
            const [a, b] = l.split(" -> ");
            rules[a] = b;
        }

        let pairs: {[key: string]: number} = {};

        for (const n of new MyIterable(start).windows(2)) {
            pairs[n.join("")] = (pairs[n.join("")] || 0) + 1;
        }

        for (let i = 0; i < 40; i++) {
            const newPairs: {[key: string]: number} = {};
            for (const k in pairs) {
                const match = rules[k];
                if (match !== undefined) {
                    const t = k[0] + match + k[1];
                    for (const w of new MyIterable(t).windows(2)) {
                        newPairs[w.join("")] = (newPairs[w.join("")] || 0) + pairs[k];
                    }
                }
            }
            pairs = newPairs;
        }

        const frequencies: {[key: string]: number} = {};
        for (const pair in pairs) {
            const x = pair[0];
            frequencies[x] = (frequencies[x] || 0) + pairs[pair];
        }
        frequencies[start[start.length-1]]++;

        const counter: {l: string; c: number}[] = [];

        for (const x in frequencies) {
            counter.push({l: x, c: frequencies[x]});
        }

        counter.sort((a, b) => b.c - a.c);

        await resultOutputCallback(counter[0].c - counter[counter.length-1].c);
    },
    {
        key: "key",
        title: "title",
        supportsQuickRunning: true,
        embeddedData: true
    }
);

function parseInput(lines: string[]): { [key: string]: string; } {
    const rules: { [key: string]: string; } = {};

    for (const l of lines.slice(2)) {
        const [a, b] = l.split(" -> ");
        rules[a] = b;
    }
    return rules;
}
