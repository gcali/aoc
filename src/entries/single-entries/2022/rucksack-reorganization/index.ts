import { buildGroups } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

class Sack implements Iterable<string> {
    readonly left: Set<string>;
    readonly right: Set<string>;

    public has = (e: string): boolean => this.left.has(e) || this.right.has(e);

    constructor(line: string) {
        const length = line.length;
        if (length % 2 !== 0) {
            throw new Error("Invalid input: " + line);
        }
        const left = line.slice(0, length/2);
        const right = line.slice(length/2, length);
        this.left = buildSet(left);
        this.right = buildSet(right);
    }

    *[Symbol.iterator](): Iterator<string, any, undefined> {
        for (const item of this.left) {
            yield item;
        }
        for (const item of this.right) {
            yield item;
        }
    }
}

const parseInput = (lines: string[]): Sack[] =>
    lines.map(line => new Sack(line));


const getPriority = (() => {
    const lowerPart = 'a'.charCodeAt(0);
    const higherPart = 'A'.charCodeAt(0);
    return (s: string | undefined): number => {
        if (s === undefined) {
            throw new Error("Invalid");
        }
        const code = s.charCodeAt(0);
        return code + 1 + (code < lowerPart ? 26 - higherPart : -lowerPart);
    };
})();

const buildSet = (x: string): Set<string> => 
    new Set<string>(x.split(""));

export const rucksackReorganization = entryForFile(
    async ({ lines, resultOutputCallback }) =>
        await resultOutputCallback(
            parseInput(lines).reduce(
                (acc, next) => acc + getPriority([...next.left].find(x => next.right.has(x))),
                0
            )
        )
    ,
    async ({ lines, resultOutputCallback }) => {
        const input = parseInput(lines);
        let result = 0;
        for (const group of buildGroups(input, 3, 3)) {
            const [candidate] = group;
            const rest = group.slice(1);
            for(const x of candidate) {
                if (rest.every(r => r.has(x))) {
                    result += getPriority(x);
                    break;
                }
            }
        }
        await resultOutputCallback(result);
    },
    {
        key: "rucksack-reorganization",
        title: "Rucksack Reorganization",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);