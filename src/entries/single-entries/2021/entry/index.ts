import { entryForFile } from "../../../entry";

type Segment = "a" | "b" | "c" | "d" | "e" | "f" | "g";

export const entry = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = lines.map(l => parseInt(l, 10));
        let result: any = 0
        for (const x of lines) {
            const right = x.split(" | ")[1];
            const tokens = right.split(" ");
            const interesting = tokens.filter(t => [2, 4, 3, 7].includes(t.length));
            result += interesting.length;
        }
        for (const x of ns) {
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {

        const possibleConfig: { [key: number]: number[] } = {
            7: [8],
            2: [1],
            4: [4],
            3: [7],
            6: [0, 6, 9],
            5: [2, 3, 5],
        }

        const numSegments: { [key: number]: Segment[] } = {
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

        const frequencyMap: {[key: number]: Segment[]} = {
            
        }

            const frequencyCounter: {[key: string]: number} = {};

            for (const v of Object.values(numSegments)) {
                for (const x of v) {
                    frequencyCounter[x] = (frequencyCounter[x] || 0) + 1;
                }
            }

            console.log(frequencyCounter);


        const segmentsNum: { [key: string]: number } = {
        };

        for (const key of Object.keys(numSegments)) {
            const n = parseInt(key, 10);
            segmentsNum[numSegments[n].sort().join("")] = n;
        }

        const ns = lines.map(l => parseInt(l, 10));
        let result: any = 0
        for (const x of lines) {
            const [left, right] = x.split(" | ");
            const input = left.split(" ").map(x => x.split("") as Segment[]);
            const output = right.split(" ");

            const candidates: Map<Segment, Set<Segment>> = new Map<Segment, Set<Segment>>();

            const allSegments: Segment[] = ["a", "b", "c", "d", "e", "f", "g"];

            for (const x of allSegments) {
                candidates.set(x, new Set<Segment>(allSegments));
            }

            const rule5Counter: {[key: string]: number} = {};
            const frequencyCounter: {[key: string]: number} = {};

            for (const v of input) {
                for (const x of v) {
                    frequencyCounter[x] = (frequencyCounter[x] || 0) + 1;
                }
            }

            console.log(frequencyCounter);
            for (const rule5 of input) {
                if (rule5.length === 5) {
                    for (const x of rule5) {
                        rule5Counter[x] = (rule5Counter[x] || 0) + 1;
                    }
                }
            }
            for (const key of Object.keys(rule5Counter)) {
                if (rule5Counter[key] === 1) {
                    candidates.set(key as Segment, new Set<Segment>(["b", "e"]));
                }
            }

            const rule6Counter: {[key: string]: number} = {};
            for (const rule6 of input) {
                if (rule6.length === 6) {
                    for (const x of rule6) {
                        rule6Counter[x] = (rule6Counter[x] || 0) + 1;
                    }
                }
            }
            for (const key of Object.keys(rule6Counter)) {
                if (rule6Counter[key] === 2) {
                    candidates.set(key as Segment, new Set<Segment>(["d", "c", "e"]));
                }
            }

            while (allSegments.some(s => candidates.get(s)!.size > 1)) {
                let hasChanged = false;

                for (const x of input) {
                    const configs = possibleConfig[x.length];
                    for (const currentSegment of x) {
                        const currentCandidates = candidates.get(currentSegment)!;
                        const foundSegments: Set<Segment> = new Set<Segment>();
                        for (const config of configs) {
                            const segments = numSegments[config];
                            for (const s of segments) {
                                foundSegments.add(s);
                            }
                        }
                        const toRemove: Segment[] = [];
                        for (const cc of currentCandidates) {
                            if (!foundSegments.has(cc)) {
                                toRemove.push(cc);
                            }
                        }
                        toRemove.forEach(c => currentCandidates.delete(c));
                    }
                }

                const reverseCandidates: {[key: string]: Segment[]} = {};

                for (const [key, entry] of candidates) {
                    if (entry.size === 1) {
                        const unique = [...entry.values()][0];
                        for (const [oKey, oEntry] of candidates) {
                            if (oEntry !== entry && oEntry.has(unique)) {
                                hasChanged = true;
                                oEntry.delete(unique);
                            }
                        }
                    } 
                    const serialized = [...entry].sort().join("");
                    reverseCandidates[serialized] = reverseCandidates[serialized] || [];
                    reverseCandidates[serialized].push(key);
                }

                for (const rule of Object.keys(reverseCandidates)) {
                    if (rule.length === reverseCandidates[rule].length && rule.length !== 1) {
                        for (const segment of rule.split("") as Segment[]) {
                            for (const [key, entry] of candidates) {
                                if (!reverseCandidates[rule].includes(key)) {
                                    if (entry.has(segment)) {
                                        entry.delete(segment);
                                        hasChanged = true;
                                    }
                                }
                            }
                        }
                    }
                }

                if (!hasChanged) {
                    break;
                }
            }

            const allFound = [...candidates].reduce((acc, [nextK, nextV]) => acc && nextV.size === 1, true)
            if (!allFound) {
                await outputCallback("Failed");
                return;
            }

            for (const [k,v] of candidates) {
                console.log(k + " - " + [...v][0]);
            }

            const mapper: {[key: string]: string} = {};
            for(const [key, value] of candidates) {
                mapper[[...value][0]] = key;
            }

            let res: string[] = [];

            for (const out of output) {
                const x = out.split("").map(e => mapper[e]).sort().join("");
                const n = segmentsNum[x];
                if (n === undefined) {
                    throw new Error("Invalid segment: " + x);
                }
                res.push(n.toString());
            }

            console.log(res.join(""));
        }
        for (const x of ns) {
        }
        await resultOutputCallback(result);
    },
    {
        key: "key",
        title: "title",
        supportsQuickRunning: true,
        embeddedData: true
    }
);