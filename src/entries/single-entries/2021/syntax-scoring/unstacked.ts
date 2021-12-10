import { ClosingBrace, corruptedScore, incompleteScore, isClosing, isOpening, opening, ParsingResult } from ".";
import { median } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

const parseLine = (line: string): ParsingResult => {
    const patterns = ["{}", "<>", "()", "[]"];
    let found = false;
    console.log("From", line);
    do {
        found = false;
        for (const pattern of patterns) {
            if (line.includes(pattern)) {
                line = line.replace(pattern, "");
                found = true;
                break;
            }
        }
    } while (found);
    console.log("To", line);
    const tokens = [...line];
    const [invalidCharacter] = tokens.filter((token) => isClosing(token));
    if (invalidCharacter) {
        return {
            type: "corrupted",
            invalidToken: invalidCharacter as ClosingBrace
        };
    } else {
        return {
            type: "incomplete",
            missingTokens: tokens.reverse().map((t) => opening[t])
        };
    }
};

export const unstackedSyntaxScoring = entryForFile(
    async ({ lines, resultOutputCallback }) => {
        let result = 0;
        for (const line of lines) {
            const parseResult = parseLine(line);
            if (parseResult.type === "corrupted") {
                result += corruptedScore(parseResult);
            }

        }
        await resultOutputCallback(result);
    },
    async ({ lines, resultOutputCallback }) => {
        const scores: number[] = [];

        for (const line of lines) {
            const parseResult = parseLine(line);
            if (parseResult.type === "incomplete") {
                const lineScore = incompleteScore(parseResult);
                scores.push(lineScore);
            }
        }
        await resultOutputCallback(median(scores));
    },
    {
        key: "Unstacked",
        title: "Syntax Scoring",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
