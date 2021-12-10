import { median } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";
import { unstackedSyntaxScoring } from "./unstacked";

type OpeningBrace = "(" | "[" | "{" | "<";
export type ClosingBrace = ")" | "]" | "}" | ">";

type Brace = OpeningBrace | ClosingBrace;

export type ParsingResult = {
    type: "corrupted",
    invalidToken: ClosingBrace
} | {
    type: "incomplete",
    missingTokens: ClosingBrace[]
};

export const opening: { [key: string]: ClosingBrace } = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">"
};

export const isOpening = (token: string): token is OpeningBrace => opening[token] !== undefined;
export const isClosing = (token: string): token is ClosingBrace => (Object.values(opening) as string[]).includes(token);

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

export const corruptedScore = (result: ParsingResult & {type: "corrupted"}): number => {
        const score: { [key: string]: number } = {
            ")": 3,
            "]": 57,
            "}": 1197,
            ">": 25137
        };
        return score[result.invalidToken];
};

export const incompleteScore = (parseResult: ParsingResult & {type: "incomplete"}): number => {
        const score: { [key: string]: number } = {
            ")": 1,
            "]": 2,
            "}": 3,
            ">": 4
        };
        return parseResult.missingTokens
            .reduce((acc, next) => acc * 5 + score[next], 0);
};

export const syntaxScoring = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        let result = 0;
        for (const x of lines) {
            const tokens = x.split("") as Brace[];
            const parseResult = parseLine(tokens);
            if (parseResult.type === "corrupted") {
                result += corruptedScore(parseResult);
            }

        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const scores: number[] = [];

        for (const x of lines) {
            const tokens = x.split("") as Brace[];
            const parseResult = parseLine(tokens);
            if (parseResult.type === "incomplete") {
                const lineScore = incompleteScore(parseResult);
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
        stars: 2,
        variants: [unstackedSyntaxScoring]
    }
);
