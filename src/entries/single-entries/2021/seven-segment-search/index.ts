import { entryForFile } from "../../../entry";
import { brute } from "./bruteVariant";

type Segment = "a" | "b" | "c" | "d" | "e" | "f" | "g";

export const sevenSegmentSearch = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.map((l) => parseInt(l, 10));
        let result: any = 0;
        for (const x of lines) {
            const right = x.split(" | ")[1];
            const tokens = right.split(" ");
            const interesting = tokens.filter((t) => [2, 4, 3, 7].includes(t.length));
            result += interesting.length;
        }
        for (const x of ns) {
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {

        const segmentNumberMapper: { [key: string]: number; } = buildSegmentNumberMapper();

        let result = 0;
        for (const x of lines) {
            const [left, right] = x.split(" | ");
            const input = left.split(" ").map((x) => x.split("") as Segment[]);
            const output = right.split(" ");

            const mapper: { [key: string]: Segment; } = buildMapper(input);

            const rawNumber = output.map((out) => segmentNumberMapper[
                out.split("").map((e) => mapper[e]).sort().join("")
            ].toString()).join("");

            const number = parseInt(rawNumber, 10);
            result += number;

        }
        await resultOutputCallback(result);
    },
    {
        key: "seven-segment-search",
        title: "Seven Segment Search",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        variants: [brute]
    }
);

function buildMapper(input: Segment[][]) {
    const frequencyCounter = buildFrequencyCounter(input);

    const mapper: { [key: string]: Segment; } = {};

    const aOrC: Segment[] = [];
    const gOrD: Segment[] = [];

    for (const key of Object.keys(frequencyCounter)) {
        if (frequencyCounter[key] === 6) {
            mapper[key] = "b";
        } else if (frequencyCounter[key] === 4) {
            mapper[key] = "e";
        } else if (frequencyCounter[key] === 9) {
            mapper[key] = "f";
        } else if (frequencyCounter[key] === 7) {
            gOrD.push(key as Segment);
        } else if (frequencyCounter[key] === 8) {
            aOrC.push(key as Segment);
        }
    }

    const rule4 = input.filter((i) => i.length === 4)[0];

    const [c] = aOrC.filter((x) => rule4.includes(x));
    mapper[c] = "c";
    mapper[aOrC.filter((x) => x !== c)[0]] = "a";
    const [d] = gOrD.filter((x) => rule4.includes(x));
    mapper[d] = "d";
    mapper[gOrD.filter((x) => x !== d)[0]] = "g";
    return mapper;
}

function buildSegmentNumberMapper() {
    const numSegments: { [key: number]: Segment[]; } = {
        0: ["a", "b", "c", "e", "f", "g"],
        1: ["c", "f"],
        2: ["a", "c", "d", "e", "g"],
        3: ["a", "c", "d", "f", "g"],
        4: ["b", "c", "d", "f"],
        5: ["a", "b", "d", "f", "g"],
        6: ["a", "b", "d", "e", "f", "g"],
        7: ["a", "c", "f"],
        8: ["a", "b", "c", "d", "e", "f", "g"],
        9: ["a", "b", "c", "d", "f", "g"],
    };
    const segmentsNum: { [key: string]: number; } = {};

    for (const key of Object.keys(numSegments)) {
        const n = parseInt(key, 10);
        segmentsNum[numSegments[n].sort().join("")] = n;
    }
    return segmentsNum;
}

function buildFrequencyCounter(input: Segment[][]) {
    const frequencyCounter: { [key: string]: number; } = {};

    for (const v of input) {
        for (const x of v) {
            frequencyCounter[x] = (frequencyCounter[x] || 0) + 1;
        }
    }
    return frequencyCounter;
}
