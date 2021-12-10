import { median } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

type OpeningBrace = "(" | "[" | "{" | "<";
type ClosingBrace = ")" | "]" | "}" | ">";

type Brace = OpeningBrace | ClosingBrace;

type ParsingResult = {
    type: "corrupted",
    invalidToken: ClosingBrace
} | {
    type: "incomplete",
    missingTokens: ClosingBrace[]
};

const opening: { [key: string]: ClosingBrace } = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">"
};

const isOpening = (token: Brace): token is OpeningBrace => opening[token] !== undefined;

const parseLine = (tokens: Brace[]): ParsingResult => {
    const expected: ClosingBrace[] = [];
    for (const token of tokens) {
        if (isOpening(token)) {
            expected.push(opening[token]);
        } else {
            const e = expected.pop();
            if (e !== token) {
                return {
                    type: "corrupted",
                    invalidToken: token as ClosingBrace
                };
            }
        }
    }
    return {
        type: "incomplete",
        missingTokens: expected.reverse()
    };
};

export const syntaxScoring = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const score: { [key: string]: number } = {
            ")": 3,
            "]": 57,
            "}": 1197,
            ">": 25137
        };
        let result = 0;
        for (const x of lines) {
            const tokens = x.split("") as Brace[];
            const parseResult = parseLine(tokens);
            if (parseResult.type === "corrupted") {
                result += score[parseResult.invalidToken];
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
        };

        for (const x of lines) {
            const tokens = x.split("") as Brace[];
            const parseResult = parseLine(tokens);
            if (parseResult.type === "incomplete") {
                const lineScore = parseResult.missingTokens
                    .reduce((acc, next) => acc * 5 + incompleteScore[next], 0);
                scores.push(lineScore);
            }


        }
        await resultOutputCallback(median(scores));
    },
    {
        key: "syntax-scoring",
        title: "Syntax Scoring",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
