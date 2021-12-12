import { pathToFileURL } from "url";
import { Queue } from "../../../../support/data-structure";
import { entryForFile } from "../../../entry";
import { buildCommunicator } from "./communication";

const isSmallCave = (cave: string): boolean => {
    return cave.toLowerCase() === cave;
};

export const passagePathing = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback, sendMessage, pause}) => {

        const com = buildCommunicator(sendMessage, pause);

        const {connectedTo, edges}  = parseInput(lines);

        await com.setup(edges);

        const queue = new Queue<{cave: string; path: string[]}>();
        queue.add({cave: "start", path: ["start"]});
        await com.queue("start");

        let paths = 0;

        while (!queue.isEmpty) {
            const current = queue.get()!;

            await com.current(current.cave);

            const neighbours = connectedTo[current.cave];
            if (!neighbours) {
                continue;
            }

            for (const n of neighbours) {
                if (n === "start" || n === "end") {
                    if (n === "end") {
                        paths++;
                    }
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
                await com.queue(newNode.cave);
            }

            await com.visited(current.cave);
        }

        await resultOutputCallback(paths);

    },
    async ({ lines, resultOutputCallback }) => {
        const {connectedTo} = parseInput(lines);

        const queue = new Queue<{cave: string; smallVisited: string[], hasDuplicates: boolean}>();
        queue.add({cave: "start", smallVisited: ["start"], hasDuplicates: false});

        let paths = 0;

        while (!queue.isEmpty) {
            const current = queue.get()!;

            const neighbours = connectedTo[current.cave];
            if (!neighbours) {
                continue;
            }

            for (const n of neighbours) {
                if (n === "start" || n === "end") {
                    if (n === "end") {
                        paths++;
                    }
                    continue;
                }

                let hasDuplicates = current.hasDuplicates;
                if (isSmallCave(n)) {
                    const duplicates = current.smallVisited.filter((p) => p === n).length;
                    if (duplicates > 0) {
                        if (current.hasDuplicates) {
                            continue;
                        }
                        hasDuplicates = true;
                    }
                }
                const newNode = {
                    cave: n,
                    smallVisited: [...current.smallVisited],
                    hasDuplicates
                };
                if (isSmallCave(n)) {
                    newNode.smallVisited.push(n);
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
        stars: 2,
        suggestedDelay: 10
    }
);

function parseInput(lines: string[]): {connectedTo: { [key: string]: string[]; }, edges: {from: string; to: string}[]} {
    const edges = lines.map((line) => {
        const [from, to] = line.split("-");
        return { from,to };
    });

    const connectedTo: { [key: string]: string[]; } = {};

    for (const edge of edges) {
        const k = connectedTo[edge.from] || [];
        k.push(edge.to);
        connectedTo[edge.from] = k;

        const j = connectedTo[edge.to] || [];
        j.push(edge.from);
        connectedTo[edge.to] = j;
    }
    return {connectedTo, edges};
}
