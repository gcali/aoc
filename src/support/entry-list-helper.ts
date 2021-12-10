import { entryList } from "../entries/entryList";

export const getLastYear = (): string => {
    const sorted = Object.keys(entryList).sort();
    return sorted[sorted.length - 1];
};

export const getLastIndex = (year: string, argIndex: number | null): number => {
    const index: number = (argIndex === null ?  entryList[year].length : argIndex) - 1;
    return index;
};

export const getLastEntry = () => {
    const year = getLastYear();
    return entryList[year][getLastIndex(year, null)].entry;
};
