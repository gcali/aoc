import { FixedSizeMatrix } from "./matrix";
import { Coordinate, getBoundaries, CCoordinate, Bounds } from "./geometry";

export class UnknownSizeField<T> {

    private cells: { [key: string]: T | undefined } = {};

    public set(coordinate: Coordinate, element: T): void {
        this.cells[this.serializeCoordinate(coordinate)] = element;
    }

    public unset(coordinate: Coordinate): void {
        delete this.cells[this.serializeCoordinate(coordinate)];
    }

    public clone(): UnknownSizeField<T> {
        const cloned = new UnknownSizeField<T>();
        cloned.cells = {...this.cells};
        return cloned;
    }

    public *getPoints(): Iterable<{e: T, c: Coordinate}> {
        for (const k in this.cells) {
            if (k in this.cells) {
                const c = this.deserializeCoordinate(k);
                const cell = this.cells[k];
                if (cell) {
                    yield {
                        e: cell,
                        c
                    };
                }
            }
        }
    }

    public get(coordinate: Coordinate): T | null {
        const element = this.cells[this.serializeCoordinate(coordinate)];
        if (element === undefined) {
            return null;
        }
        return element;
    }

    public getBoundaries(): Bounds {
        const bounds = getBoundaries(Object.keys(this.cells).map(this.deserializeCoordinate));
        return bounds;
    }

    public toMatrix(): FixedSizeMatrix<T> {
        // const bounds = getBoundaries(Object.keys(this.cells).map(this.deserializeCoordinate));
        const bounds = this.getBoundaries();
        const matrix = new FixedSizeMatrix<T>(bounds.size);
        matrix.setDelta(CCoordinate.fromCoordinate(bounds.topLeft));
        Object.keys(this.cells).forEach((serialized) => {
            const coordinate = this.deserializeCoordinate(serialized);
            const cell = this.cells[serialized];
            if (cell !== undefined) {
                matrix.set(coordinate, cell);
            }
        });
        return matrix;
    }

    public findOne(callback: (e: T, c: Coordinate) => boolean): {e: T, c: Coordinate} | null {
        for (const [key, cell] of Object.entries(this.cells)) {
            const coordinate = this.deserializeCoordinate(key);
            if (cell !== undefined && callback(cell, coordinate)) {
                return {e: cell, c: coordinate};
            }
        }
        return null;
    }

    private serializeCoordinate(c: Coordinate): string {
        return JSON.stringify({ x: c.x, y: c.y });
    }

    private deserializeCoordinate(serialized: string): Coordinate {
        return JSON.parse(serialized) as Coordinate;
    }
}
