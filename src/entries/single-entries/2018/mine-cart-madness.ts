import { Drawable, entryForFile, ScreenPrinter } from "../../entry";
import { FixedSizeMatrix } from "../../../support/matrix";
import {
    CCoordinate,
    Coordinate,
    Rotation,
    rotate,
    directions,
    manhattanDistance,
    scalarCoordinates,
    sumCoordinate,
    serialization
} from "../../../support/geometry";

type InputCell = " " | CartDirections | "|" | "-" | "/" | "\\" | "+";
type CartDirections = "^" | ">" | "v" | "<";

function parseLines(lines: string[]): Field {
    const inputMatrix = new FixedSizeMatrix<InputCell>({ x: lines[0].length, y: lines.length });
    inputMatrix.setFlatData(lines
        .filter((l) => l.trim().length > 0)
        .map((l) => l.split("").map((c) => c as InputCell)).flat()
    );
    return new Field(inputMatrix);

}

function isInputCart(input: InputCell): input is CartDirections {
    return ["^", ">", "v", "<"].indexOf(input) >= 0;
}

function inputToDirection(input: CartDirections): CCoordinate {
    switch (input) {
        case "<":
            return directions.left;
        case ">":
            return directions.right;
        case "^":
            return directions.up;
        case "v":
            return directions.down;
    }
}

class Cart {
    private intersectionsPassed: number = 0;

    private crashed = false;

    private readonly intersectionRotations: Rotation[] = [
        "Counterclockwise", "None", "Clockwise"
    ];

    constructor(public position: Coordinate, public direction: CCoordinate) {

    }

    public toString() {
        if (this.direction.y > 0) {
            return "v";
        } else if (this.direction.y < 0) {
            return "^";
        } else if (this.direction.x > 0) {
            return ">";
        } else {
            return "<";
        }
    }

    public handleInput(inputGetter: (c: Coordinate) => InputCell): void {
        if (this.crashed) {
            return;
        }
        this.position = this.direction.sum(this.position);
        const input = inputGetter(this.position);
        switch (input) {
            case "-":
            case "|":
                break;
            case "/":
            case "\\":
                this.handleTurn(input);
                break;
            case "+":
                this.handleIntersection();
                break;

        }
    }

    public crash() {
        this.crashed = true;
    }

    public isCrashed() {
        return this.crashed;
    }

    private handleIntersection() {
        const rotation = this.intersectionRotations[(this.intersectionsPassed++) % this.intersectionRotations.length];
        this.rotate(rotation);
    }
    private rotate(rotation: Rotation) {
        this.direction = rotate(this.direction, rotation);
    }

    private handleTurn(turn: "\\" | "/") {
        const rotation = this.getRotation(turn);
        this.rotate(rotation);
    }

    private getRotation(turn: string) {
        if (turn === "/") {
            if (this.direction.x === 0) {
                return "Clockwise";
            } else {
                return "Counterclockwise";
            }
        } else {
            if (this.direction.y === 0) {
                return "Clockwise";
            } else {
                return "Counterclockwise";
            }
        }
    }
}

interface Crash {
    carts: Cart[];
    position: Coordinate;
}

class Field {

    public get crashes() {
        return [...this.crashList];
    }
    public get ticks() {
        return this.internalTicks;
    }
    private readonly carts: Cart[] = [];
    private internalTicks = 0;

    private readonly crashList: Crash[] = [];
    constructor(private matrix: FixedSizeMatrix<InputCell>) {
        matrix.onEveryCell((coordinate, cell) => {
            if (cell && isInputCart(cell)) {
                const cartDirection = inputToDirection(cell);
                this.carts.push(new Cart(coordinate, cartDirection));
                this.hideCart(coordinate);
            }
        });
    }

    public get remainingCarts() {
        return this.carts.filter((c) => !c.isCrashed());
    }

    public hasCrashes() {
        return this.crashList.length > 0;
    }

    public tick() {
        this.moveCarts();
        this.incrementTicks();
    }

    public toString(skipCarts: boolean = false) {
        return this.matrix.toString((e, coordinate) => {
            if (!e) {
                return " ";
            }
            if (!coordinate || skipCarts) {
                return e;
            }
            const matchingCarts = this.carts.filter((cart) => manhattanDistance(cart.position, coordinate) === 0);
            if (matchingCarts.length === 0) {
                return e;
            } else if (matchingCarts.length === 1) {
                return matchingCarts[0].toString();
            } else {
                return "X";
            }
        });
    }

    public toDrawable(size: Coordinate, skipCarts: boolean = false): Drawable[] {
        const squareSize = Math.floor(Math.min(size.x / this.matrix.size.x, size.y / this.matrix.size.y));
        const padding = 3;

        const result: Drawable[] = [];
        this.matrix.onEveryCellSync((c, e) => {
            if (!e) {
                return;
            }
            const baseCoordinates = scalarCoordinates(c, squareSize);
            const matchingCarts = this.carts.filter((cart) => manhattanDistance(cart.position, c) === 0);
            if (matchingCarts.length === 1) {
                e = matchingCarts[0].toString();
            } else if (matchingCarts.length > 1) {
                result.push({
                    id: serialization.serialize(c),
                    c,
                    color: "red",
                    type: "rectangle",
                    size: {x: squareSize, y: squareSize},
                });
                return;
            }
            switch (e) {
                case " ":
                    return;
                case "+":
                    result.push({
                        type: "rectangle",
                        c: sumCoordinate(baseCoordinates, {x: 0, y: padding}),
                        color: "white",
                        size: {x: squareSize, y: squareSize - padding * 2},
                        id: serialization.serialize(c) + "-"
                    });
                    result.push({
                        type: "rectangle",
                        c: sumCoordinate(baseCoordinates, {x: padding, y: 0}),
                        color: "white",
                        size: {x: squareSize - padding * 2, y: squareSize},
                        id: serialization.serialize(c) + "|"
                    });
                    break;
                case "|":
                    result.push({
                        type: "rectangle",
                        c: sumCoordinate(baseCoordinates, {x: padding, y: 0}),
                        color: "white",
                        size: {x: squareSize - padding * 2, y: squareSize},
                        id: serialization.serialize(c) + "|"
                    });
                    break;
                case "-":
                    result.push({
                        type: "rectangle",
                        c: sumCoordinate(baseCoordinates, {x: 0, y: padding}),
                        color: "white",
                        size: {x: squareSize, y: squareSize - padding * 2},
                        id: serialization.serialize(c) + "-"
                    });
                    break;
                case "/":
                    result.push({
                        type: "points",
                        id: serialization.serialize(c),
                        color: "white",
                        points: [
                            { x: baseCoordinates.x, y: baseCoordinates.y + squareSize - padding},
                            { x: baseCoordinates.x + squareSize - padding, y: baseCoordinates.y},
                            { x: baseCoordinates.x + squareSize, y: baseCoordinates.y + padding},
                            { x: baseCoordinates.x + padding, y: baseCoordinates.y + squareSize}
                        ]
                    });
                    break;
                case "\\":
                    result.push({
                        type: "points",
                        id: serialization.serialize(c),
                        color: "white",
                        points: [
                            { x: baseCoordinates.x, y: baseCoordinates.y + padding},
                            { x: baseCoordinates.x +  padding, y: baseCoordinates.y},
                            { x: baseCoordinates.x + squareSize, y: baseCoordinates.y + squareSize - padding},
                            { x: baseCoordinates.x + squareSize - padding, y: baseCoordinates.y + squareSize}
                        ]
                    });
                    break;
                case ">":
                    result.push({
                        type: "points",
                        id: serialization.serialize(c),
                        color: "pink",
                        points: [
                            baseCoordinates,
                            {x: baseCoordinates.x + squareSize, y: baseCoordinates.y + squareSize / 2},
                            {x: baseCoordinates.x, y: baseCoordinates.y + squareSize}
                        ]
                    });
                    break;
                case "<":
                    result.push({
                        type: "points",
                        id: serialization.serialize(c),
                        color: "pink",
                        points: [
                            {x: baseCoordinates.x + squareSize, y: baseCoordinates.y},
                            {x: baseCoordinates.x, y: baseCoordinates.y + squareSize / 2},
                            {x: baseCoordinates.x + squareSize, y: baseCoordinates.y + squareSize}
                        ]
                    });
                    break;
                case "^":
                    result.push({
                        type: "points",
                        id: serialization.serialize(c),
                        color: "pink",
                        points: [
                            {x: baseCoordinates.x + squareSize / 2, y: baseCoordinates.y},
                            {x: baseCoordinates.x, y: baseCoordinates.y + squareSize},
                            {x: baseCoordinates.x + squareSize, y: baseCoordinates.y + squareSize},
                        ]
                    });
                    break;
                case "v":
                    result.push({
                        type: "points",
                        id: serialization.serialize(c),
                        color: "pink",
                        points: [
                            {x: baseCoordinates.x + squareSize / 2, y: baseCoordinates.y + squareSize},
                            {x: baseCoordinates.x, y: baseCoordinates.y},
                            {x: baseCoordinates.x + squareSize, y: baseCoordinates.y},
                        ]
                    });
                    break;
            }
        });
        return result;
    }

    private isVertical(cell: InputCell | undefined) {
        if (!cell) {
            return false;
        } else {
            return cell === "|" || cell === "\\" || cell === "/" || cell === "+" || isInputCart(cell);
        }
    }

    private isHorizontal(cell: InputCell | undefined) {
        if (!cell) {
            return false;
        } else {
            return cell === "-" || cell === "\\" || cell === "/" || cell === "+" || isInputCart(cell);
        }
    }
    private hideCart(coordinate: Coordinate) {
        const up = this.matrix.get(directions.up.sum(coordinate));
        const down = this.matrix.get(directions.down.sum(coordinate));
        const left = this.matrix.get(directions.left.sum(coordinate));
        const right = this.matrix.get(directions.right.sum(coordinate));
        if (this.isVertical(up) && this.isVertical(down)) {
            if (this.isHorizontal(left) && this.isHorizontal(right)) {
                this.matrix.set(coordinate, "+");
            } else {
                this.matrix.set(coordinate, "|");
            }
        } else if (this.isHorizontal(left) && this.isHorizontal(right)) {
            this.matrix.set(coordinate, "-");
        } else {
            throw new Error("Don't know what to put here :( " + JSON.stringify(coordinate));
        }
    }
    private incrementTicks() {
        this.internalTicks++;
    }

    private getOrderedCarts(): Cart[] {
        return this.carts.filter((e) => !e.isCrashed()).sort((a, b) => {
            if (a.position.y === b.position.y) {
                return a.position.x - b.position.x;
            } else {
                return a.position.y - b.position.y;
            }
        });
    }
    private moveCarts() {
        const cartList = this.getOrderedCarts();
        for (const cart of cartList) {
            cart.handleInput((coordinate) => this.matrix.get(coordinate)!);
            this.checkCollision(cart.position, cartList);
        }
    }
    private checkCollision(position: Coordinate, candidates: Cart[]) {
        const colliding = candidates.filter((c) => manhattanDistance(c.position, position) === 0);
        if (colliding.length === 0) {
            throw new Error("There should at least be one cart here");
        } else if (colliding.length > 1) {
            colliding.forEach((cart) => cart.crash());
            this.crashList.push({
                carts: colliding,
                position
            });
        }
    }
}

export const mineCartMadness = entryForFile(
    async ({ lines, outputCallback, isCancelled, pause, screen }) => {
        const field = parseLines(lines);
        let printer: ScreenPrinter | null = null;
        if (screen) {
            printer = await screen.requireScreen({x: 1600, y: 1600});
            await outputCallback("Running...");
        }
        if (printer) {
            printer.replace(field.toDrawable({x: 1600, y: 1600}, false));
        } else {
            await outputCallback(field.toString(true), true);
        }
        await pause();
        while (!isCancelled || !isCancelled()) {
            if (printer) {
                printer.replace(field.toDrawable({x: 1600, y: 1600}));
            } else {
                await outputCallback([
                    " ",
                    field.toString(false)
                ], true);
            }
            field.tick();
            if (field.hasCrashes()) {
                break;
            }
            await pause();
        }
        if (printer) {
            printer.replace(field.toDrawable({x: 1600, y: 1600}));
            await outputCallback("Crash: " + JSON.stringify(field.crashes[0].position));
        } else {
            await outputCallback([
                "Crash: " + JSON.stringify(field.crashes[0].position),
                field.toString(false)
            ], true);
        }
    },
    async ({ lines, outputCallback, isCancelled, pause }) => {
        const field = parseLines(lines);
        await outputCallback(field.toString(true), true);
        await pause();
        while (!isCancelled || !isCancelled()) {
            await outputCallback([
                "Remaining carts: " + field.remainingCarts.length,
                field.toString(false)
            ], true);
            field.tick();
            if (field.remainingCarts.length === 1) {
                break;
            }
            await pause();
        }
        await outputCallback([
            "Last cart: " + JSON.stringify(field.remainingCarts[0].position),
            field.toString(false)
        ], true);
    },
    {
        key: "mine-cart-madness",
        title: "Mine Cart Madness",
        stars: 2,
        customComponent: "pause-and-run",
        embeddedData: "mine-cart-madness/input"
    }
);
