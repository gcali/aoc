import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { exampleInput } from "./example";

type Id = {
    first: number;
    second: number;
}

const parseId = (token: string): Id => {
    const [a, b] = token.split("-");
    return {
        first: parseInt(a, 10),
        second: parseInt(b, 10)
    }
}

const parseInput = (lines: string[]): Id[] => {
    return lines[0].split(",").map(parseId);
}

const isInvalid = (id: number) => {
    const serialized = id.toString();
    if (serialized.length % 2 !== 0) {
        return false;
    }
    const mserializeddle = serialized.length / 2;
    const a = serialized.slice(0, mserializeddle);
    const b = serialized.slice(mserializeddle);
    return a === b;
}


let totalNumbers = 0;

const isInvalidFlexible = (id: number) => {
    const serialized = id.toString();
    const lengths = [];
    for (let i = 1; i <= serialized.length/2; i++) {
        if (serialized.length % i === 0) {
            lengths.push(i)
        }
    }
    for (const candidateLength of lengths) {
        const token = serialized.slice(0, candidateLength);
        const totalString = [];
        for (let i = 0; i < serialized.length / candidateLength; i++) {
            totalString.push(token);
        }
        if (totalString.join("") == serialized) {
            return true;
        }
    }
    return false;
}

const getInvalid = (id: Id, filtering: (id: number) => boolean): number[] => {
    const candidates = [];
    for (let i = id.first; i <= id.second; i++) {
        candidates.push(i);
        totalNumbers++;
    }
    return candidates.filter(filtering)
}

export const giftShop = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);
        const totalInvalid = input.reduce((acc, next) => acc + getInvalid(next, isInvalid).reduce((a, n) => a + n, 0), 0);
        await resultOutputCallback(totalInvalid);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const input = parseInput(lines);
        const totalInvalid = input.reduce((acc, next) => acc + getInvalid(next, isInvalidFlexible).reduce((a, n) => a + n, 0), 0);
        await resultOutputCallback(totalInvalid);
    },
    {
        key: "gift-shop",
        title: "Gift Shop",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 2,
        exampleInput: exampleInput,
        stars: 2
    }
);