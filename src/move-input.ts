import { getLastEntry, getLastYear } from "./support/entry-list-helper";

import fs from "fs";
import { entryList } from "./entries/entryList";

(() => {
    let entry = getLastEntry();

    const year = getLastYear();

    const arg = process.argv[2];

    let day = new Date().getDate();

    if (!entry.metadata) {
        console.error("Cannot move input automatically without metadata");
        return;
    }

    if (arg && arg.length > 0) {
        day = parseInt(arg, 10);
        if (day.toString() !== arg) {
            throw new Error("Invalid input");
        }
        const e = entryList[year].find(e => e.date === day)?.entry;
        if (!e || !e.metadata) {
            throw new Error("Could not find entry");
        }
        entry = e;
    }


    fs.renameSync("input.txt", `./data/${year}/${entry.metadata!.key}.txt`);
})();
