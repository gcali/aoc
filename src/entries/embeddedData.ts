import { entryList } from "./entryList";

const parse = (data: string): string[] => data.trim().split("\n");

export const disabledYear: string | undefined = "2021";


export const embeddedLines = Object.keys(entryList).flatMap((year) => entryList[year].map((entry) => {
    return {
        year,
        entry
    };
})).filter((e) => e.entry.entry.metadata && e.entry.entry.metadata.embeddedData)
.reduce((acc, next) => {
    const metadata = next.entry.entry.metadata!;
    acc[metadata.key] = async () => {
        const key = metadata.embeddedData === true ? metadata.key : metadata.embeddedData!;
        const data = (await import(
            /* webpackChunkName: "[request]" */
            `../../data/${next.year}/${key}.txt`
        )).default as string;
        return parse(data);
    };
    return acc;
}, {} as { [key: string]: () => Promise<string[]>});
