import { Entry } from "./entry";

import {entries as entries2015} from "./single-entries/2015";
import {entries as entries2016} from "./single-entries/2016";
import {entries as entries2017} from "./single-entries/2017";
import {entries as entries2018} from "./single-entries/2018";
import {entries as entries2019} from "./single-entries/2019";
import {entries as entries2020} from "./single-entries/2020";
import {entries as entries2021} from "./single-entries/2021";
import {entries as entries2022} from "./single-entries/2022";
import {entries as entries2023} from "./single-entries/2023";
import {entries as entries2024} from "./single-entries/2024";
import {entries as entries2025} from "./single-entries/2025";

export interface EntryRoute extends EntryRouteBase {
    date: number;
}

interface EntryRouteBase {
    name: string;
    title: string;
    entry: Entry;
    date?: number;
    stars?: 1 | 2;
}

export type EntryListYearElement = EntryRouteBase | Entry;

const isEntryRouteBase = (e: Entry | EntryRouteBase): e is EntryRouteBase => {
    return (e as EntryRouteBase).name !== undefined;
};

function enrichList(entries: EntryListYearElement[]): EntryRoute[] {
    let index = 0;
    return entries.map((e) => {
        index++;
        if (isEntryRouteBase(e)) {
            if (e.date !== undefined) {
                index = e.date;
            }
            return { ...e, date: index };
        } else {
            const entry = e;
            if (entry.metadata === undefined) {
                throw new Error("Entry must have metadata if not specified in here");
            }
            if (entry.metadata.date !== undefined) {
                index = entry.metadata.date;
            }
            return {
                name: entry.metadata.key,
                title: entry.metadata.title,
                stars: entry.metadata.stars,
                date: index,
                entry,
            };
        }
    });
}


export const entryList: { [key: string]: EntryRoute[] } = {
    2015: enrichList(entries2015),
    2016: enrichList(entries2016),
    2017: enrichList(entries2017),
    2018: enrichList(entries2018),
    2019: enrichList(entries2019),
    2020: enrichList(entries2020),
    2021: enrichList(entries2021),
    2022: enrichList(entries2022),
    2023: enrichList(entries2023),
    2024: enrichList(entries2024),
    2025: enrichList(entries2025),
};


