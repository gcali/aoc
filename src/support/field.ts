import { FixedSizeMatrix } from "./matrix";
import { Coordinate, getBoundaries, CCoordinate } from "./geometry";

export class UnknownSizeField<T> {

    private readonly cells: { [key: string]: T | undefined } = {};

    public set(coordinate: Coordinate, element: T): void {
        this.cells[this.serializeCoordinate(coordinate)] = element;
    }

    public get(coordinate: Coordinate): T | null {
        const element = this.cells[this.serializeCoordinate(coordinate)];
        if (element === undefined) {
            return null;
        }
        return element;
    }
    public toMatrix(): FixedSizeMatrix<T> {
        const bounds = getBoundaries(Object.keys(this.cells).map(this.deserializeCoordinate));
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

    private serializeCoordinate(c: Coordinate): string {
        return JSON.stringify({ x: c.x, y: c.y });
    }

    private deserializeCoordinate(serialized: string): Coordinate {
        return JSON.parse(serialized) as Coordinate;
    }
}
