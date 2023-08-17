import { entryForFile } from "../../../entry";

type SnafuDigit = "0" | "1" | "2" | "-" | "=";
type Snafu = SnafuDigit[];

const exampleInput =
`1=-0-2
12111
2=0=
21
2=01
111
20012
112
1=-1=
1-12
12
1=
122`;

const parseSnafu = (s: string): Snafu => {
    const tokens = s.split("");
    if (tokens.some(t => !["0","1","2","-","="].includes(t))) {
        throw new Error("Invalid snafu: " + s);
    }
    return tokens.reverse() as Snafu;
}

const snafuToString = (s: Snafu) => {
    return [...s].reverse().join("");
}

const snafuToDecimal = (snafu: Snafu): number => {
    let result = 0;
    let factor = 1;
    for (const digit of snafu) {
        let value: number;
        if (digit === "0" || digit === "1" || digit === "2") {
            value = parseInt(digit, 10);
        } else if (digit === "-") {
            value = -1;
        } else {
            value = -2;
        }
        result += value * factor;
        factor *= 5;
    }
    return result;
}

const decimalToSnafu = (n: number): Snafu => {
    const res: Snafu = [];
    while (n > 0) {
        const digit = n % 5;
        n = Math.floor(n/5);
        if (digit < 3) {
            res.push(digit.toString() as SnafuDigit);
        } else {
            if (digit === 3) {
                res.push("=");
            } else {
                res.push("-");
            }
            n++;
        }
    }
    return res;
}

const parseInput = (lines: string[]): Snafu[] => {
    return lines.map(parseSnafu);
}

export const fullOfHotAir = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const snafus = parseInput(lines);
        const decimals = snafus.map(snafuToDecimal);
        const sum = decimals.reduce((acc, next) => acc + next, 0);
        await outputCallback(sum);
        await outputCallback(snafuToDecimal(decimalToSnafu(sum)));
        await resultOutputCallback(snafuToString(decimalToSnafu(sum)));

    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        throw new Error("It's christmas, only part 1 exists!");
    },
    {
        key: "full-of-hot-air",
        title: "Full of Hot Air",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 25,
        exampleInput,
        stars: 2
    }
);