import { VueConstructor } from "vue";
import { Vue } from "vue-property-decorator";
import { Entry } from "./entry";

import { ticketTranslation } from "./single-entries/2020/ticket-translation";
import TicketTranslationView from "../views/entries/custom/2020/TicketTranslationView.vue";

import { conwayCubes } from "./single-entries/2020/conway-cubes";
import ConwayCubesView from "../views/entries/custom/2020/ConwayCubesView.vue";

import { lobbyLayout } from "./single-entries/2020/lobby-layout";
import LobbyLayout from "../views/entries/custom/2020/LobbyLayout.vue";

import EntryWithPauseAndRun from "@/views/entries/EntryWithPauseAndRun.vue";
import EntryWithGraph from "@/views/entries/EntryWithGraph.vue";

import { entries as entries2015 } from "./single-entries/2015";
import { entries as entries2016 } from "./single-entries/2016";
import { entries as entries2017 } from "./single-entries/2017";
import { entries as entries2018 } from "./single-entries/2018";
import { entries as entries2019 } from "./single-entries/2019";
import { entries as entries2020 } from "./single-entries/2020";
import { entries as entries2021 } from "./single-entries/2021";

import { passagePathing } from "./single-entries/2021/passage-pathing";
import PassagePathing from "@/views/entries/custom/2021/PassagePathing.vue";

interface EntryMap { [key: string]: VueConstructor<Vue>; }

const keyMap: EntryMap = {
    "pause-and-run": EntryWithPauseAndRun,
    "graph": EntryWithGraph
};

const buildMap = (tuples: Array<[Entry, VueConstructor<Vue>]>, entries: Entry[]): EntryMap => {
    return entries.reduce((acc, next) => {
        if (next.metadata && next.metadata.customComponent) {
            const component = keyMap[next.metadata.customComponent];
            acc[next.metadata.key] = component;
        }
        return acc;
    },
        tuples.reduce((acc, next) => {
            acc[next[0].metadata!.key] = next[1];
            return acc;
        }, {} as EntryMap)
    );
};

const map2020: EntryMap = buildMap([
    [ticketTranslation, TicketTranslationView],
    [conwayCubes, ConwayCubesView],
    [lobbyLayout, LobbyLayout]
], entries2020);

const map2021: EntryMap = buildMap([
    [passagePathing, PassagePathing]
], entries2021);

export const map: { [key: string]: VueConstructor<Vue> } = [
    buildMap([], entries2015),
    buildMap([], entries2016),
    buildMap([], entries2017),
    buildMap([], entries2018),
    buildMap([], entries2019),
    map2020,
    map2021
].reduce((acc, next) => {
    for (const key in next) {
        if (key in next) {
            if (key in acc) {
                alert("Duplicate key: " + key);
            }
            acc[key] = next[key];
        }
    }
    return acc;
}, {});
