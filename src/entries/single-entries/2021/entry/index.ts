import { entryForFile } from "../../../entry";


const opening: { [key: string]: string } = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">"
}

export const entry = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const score: { [key: string]: number } = {
            ")": 3,
            "]": 57,
            "}": 1197,
            ">": 25137
        }
        let result = 0;
        for (const x of lines) {
            const tokens = x.split("");
            const expected: string[] = [];
            for (const token of tokens) {
                if (opening[token] !== undefined) {
                    expected.push(opening[token]);
                } else {
                    const e = expected.pop();
                    if (e !== token) {
                        const s = score[token];
                        result += s;
                    }
                }
            }

        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const scores: number[] = [];
        const incompleteScore: { [key: string]: number } = {
            ")": 1,
            "]": 2,
            "}": 3,
            ">": 4
        }

        for (const x of lines) {
            const tokens = x.split("");
            const expected: string[] = [];
            let corrupted = false;
            for (const token of tokens) {
                if (opening[token] !== undefined) {
                    expected.push(opening[token]);
                } else {
                    const e = expected.pop();
                    if (e !== token) {
                        corrupted = true;
                        break;
                    }
                }
            }
            if (!corrupted) {
                expected.reverse();
                const lineScore = expected.reduce((acc, next) => acc * 5 + incompleteScore[next], 0);
                scores.push(lineScore);
            }


        }
        const length = scores.length;
        const target = Math.floor(length / 2);
        await resultOutputCallback(scores[target]);
    },
    {
        key: "key",
        title: "title",
        supportsQuickRunning: true,
        embeddedData: true
    }
);