import { groupBy, sum } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

type Packet = number | Packet[]

const parseLines = (lines: string[]): {a: Packet, b: Packet}[] => {
    return groupBy(lines, 3).map(e => {
        const [a, b] = e;
        return {a: JSON.parse(a), b: JSON.parse(b)};
    })
}

const isNumber = (a: Packet): a is number => {
    return typeof(a) !== "object";
}

const comparer = (a: Packet, b: Packet): number => {
    if (isNumber(a) && isNumber(b)) {
        return a - b;
    } else if (typeof(a) === "object" && typeof(b) === "object") {
        const maxLength = Math.max(a.length, b.length);
        for (let i = 0; i < maxLength; i++) {
            const xa = a[i];
            const xb = b[i];
            if (xa === undefined) {
                return -1;
            } else if (xb === undefined) {
                return 1;
            }
            const nested = comparer(xa, xb);
            if (nested !== 0) {
                return nested;
            }
        }
        return 0;
    } else {
        if (typeof(a) === "object") {
            b = [b];
        } else {
            a = [a];
        }
        return comparer(a, b);
    }
}

export const distressSignal = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ps = parseLines(lines);
        const indexes = ps.map((e, i) => {
            const res = comparer(e.a, e.b);
            if (res < 0) {
                return i + 1;
            } else {
                return 0;
            }
        });
        await resultOutputCallback(sum(indexes));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ps = parseLines(lines);
        const dividers = {a: [[2]], b: [[6]]};
        ps.push(dividers);
        const packets = ps.flatMap(e => [e.a, e.b]);
        packets.sort(comparer);
        const indexes = [packets.findIndex(e => e === dividers.a), packets.findIndex(e => e === dividers.b)];
        await resultOutputCallback(indexes.map(e => e + 1).reduce((acc, next) => acc * next, 1));
    },
    {
        key: "distress-signal",
        title: "Distress Signal",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);