import { MyIterable, permutationGenerator } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";
import { buildVisualizer } from "./bruteVisualizer";

export type Segment = "a" | "b" | "c" | "d" | "e" | "f" | "g";

type Mapper<T> = {[key: string]: T};

export const brute = entryForFile(
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
    async ({ lines, outputCallback, resultOutputCallback, screen, pause }) => {
        const {segmentNumMapper, targetSerialization}  = buildSetupData();

        const allSegments: Segment[] = ["a", "b", "c", "d", "e", "f", "g"];

        const vs = buildVisualizer(screen, pause);

        await vs.setup();

        let result = 0;

        for (const x of lines) {
            await vs.addLine();
            const [left, right] = x.split(" | ");
            const input = left.split(" ").map((x) => x.split("") as Segment[]);
            const output = right.split(" ").map((d) => d.split("") as Segment[]);

            const candidates = permutationGenerator([...allSegments]);

            let hasFound = false;

            for (const candidate of candidates) {
                const candidateMapper = new MyIterable(allSegments).zip(candidate).reduce({} as {[key: string]: string}, (acc, next) => {
                    acc[next[1]] = next[0];
                    return acc;
                } );

                const candidateDigits = input.map((digit) => digit.map((segment) => candidateMapper[segment] as Segment).sort());
                const candidateOutput = output.map((digit) => digit.map((segment) => candidateMapper[segment] as Segment));
                await vs.setCurrentLineState({input: candidateDigits, output: candidateOutput});
                const candidateSerialization = serializeDigits(candidateDigits);
                // const candidateSerialization = input.map(digit => digit.map(segment => candidateMapper[segment]).sort().join("")).sort().join("|");
                if (candidateSerialization === targetSerialization) {
                    await vs.finishLine();
                    const number = mapOutputToNumber(output, segmentNumMapper, candidateMapper);
                    result += number;
                    hasFound = true;
                    break;
                }
            }

            await pause();

            if (!hasFound) {
                throw new Error("Brute force failed");
            }
        }
        await resultOutputCallback(result);
    },
    {
        key: "Brute",
        title: "Seven Segment Search",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2,
        suggestedDelay: 1
    }
);

const mapOutputToNumber = (output: Segment[][], segmentNumMapper: Mapper<number>, candidateMapper: Mapper<string>) => {
    const rawNumber = output.map((out) => segmentNumMapper[out.map((e) => candidateMapper[e]).sort().join("")].toString()).join("");

    const number = parseInt(rawNumber, 10);
    return number;
};

const serializeDigits = (digits: Segment[][]): string =>
    digits.map((segment) => segment.sort().join("")).sort().join("|");

const buildSetupData = (): {
    segmentNumMapper: {[key: string]: number};
    targetSerialization: string;
} => {
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
    return {
        segmentNumMapper: segmentsNum,
        targetSerialization: Object.keys(segmentsNum).sort().join("|")
    };
};
