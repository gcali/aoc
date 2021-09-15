import { entryForFile, OutputCallback } from "../../entry";
import { Coordinate, sumCoordinate, Bounds, isInBounds, ascendingCompare } from "../../../support/geometry";
import { ascending } from "../../../support/best";
import { Queue } from "../../../support/data-structure";
import { __values } from "tslib";

class EditableField {
    public cells: EditableFieldType[][];
    constructor(baseField: Field, units: Units) {
        this.cells = baseField.cells.map((line, y) => line.split("").map((cell, x) => {
            return cell as FieldType;
        }));

        units.units.forEach((unit) => {
            if (unit.isAlive) {
                this.cells[unit.coordinates.y][unit.coordinates.x] = unit;
            }
        });
    }

    public get(c: Coordinate): EditableFieldType {
        return this.cells[c.y][c.x];
    }

    public set(c: Coordinate, v: EditableFieldType) {
        this.cells[c.y][c.x] = v;
    }

    public toString(): string {
        return this.cells.map((line) => line.map((cell) => {
            if (isFieldType(cell)) {
                return cell;
            } else if (isUnit(cell)) {
                return cell.unitType;
            } else {
                return "" + cell;
            }
        }).join("")).join("\n");
    }
}

type EditableFieldType = Unit | FieldType | number;

function isUnit(e: EditableFieldType): e is Unit {
    return (e as Unit).coordinates !== undefined;
}

const adjacentOffsets: Coordinate[] = [
    { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
];

function adjacentCoordinates(c: Coordinate, bounds: Bounds): Coordinate[] {
    return adjacentOffsets.map((offset) => sumCoordinate(c, offset)).filter((result) => isInBounds(result, bounds));
}

function isFieldType(e: EditableFieldType): e is FieldType {
    return !isUnit(e) && (e as FieldType).substr !== undefined;
}

function isNumber(e: EditableFieldType): e is number {
    return !isUnit(e) && !isFieldType(e);
}

class Field {
    public cells: string[];
    public size: { width: number; height: number; };

    constructor(inputLines: string[]) {
        this.size = {
            width: inputLines[0].length,
            height: inputLines.length
        };
        this.cells = inputLines.map((line) => line.replace(/[GE]/g, "."));
    }

    public toString() {
        return this.cells.join("\n");
    }
}

type FieldType = "#" | ".";
type UnitType = "G" | "E";

type WorldType = FieldType | UnitType;

function defaultPower(t: UnitType): number {
    return 3;
}

class Units {

    public static fromLines(lines: string[], powerGenerator?: typeof defaultPower): Units {
        return new Units(
            lines.flatMap(
                (line, y) => line.split("").map(
                    (cell, x) => cell === "G" || cell === "E" ? { type: cell as UnitType, coordinate: { x, y } } : null
                ).filter((u) => u !== null)
            ).map((u) => new Unit(
                u!.coordinate,
                u!.type,
                powerGenerator ? powerGenerator(u!.type) : defaultPower(u!.type)
            ))
        );
    }
    constructor(public units: Unit[]) {
    }


    public sort(): Units {
        return new Units(this.units.filter((u) => u.isAlive).sort((a, b) => a.compare(b)));
    }
}

class Unit {
    // public attackPower = 3;
    public hitpoints = 200;
    constructor(public coordinates: Coordinate, public unitType: UnitType, public attackPower: number = 3) {
    }

    public get isAlive(): boolean { return this.hitpoints > 0; }

    public suffersAttack(value: number) {
        this.hitpoints -= value;
    }

    public compare(other: Unit) {
        if (other.coordinates.y === this.coordinates.y) {
            return ascending(this.coordinates.x, other.coordinates.x);
        } else {
            return ascending(this.coordinates.y, other.coordinates.y);
        }
    }
}

async function calculateScore(
    field: Field,
    units: Units,
    outputCallback: OutputCallback,
    pause: () => Promise<void>
): Promise<[number, number, number]> {
    const bounds = {
        topLeft: { x: 0, y: 0 },
        size: { x: field.size.width, y: field.size.height }
    };
    function attackInRange(unit: Unit, editableField: EditableField): boolean {
        const rangePositions = adjacentCoordinates(unit.coordinates, bounds);
        const enemiesInRange = rangePositions
            .map((c) => editableField.get(c))
            .filter((c) => isUnit(c) && c.unitType !== unit.unitType)
            .map((c) => c as Unit);
        if (enemiesInRange.length > 0) {
            const enemyToAttack = enemiesInRange.sort((a, b) => {
                if (a.hitpoints === b.hitpoints) {
                    return ascendingCompare(a.coordinates, b.coordinates);
                } else {
                    return ascending(a.hitpoints, b.hitpoints);
                }
            })[0];
            enemyToAttack.suffersAttack(unit.attackPower);
            return true;
        } else {
            return false;
        }
    }

    let i = -1;
    while (true) {
        i++;
        for (const unit of units.units) {
            await pause();
            if (!unit.isAlive) {
                continue;
            }
            const editableField = new EditableField(field, units);
            editableField.set(unit.coordinates, 0);
            if (attackInRange(unit, editableField)) {
                continue;
            } else {
                const positionsToVisit = new Queue<Coordinate>();
                positionsToVisit.add(unit.coordinates);
                let foundAt: number | null = null;
                const interestingPositions: Coordinate[] = [];
                while (!positionsToVisit.isEmpty) {
                    const currentPosition = positionsToVisit.get()!;
                    const currentValue = editableField.get(currentPosition);
                    if (!isNumber(currentValue)) {
                        throw Error("At current position there wasn't a value");
                    }
                    if (foundAt && currentValue > foundAt) {
                        break;
                    }
                    const inRangeCoordinates = adjacentCoordinates(currentPosition, bounds);
                    inRangeCoordinates.forEach((c) => {
                        const cell = editableField.get(c);
                        if (cell === ".") {
                            editableField.set(c, currentValue + 1);
                            positionsToVisit.add(c);
                        } else if (isUnit(cell) && cell.unitType !== unit.unitType) {
                            foundAt = currentValue;
                            interestingPositions.push(currentPosition);
                        } else {
                            return;
                        }
                    });
                }
                if (interestingPositions.length <= 0) {
                    continue;
                }
                const targetPosition = interestingPositions.sort((a, b) => ascendingCompare(a, b))[0];
                const interestingFirstSteps: Coordinate[] = [];
                if ((editableField.get(targetPosition) as number) === 1) {
                    interestingFirstSteps.push(targetPosition);
                } else {
                    const stepQueue = new Queue<Coordinate>();
                    stepQueue.add(targetPosition);
                    while (!stepQueue.isEmpty) {
                        const nextStep = stepQueue.get()!;
                        const nextStepValue = editableField.get(nextStep);
                        if (!isNumber(nextStepValue)) {
                            throw Error("Expected number!");
                        }
                        if (nextStepValue === 1) {
                            interestingFirstSteps.push(nextStep);
                        } else if (nextStepValue > 0) {
                            const inRange = adjacentCoordinates(nextStep, bounds);
                            inRange.forEach((c) => {
                                const v = editableField.get(c);
                                if (isNumber(v) && v === nextStepValue - 1) {
                                    stepQueue.add(c);
                                }
                            });
                        }
                    }
                }
                const moveTo = interestingFirstSteps.sort((a, b) => ascendingCompare(a, b))[0];
                unit.coordinates = moveTo;
                attackInRange(unit, new EditableField(field, units));
            }
        }
        units = units.sort();
        const newEditable = new EditableField(field, units);
        const outputLines = newEditable.toString().split("\n");
        units.units.forEach(
            (u) => outputLines[u.coordinates.y] = outputLines[u.coordinates.y].concat(
                " ",
                `${u.unitType}-${u.hitpoints}`
            )
        );
        await outputCallback(outputLines.join("\n"));
        if (
            units.units.filter((u) => u.unitType === "E").length === 0
            || units.units.filter((u) => u.unitType === "G").length === 0) {
            const gameScore = i * units.units.map((u) => u.hitpoints).reduce((acc, value) => acc + value, 0);
            return [i, gameScore, units.units.filter((u) => u.unitType === "E").length];
            // await outputCallback(`Combat done at round ${i} with value ${gameScore}!`);
            // break;
        }
    }
}

function wrapOutputToClean(outputCallback: OutputCallback, cleanEveryNOutput: number): OutputCallback {
    let currentCount = 0;
    return async (line: any, shouldClear?: boolean): Promise<void> => {
        currentCount++;
        let forceShouldClear = false;
        if (currentCount >= cleanEveryNOutput || shouldClear) {
            forceShouldClear = true;
        }
        await outputCallback(line, forceShouldClear);
    };
}

export const entry = entryForFile(
    async ({ lines, outputCallback, pause }) => {
        const field = new Field(lines);
        const units = Units.fromLines(lines).sort();

        const [round, gameScore] = await calculateScore(
            field,
            units,
            wrapOutputToClean(outputCallback, 1),
            pause
        );

        await outputCallback(`Combat done at round ${round} with value ${gameScore}!`);

    },
    async ({ lines, outputCallback, pause }) => {
        const field = new Field(lines);

        let attackPower = 11;
        while (true) {
            await outputCallback("Trying with " + attackPower);
            const units = Units.fromLines(lines, ((t) => t === "E" ? attackPower : 3)).sort();
            const startingElves = units.units.filter((u) => u.unitType === "E").length;
            const [round, gameScore, survivors] = await calculateScore(
                field,
                units,
                wrapOutputToClean(outputCallback, 1),
                pause
            );
            if (startingElves === survivors) {
                await outputCallback(
                    `First win at attack power ${attackPower} in ${round} rounds with score ${gameScore}`
                );
                break;
            } else {
                attackPower++;
            }
        }
    },
    { key: "beverage-bandits", title: "Beverage Bandits", stars: 2, embeddedData: "beverage-bandits/online-input" }
);
