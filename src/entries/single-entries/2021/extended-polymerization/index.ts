import { Counter, DefaultDict, DefaultNumberDict } from "../../../../support/data-structure";
import { MyIterable } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

export const extendedPolymerization = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        const {start, rules} = parseInput(lines);

        const res = start.split("");
        for (let i = 0; i < 10; i++) {
            let current = 0;
            while (true) {
                let found = false;
                for (const rule in rules) {
                    if (res[current] === rule[0] && res[current + 1] === rule[1]) {
                        res.splice(current + 1, 0, rules[rule]);
                        current += 2;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    current++;
                }
                if (current >= res.length - 1) {
                    break;
                }
            }
        }

        const frequencies = Counter.countCharacters(res);

        await resultOutputCallback(Math.max(...frequencies.values) - Math.min(...frequencies.values));

    },
    async ({ lines, resultOutputCallback }) => {
        const { start, rules }: { start: string; rules: { [key: string]: string; }; } = parseInput(lines);

        let pairs = new DefaultNumberDict<string>();

        for (const n of new MyIterable(start).windows(2)) {
            pairs.incr(n.join(""));
        }

        for (let i = 0; i < 40; i++) {
            const newPairs = new DefaultNumberDict<string>();
            for (const {key: k, value} of pairs) {
                const match = rules[k];
                if (match !== undefined) {
                    for (const w of new MyIterable([k[0], match, k[1]]).windows(2)) {
                        newPairs.incr(w.join(""), value);
                    }
                }
            }
            pairs = newPairs;
        }

        const frequencies = getFrequencies(pairs, start);

        await resultOutputCallback(Math.max(...frequencies.values) - Math.min(...frequencies.values));
    },
    {
        key: "extended-polymerization",
        title: "Extended Polymerization",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function getFrequencies(pairs: DefaultDict<string, number>, start: string) {
    const frequencies = new DefaultNumberDict<string>();
    for (const { key, value } of pairs) {
        frequencies.incr(key[0], value);
    }
    frequencies.incr(start[start.length - 1]);
    return frequencies;
}

function parseInput(lines: string[]): {start: string; rules: {[key: string]: string}} {
    const start = lines[0];

    const rules: { [key: string]: string; } = {};

    for (const l of lines.slice(2)) {
        const [a, b] = l.split(" -> ");
        rules[a] = b;
    }
    return { start, rules };
}
