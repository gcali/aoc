import { Coordinate, serialization } from "./geometry";

export type ISerializer<T> = {
    serialize(e: T): string;
    deserialize(s: string): T;
};

export const defaultSerializers = {
    coordinate2d: {
        serialize: serialization.serialize,
        deserialize: serialization.deserialize
    } as ISerializer<Coordinate>
};

export const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key: string, value: any) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};
