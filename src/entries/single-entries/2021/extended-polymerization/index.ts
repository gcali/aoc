import { Counter, DefaultDict } from "../../../../support/data-structure";
import { MyIterable } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

export const extendedPolymerization = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const {start, rules} = parseInput(lines);

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
        const { start, rules }: { start: string; rules: { [key: string]: string; }; } = parseInput(lines);

        let pairs = new DefaultDict<string, number>(0);

        for (const n of new MyIterable(start).windows(2)) {
            pairs.update(n.join(""), v => v + 1);
        }


        for (let i = 0; i < 40; i++) {
            const newPairs = new DefaultDict<string, number>(0);
            for (const {key: k, value} of pairs) {
                const match = rules[k];
                if (match !== undefined) {
                    const t = k[0] + match + k[1];
                    for (const w of new MyIterable(t).windows(2)) {
                        newPairs.update(w.join(""), v => v + value);
                    }
                }
            }
            pairs = newPairs;
        }

        const frequencies = new DefaultDict<string, number>(0);
        for (const {key, value} of pairs) {
            frequencies.update(key[0], v => v + value);
        }
        frequencies.update(start[start.length-1], v => v + 1);

        const counter: {l: string; c: number}[] = [];

        for (const {key, value} of frequencies) {
            counter.push({l: key, c: value});
        }

        counter.sort((a, b) => b.c - a.c);

        await resultOutputCallback(counter[0].c - counter[counter.length-1].c);
    },
    {
        key: "extended-polymerization",
        title: "Extended Polymerization",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function parseInput(lines: string[]): {start: string; rules: {[key: string]: string}} {
    const start = lines[0];

    const rules: { [key: string]: string; } = {};

    for (const l of lines.slice(2)) {
        const [a, b] = l.split(" -> ");
        rules[a] = b;
    }
    return { start, rules };
}
