import { getLastEntry, getLastYear } from "./support/entry-list-helper";

import fs from "fs";

(() => {
    const entry = getLastEntry();

    const year = getLastYear();

    if (!entry.metadata) {
        console.error("Cannot move input automatically without metadata");
        return;
    }

    fs.renameSync("input.txt", `./data/${year}/${entry.metadata.key}.txt`);
})();
