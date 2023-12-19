import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { areArraysEqual } from "../../../../support/sequences";
import { memoize } from "../../../../support/optimization";

const findContiguousGroups = (e: string): number[] => {
    const contigous = [];
    let delta = 0;
    for (let i = 0; i < e.length; i++) {
        if (e[i] === ".") {
            if (delta > 0) {
                contigous.push(delta);
            }
            delta = 0;
        } else {
            delta++;
        }
    }
    if (delta > 0) {
        contigous.push(delta);
    }
    return contigous;
}

const findArrangements = memoize({
    serialize(e) {
        return `${e.simple}_${e.contiguous.join(",")}`;
    }, deserialize(e) {
        const [simple, cont] = e.split("_");
        return { simple, contiguous: cont.split(",").map(e => parseInt(e, 10)) };
    }
},
    (row: Row): number => {
        const { simple, contiguous } = row;
        if (simple.length === 0) {
            if (contiguous.length === 0) {
                return 1;
            } else {
                return 0;
            }
        } else if (simple.indexOf("?") < 0) {
            const groups = findContiguousGroups(simple);
            if (!areArraysEqual(groups, contiguous, (a, b) => a === b)) {
                return 0;
            }
            return 1;
        } else if (simple[0] === ".") {
            return findArrangements({ simple: simple.slice(1), contiguous });
        } else if (simple[0] === "#") {
            if (contiguous.length === 0 || contiguous[0] < 1) {
                return 0;
            }
            const [currentGroup] = contiguous;
            for (let i = 0; i < currentGroup; i++) {
                if (simple[i] !== "#" && simple[i] !== "?") {
                    return 0;
                }
            }
            if (simple[currentGroup] === "#") {
                return 0;
            }
            let newMain = simple.slice(currentGroup);
            if (newMain.length > 0 && newMain[0] === "?") {
                newMain = "." + newMain.slice(1);
            }
            return findArrangements({ simple: newMain, contiguous: contiguous.slice(1) });
        } else if (simple[0] === "?") {
            let arrangements = findArrangements({ simple: "." + simple.slice(1), contiguous });
            if (contiguous.length > 0 && contiguous[0] > 0) {
                const other = findArrangements({ simple: "#" + simple.slice(1), contiguous });
                arrangements += other;
            }
            return arrangements;
        } else {
            throw new Error("Invalid input");
        }
    });

type Row = { simple: string; contiguous: number[] };

const unfold = (input: string, separator: string): string => {
    const newSimple = new Array<string>(5);
    newSimple.fill(input);
    return newSimple.join(separator);
}

export const hotSprings = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .tokenize(" ")
            .startLabeling()
            .label(e => e.run(), "simple")
            .label(e => e.ns(), "contiguous")
            .run();
        let result = 0;
        for (const line of ns) {
            const arrangements = findArrangements(line);
            result += arrangements;
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .tokenize(" ")
            .startLabeling()
            .label(e => unfold(e.run(), "?"), "simple")
            .label(e => e.transform(e => unfold(e, ",")).ns(), "contiguous")
            .run();
        let result = 0;
        for (const line of ns) {
            const arrangements = findArrangements(line);
            result += arrangements;
        }
        await resultOutputCallback(result);
    },
    {
        key: "hot-springs",
        title: "Hot Springs",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 12,
        stars: 2,
        exampleInput: `???.### 1,1,3
.??..??...?##. 1,1,3
?#?#?#?#?#?#?#? 1,3,1,6
????.#...#... 4,1,1
????.######..#####. 1,6,5
?###???????? 3,2,1`
    }
);