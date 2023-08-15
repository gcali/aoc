import { entryForFile } from "../../../entry";
const exampleInput =
`1
2
-3
3
-2
0
4`;

type Cell = {
    value: bigint;
    index: number;
    offset: number;
}

const parseLines = (lines: string[]): Cell[] => {
    return lines.map(e => parseInt(e, 10)).map((e, i) => {
        return {value: BigInt(e), index: i, offset: e}
    });
}

export const grovePositioningSystem = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseLines(lines);
        for (let i = 0; i < input.length; i++) {
            const index = input.findIndex(e => e.index === i);
            const [item] = input.splice(index, 1);
            let newIndex = index + item.offset;
            while (newIndex < 0) {
                newIndex += input.length;
            }
            newIndex %= input.length;
            if (newIndex < 0) {
                throw new Error("Invalid index");
            }
            input.splice(Number(newIndex), 0, item);
        }
        const interesting = [1000, 2000, 3000];
        const zeroIndex = input.findIndex(e => e.value === 0n)!;
        const targets = interesting.map(i => (i + zeroIndex) % input.length).map(i => input[i]).map(e => e.value);
        await resultOutputCallback(Number(targets.reduce((acc, next) => acc + next, 0n)));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseLines(lines);
        const factor = 811589153;
        input.forEach(i => i.value *= BigInt(factor));
        input.forEach(i => i.offset = (i.offset * factor));
        for (let iteration = 0; iteration < 10; iteration++) {
            for (let i = 0; i < input.length; i++) {
                const index = input.findIndex(e => e.index === i);
                const [item] = input.splice(index, 1);
                let newIndex = index + item.offset;
                while (newIndex < 0) {
                    const f = Math.ceil(Math.abs(newIndex) / input.length)
                    newIndex += input.length * f;
                }
                newIndex %= input.length;
                if (newIndex < 0) {
                    throw new Error("Invalid index");
                }
                input.splice(Number(newIndex), 0, item);
            }
        }
        const interesting = [1000, 2000, 3000];
        const zeroIndex = input.findIndex(e => e.value === 0n)!;
        const targets = interesting.map(i => (i + zeroIndex) % input.length).map(i => input[i]).map(e => e.value);
        await resultOutputCallback(Number(targets.reduce((acc, next) => acc + next, 0n)));
    },
    {
        key: "grove-positioning-system",
        title: "Grove Positioning System",
        supportsQuickRunning: true,
        embeddedData: true,
        exampleInput,
        stars: 2,
        date: 20
    }
);