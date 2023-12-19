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

