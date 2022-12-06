import { buildGroupsFromSeparator, groupBy } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

type Stack = string[];

const tryParseCrate = (raw: string): string | null => {
    if (raw.includes("[")) {
        return raw.slice(1, 2);
    } else {
        return null;
    }
}

const parseStacks = (rawStacks: string[]): Stack[] => {
    const howMany = (rawStacks[0].length + 1) / 4;
    const stacks:Stack[] = [];
    for (let i = 0; i < howMany; i++) {
        stacks.push([]);
    }
    for (const line of rawStacks) {
        const groups = groupBy(line.split(""), 4);
        if (groups.length !== howMany) {
            throw new Error(`Invalid input: ${howMany} !== ${groups.length}`);
        }
        for (let i = 0; i < groups.length; i++) {
            const crate = tryParseCrate(groups[i].join(""));
            if (crate !== null) {
                stacks[i].unshift(crate);
            }
        }
    }
    return stacks;
}

type Instruction = {
    from: number;
    to: number;
    howMany: number;
}

const parseInstructions = (raw: string[]): Instruction[] => {
    return raw.map(line => {
        const tokens = line.split(" ").map(e => parseInt(e, 10));
        const howMany = tokens[1];
        const from = tokens[3] - 1;
        const to = tokens[5] - 1;
        return {howMany, from, to}
    })
}

export const supplyStacks = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const { instructions, stacks } = parseInput(lines);
        for (const instruction of instructions) {
            for(let i = 0; i < instruction.howMany; i++) {
                const e = stacks[instruction.from].pop();
                if (e === undefined) {
                    throw new Error("Empty stack");
                }
                stacks[instruction.to].push(e);
            }
        }
        const result = stacks.map(s => s.pop()).join("");
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const { instructions, stacks } = parseInput(lines);
        for (const instruction of instructions) {
            const from = stacks[instruction.from];
            const toMove = from.splice(from.length - instruction.howMany, instruction.howMany);
            for(const item of toMove) {
                stacks[instruction.to].push(item);
            }
        }
        const result = stacks.map(s => s.pop()).join("");
        await resultOutputCallback(result);
    },
    {
        key: "supply-stacks",
        title: "Supply Stacks",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function parseInput(lines: string[]) {
    const [rawStacks, rawInstructions] = buildGroupsFromSeparator(lines, e => e.trim().length === 0);
    const stacks = parseStacks(rawStacks);
    const instructions = parseInstructions(rawInstructions);
    return { instructions, stacks };
}
