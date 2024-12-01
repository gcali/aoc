import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { DefaultDict } from "../../../../support/data-structure";
import { buildCommunicator } from "./communication";
import { zip } from "../../../../support/sequences";

export const historianHysteria = entryForFile(
    async ({ lines, resultOutputCallback, sendMessage, pause }) => {
        const lists = parseInput(lines);
        const communicator = buildCommunicator(sendMessage, pause);

        const distances = lists.first.map((e, i) => Math.abs(e - lists.second[i]));
        if (sendMessage) {
            for (const [element, distance] of zip([...zip(lists.first, lists.second)], distances)) {
                await communicator.sendPair(element, distance);
                await pause(1);
            }
        }
        const result = distances.reduce((acc, next) => acc + next, 0);

        await resultOutputCallback(result);
    },
    async ({ lines, resultOutputCallback, sendMessage, pause }) => {
        const lists = parseInput(lines);
        const communicator = buildCommunicator(sendMessage, pause);

        const similarityCecker = new DefaultDict<number, number>(() => 0);
        for (const n of lists.second) {
            similarityCecker.update(n, v => v + 1);
        }

        if (sendMessage) {
            await communicator.sendLookup(similarityCecker)
        }

        const similarities = lists.first.map(e => e * similarityCecker.get(e));
        if (sendMessage) {
            for (const item of lists.first) {
                await communicator.sendLookableEntry(item);
            }
        }
        const result = similarities.reduce((acc, next) => acc + next, 0);

        await resultOutputCallback(result);
    },
    {
        key: "historian-hysteria",
        title: "Historian Hysteria",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 1,
        stars: 2,
        suggestedDelay: 1
    }
);

function parseInput(lines: string[]) {
    const ns = new Parser(lines)
        .tokenize(/\s+/)
        .mapTokens(s => s.n());

    const lists = {
        "first": ns.map(e => e[0]).sort(),
        "second": ns.map(e => e[1]).sort()
    };
    return lists;
}
