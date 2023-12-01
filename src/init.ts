import fetch from "node-fetch";
import fs from "fs";
import { parse } from "node-html-parser";
import { getLastYear } from "./support/entry-list-helper";
import { download, parseArg } from "./download";

const arg = process.argv[2];

const day = parseArg(arg, new Date().getDate());

const year = parseArg(process.argv[3], parseInt(getLastYear(), 10));

const token = fs.readFileSync("session", { encoding: "utf-8" }).split("\n")[0].trim();

const main = async () => {
    const url = `https://adventofcode.com/${year}/day/${day}`;
    console.log("Retrieving " + url);
    const result = await fetch(url, {
        headers: {
            cookie: `session=${token}`
        }
    });

    const raw = await result.text();

    const dom = parse(raw);

    const fullTitle = dom.querySelector("article.day-desc h2")?.innerText;
    if (!fullTitle) {
        throw new Error("Could not find title");
    }

    const extractor = /^-* Day \d\d?: (.*?) -*$/;
    const match = fullTitle.match(extractor);
    if (!match) {
        throw new Error("Invalid title format: " + fullTitle);
    }
    const title = match[1].split("").filter(e => e.match(/[a-zA-Z]/)).join("");
    const key = title.toLowerCase().split(" ").join("-");
    const entryName = title.toLowerCase().split(" ").map((e, i) => {
        if (i === 0) {
            return e
        }
        return e.charAt(0).toUpperCase() + e.slice(1);
    }).join("");

    const fileData = `import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";

export const ${entryName} = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .numbers()
            .run();
        let result: any = 0
        for (let i = 0; i < ns.length; i++) { 
            const x = ns[i];
        }
        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .numbers()
            .run();
        let result: any = 0
        for (let i = 0; i < ns.length; i++) { 
            const x = ns[i];
        }
        await resultOutputCallback(result);
    },
    {
        key: "${key}",
        title: "${title}",
        supportsQuickRunning: true,
        embeddedData: true,
        date: ${day}
    }
);`


    const dirPath = `./src/entries/single-entries/${year}/${key}`;

    if (fs.existsSync(dirPath)) {
        throw new Error("Entry " + key + " already exists in " + year);
    }

    fs.mkdirSync(dirPath, {
        recursive: true
    });

    const encoding = "utf8";

    fs.writeFileSync(`${dirPath}/index.ts`, fileData, { encoding });

    await download(day, year);

    const indexPath = `./src/entries/single-entries/${year}/index.ts`;

    if (!fs.existsSync(indexPath)) {
        console.log("Creating index.ts file for entries...");
        const indexData = `export const entries = [
];`
        fs.writeFileSync(indexPath, indexData, { encoding });
    } else {
        console.log("Entries index.ts file already exists");
    }

    const indexData = fs.readFileSync(indexPath, { encoding })
    const lines = indexData.split("\n").map(e => e.trimEnd());
    const indexOfLastImport = lines.map((l, i) => ({l: l.trim(), i})).filter(e => e.l.startsWith("import {")).pop()?.i;
    const insertImportAt = indexOfLastImport !== undefined && indexOfLastImport !== null ? indexOfLastImport + 1 : 0;
    lines.splice(insertImportAt, 0, `import { ${entryName} } from "./${key}";`);

    const indexOfEndArray = lines.map((l, i) => ({l: l.trim(), i})).filter(e => e.l.startsWith("];")).pop()?.i;
    if (!indexOfEndArray) {
        throw new Error("Invalid index file");
    }
    lines.splice(indexOfEndArray, 0, `    ${entryName},`)

    fs.writeFileSync(indexPath, lines.join("\n"), {encoding});

    console.log("Entries updated");

    // const data = await result.text();


};
main().catch((e) => console.error(e));
