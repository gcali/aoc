export const baseState = {
    dates: {
        year: 2023
    }
};

export function updateYear(year: number | string) {
    if (typeof (year) === "string") {
        year = parseInt(year, 10);
    }
    baseState.dates.year = year;
}
