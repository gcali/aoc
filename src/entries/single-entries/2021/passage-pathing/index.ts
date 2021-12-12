import { pathToFileURL } from "url";
import { Queue } from "../../../../support/data-structure";
import { entryForFile } from "../../../entry";

const isSmallCave = (cave: string): boolean => {
    return cave.toLowerCase() === cave;
}

export const passagePathing = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const connectedTo  = parseInput(lines);

        const queue = new Queue<{cave: string; path: string[]}>();
        queue.add({cave: "start", path: ["start"]});

        let paths = 0;

        while (!queue.isEmpty) {
            const current = queue.get()!;

            const neighbours = connectedTo[current.cave];
            if (!neighbours) {
                continue;
            }

            for (const n of neighbours) {
                if (n === "end") {
                    paths++;
                    continue;
                }
                if (isSmallCave(n) && current.path.includes(n)) {
                    continue;
                }
                const newNode = {
                    cave: n,
                    path: [...current.path, n]
                };
                queue.add(newNode);
            }
        }

        await resultOutputCallback(paths);

    },
    async ({ lines, resultOutputCallback }) => {
        const edges = lines.map(line => line.split("-") as [string,string]);

        const connectedTo: {[key: string]: string[]} = {};

        for (const edge of edges) {
            const k = connectedTo[edge[0]] || [];
            k.push(edge[1]);
            connectedTo[edge[0]] = k;

            const j = connectedTo[edge[1]] || [];
            j.push(edge[0]);
            connectedTo[edge[1]] = j;
        }

        const queue = new Queue<{cave: string; path: string[], hasDuplicates: boolean}>();
        queue.add({cave: "start", path: ["start"], hasDuplicates: false});

        let paths = 0;

        while (!queue.isEmpty) {
            const current = queue.get()!;

            const neighbours = connectedTo[current.cave];
            if (!neighbours) {
                continue;
            }

            for (const n of neighbours) {
                let hasDuplicates = current.hasDuplicates;
                if (n === "end") {
                    paths++;
                }
                if (isSmallCave(n)) {
                    if (n === "start" || n === "end") {
                        continue;
                    }
                    const howManyTimes = current.path.filter(p => p === n).length;
                    if (howManyTimes > 0) {
                        if (current.hasDuplicates) {
                            continue;
                        }
                        hasDuplicates = true;
                    }
                }
                const newNode = {
                    cave: n,
                    path: [...current.path],
                    hasDuplicates: hasDuplicates
                };
                if (isSmallCave(n)) {
                    newNode.path.push(n);
                }
                queue.add(newNode);
            }
        }

        await resultOutputCallback(paths);
    },
    {
        key: "passage-pathing",
        title: "Passage Pathing",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);

function parseInput(lines: string[]): { [key: string]: string[]; } {
    const edges = lines.map(line => line.split("-") as [string, string]);

    const connectedTo: { [key: string]: string[]; } = {};

    for (const edge of edges) {
        const k = connectedTo[edge[0]] || [];
        k.push(edge[1]);
        connectedTo[edge[0]] = k;

        const j = connectedTo[edge[1]] || [];
        j.push(edge[0]);
        connectedTo[edge[1]] = j;
    }
    return connectedTo;
}
