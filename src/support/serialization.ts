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
