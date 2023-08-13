import { Coordinate, CCoordinate, manhattanDistance } from "./geometry";
import wu, { zip } from "wu";
import { voidIsPromise, isPromise } from "./async";

export class FixedSizeMatrix<T> {

    public get delta() {
        return this._delta;
    }

    public static fromPlain<T>(data: T[][]): FixedSizeMatrix<T> {
        const matrix = new FixedSizeMatrix<T>({x: data[0].length, y: data.length});
        for (let x = 0; x < matrix.size.x; x++) {
            for (let y = 0; y < matrix.size.y; y++) {
                matrix.set({x, y}, data[y][x]);
            }
        }
        return matrix;
    }

    public static fromSingleDigitInput(data: string[]): FixedSizeMatrix<number> {
        return this.fromPlain(data.map((d) => d.split("").map((e) => parseInt(e, 10))));
    }
    public data: Array<T | undefined>;

    private _delta: CCoordinate = new CCoordinate(0, 0);
    constructor(public size: Coordinate) {
        this.data = new Array<(T | undefined)>(size.x * size.y);
    }

    public getFlatData(): T[] {
        return this.data.filter((e) => e) as T[];
    }

    public map<U>(mapper: (e: T | undefined, c: Coordinate) => U): FixedSizeMatrix<U> {
        const result = new FixedSizeMatrix<U>(this.size);
        for (let i = 0; i < this.data.length; i++) {
            const c = this.coordinateCalculator(i);
            result.data[i] = mapper(this.data[i], c);
        }
        return result;
    }

    public setDelta(delta: CCoordinate) {
        this._delta = delta;
    }

    public fill(fillValue: T | undefined) {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = fillValue;
        }
    }

    public fillFactory(fillValueFactory: (c: Coordinate) => T) {
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = fillValueFactory(this.coordinateCalculator(i));
        }
    }

    public setFlatData(a: T[]) {
        if (a.length !== this.data.length) {
            throw new Error("Wrong size!");
        }
        this.data = [...a];
    }
    public get(c: Coordinate): T | undefined {
        c = this._delta.opposite.sum(c);
        const index = this.indexCalculator(c);
        if (index !== null) {
            return this.data[index];
        }
    }

    public getUnsafe(c: Coordinate): T {
        c = this._delta.opposite.sum(c);
        const index = this.indexCalculator(c);
        if (index === null) {
            throw new Error("Invalid index in matrix");
        }
        const e = this.data[index];
        if (e === undefined) {
            throw new Error("Invalid value in matrix");

        }
        return e;
    }

    public reduce<TAcc>(
        callback: ((accumulator: TAcc, next: {coordinate: Coordinate, cell: T | undefined}) => TAcc),
        startAccumulator: TAcc
    ): TAcc {
        for (let y = 0; y < this.size.y; y++) {
            for (let x = 0; x < this.size.x; x++) {
                startAccumulator = callback(startAccumulator, {coordinate: {x, y}, cell: this.get({x, y})});
            }
        }
        return startAccumulator;
    }

    public findOne(predicate: (cell: T) => boolean): Coordinate | null {
        return this.findOneWithCoordinate((cell, coordinate) => predicate(cell));
    }

    public findOneWithCoordinate(predicate: (cell: T, coordinate: Coordinate) => boolean): Coordinate | null {
        for (let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                if (predicate(this.get({ x, y })!, {x, y})) {
                    return this._delta.sum({ x, y });
                }
            }
        }
        return null;
    }

    public async onEveryCell<U>(
        callback: (c: Coordinate, e: T | undefined) =>
            Promise<U | undefined> | void
    ): Promise<U | undefined> {
        for (let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                const res = callback(this._delta.sum({ x, y }), this.get(this._delta.sum({ x, y })));
                if (isPromise(res)) {
                    const awaited = await res;
                    if (awaited !== undefined) {
                        return awaited;
                    }
                }
            }
        }
    }

    public onEveryCellSyncUnsafe<U>(callback: (c: Coordinate, e: T) => void | U): void | U {
        for (let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                const c = this._delta.sum({x, y});
                const e = this.getUnsafe(c);
                const res = callback(c, e);
                if (res !== undefined) {
                    return res;
                }
            }
        }
    }

    public filter(predicate: (c: Coordinate, e: T | undefined) => boolean): Coordinate[] {
        const result = [];
        for (let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                const lc = this._delta.sum({x, y});
                const e = this.get(lc);
                const res = predicate(lc, e);
                if (res) {
                    result.push({x,y});
                }
            }
        }
        return result;
    }

    public onEveryCellSync<U>(callback: (c: Coordinate, e: T | undefined) => void | U): void | U {
        for (let x = 0; x < this.size.x; x++) {
            for (let y = 0; y < this.size.y; y++) {
                const res = callback(this._delta.sum({ x, y }), this.get(this._delta.sum({ x, y })));
                if (res !== undefined) {
                    return res;
                }
            }
        }
    }

    public set(c: Coordinate, value: T | undefined) {
        c = this._delta.opposite.sum(c);
        const index = this.indexCalculator(c);
        if (index !== null) {
            this.data[index] = value;
        }
    }

    public copy(): FixedSizeMatrix<T> {
        const newMatrix = new FixedSizeMatrix<T>(this.size);
        newMatrix.data = this.data.slice();
        return newMatrix;
    }

    public *overRows() {
        for (let rowIndex = 0; rowIndex < this.size.y; rowIndex++) {
            const startIndex = this.indexCalculator({ x: 0, y: rowIndex });
            const endIndex = this.indexCalculator({ x: this.size.x - 1, y: rowIndex });
            if (startIndex !== null && endIndex !== null) {
                yield this.data.slice(
                    startIndex,
                    endIndex + 1
                );
            }
        }
    }

    public toString(stringifier: (cell: T | undefined, coordinate?: Coordinate) => string): string {
        let rowIndex = -1;
        const serialized = wu(this.overRows()).map((row) => {
            rowIndex++;
            const res = [];
            for (let i = 0; i < row.length; i++) {
                res.push(stringifier(row[i], this._delta.sum({x: i, y: rowIndex})));
            }
            return res.join("");
        }).toArray().join("\n");
        return serialized;
    }

    public simpleSerialize(): string {
        return this.data.join("");
    }

    public isSameAs(
        other: FixedSizeMatrix<T>,
        customComparer?: (a: (T | undefined), b: (T | undefined)
    ) => boolean): boolean {
        if (manhattanDistance(this.size, other.size) !== 0) {
            return false;
        }
        const thisFlatData = this.data;
        const otherFlatData = other.data;
        for (const tuple of zip(thisFlatData, otherFlatData)) {
            if (customComparer) {
                return customComparer(tuple[0], tuple[1]);
            }
            if (tuple[0] !== tuple[1]) {
                return false;
            }
        }
        return true;
    }

    private indexCalculator(c: Coordinate): number | null {
        if (c.y < 0 || c.x < 0 || c.x >= this.size.x || c.y >= this.size.y) {
            return null;
        }
        return c.y * this.size.x + c.x;
    }

    private coordinateCalculator(i: number): Coordinate {
        if (i < 0 || i >= this.data.length) {
            throw new Error("Invalid index");
        }
        return {x: i % this.size.x, y: Math.floor(i / this.size.x)};
    }
}
