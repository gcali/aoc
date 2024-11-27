import { SerializableDictionary } from "./data-structure";
import { ISerializer } from "./serialization";

export const memoize = <T, U>(serialization: ISerializer<T>, f: (row: T) => U): (row: T) => U => {
    const memoization = new SerializableDictionary<T, U>(serialization);
    return (row: T) => {
        if (memoization.has(row)) {
            return memoization.get(row)!;
        }
        const res = f(row);
        memoization.set(row, res);
        return res;
    }
}

type CycleOptimizationResult<TRes> = {
    result: TRes;
    iteration: number;
    cycles: number;
    remainder: number;
}

export const optimizeCycles = <TArg, TRes>(
    baseArg: TArg,
    howMany: number,
    serializer: (arg: TArg) => string,
    f: (arg: TArg) => [TArg, TRes]
): CycleOptimizationResult<TRes> => {
    const found = new Map<string, number>();
    const indexResults = new Map<number, [TArg, TRes]>();
    let arg = baseArg;
    let lastRes: TRes | undefined = undefined;
    for (let i = 0; i < howMany; i++) {
        const serializedArg = serializer(arg);
        if (found.has(serializedArg)) {
            // console.log("Found a break");
            const cycleI = found.get(serializedArg)!;
            const cycleLength = i - cycleI;
            const cycleBase = cycleI;
            const expectedPosition = (howMany - cycleBase -1 + cycleLength) % cycleLength + cycleBase;
            // console.log({cycleI, i, cycleLength, cycleBase, expectedPosition, delta: howMany-cycleBase, simpleDelta: (howMany-cycleBase) % cycleLength});
            const [cycleArg, cycleRes] = indexResults.get(expectedPosition)!;
            return {result: cycleRes, iteration: i, cycles: Math.floor(howMany/i), remainder: howMany % i}
        }
        const [newArg, res] = f(arg);
        found.set(serializedArg, i);
        indexResults.set(i, [arg, res]);
        lastRes = res;
        arg = newArg;
    }
    if (lastRes === undefined) {
        throw new Error("Something went wrong");
    }
    return {result: lastRes, iteration: howMany, cycles: 1, remainder: 0};
}
