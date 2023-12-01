import { entryForFile } from "../../../entry";
import { buildCommunicator } from "./communication";

type Lookup = {[key: string]: number};

const numericalDigits: Lookup = {};
for (let i = 1; i < 10; i++) {
    numericalDigits[i.toString()] = i;
}

const findFirstAndLastDigits = (lookup: Lookup, line: string) => {
    const digits = Object.keys(lookup).flatMap(key => 
        [{key, index: line.indexOf(key)}, {key, index: line.lastIndexOf(key)}]
        .filter(e => e.index >= 0)
        .map(e => ({...e, value: lookup[e.key]}))
    ).sort((a, b) => a.index - b.index);
    return {
        line,
        digits,
        selected: [digits[0], digits[digits.length-1]]
    };
}

const calculateSum = (digitInfo: ReturnType<typeof findFirstAndLastDigits>[]): number => 
    digitInfo
        .map(info => info.selected)
        .reduce(
            (acc, next) => acc + next.reduce(
                (acc, next) => acc * 10 + next.value, 
            0), 
        0);


export const trebuchet = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, sendMessage, pause }) => {
        const digitInfo = lines.map(line => findFirstAndLastDigits(numericalDigits, line));
        const communicator = buildCommunicator(sendMessage, pause);
        await communicator.setup(lines, digitInfo.map(i => i.digits));
        const result = calculateSum(digitInfo);
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback, sendMessage, pause }) => {
        const validDigits: Lookup = {
            ...numericalDigits,
            "one": 1,
            "two": 2,
            "three": 3,
            "four": 4,
            "five": 5,
            "six": 6,
            "seven": 7,
            "eight": 8,
            "nine": 9
        };
        const digitInfo = lines.map(line => findFirstAndLastDigits(validDigits, line));
        const result = calculateSum(digitInfo);

        const communicator = buildCommunicator(sendMessage, pause);
        await communicator.setup(lines, digitInfo.map(i => i.digits));

        await resultOutputCallback(result);
    },
    {
        key: "trebuchet",
        title: "Trebuchet",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 1,
        stars: 2,
        exampleInput: `two1nine
eightwothree
abcone2threexyz
xtwone3four
4nineeightseven2
zoneight234
7pqrstsixteen`
    }
);