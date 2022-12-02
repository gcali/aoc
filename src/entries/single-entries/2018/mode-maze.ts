import { Coordinate, sumCoordinate, manhattanDistance, getSurrounding, getBoundaries, CCoordinate, isInBounds } from "../../../support/geometry";
import { FixedSizeMatrix } from "../../../support/matrix";
import wu from "wu";

import Graph from "node-dijkstra";
import { entryForFile } from "../../entry";

interface Input {
    target: Coordinate;
    depth: number;
}

const parseLines = (lines: string[]): Input => {
    const [x, y] = lines[1].split(" ")[1].split(",").map((e) => parseInt(e, 10));
    return {
        depth: parseInt(lines[0].split(" ")[1], 10),
        target: { x, y }
    };
};

export const buildMatrix = (input: Input, delta?: number | Coordinate): FixedSizeMatrix<number> => {
    if (!delta) {
        delta = { x: 1, y: 1 };
    } else {
        if ((delta as Coordinate).x === undefined) {
            const nDelta = delta as number;
            delta = { x: nDelta, y: nDelta };
        }
    }
    return new FixedSizeMatrix<number>(sumCoordinate(input.target, delta as Coordinate));
};

export const fillMatrix = (matrix: FixedSizeMatrix<number>, input: Input): void => {
    for (let x = 0; x < matrix.size.x; x++) {
        for (let y = 0; y < matrix.size.y; y++) {
            if (x === 0 && y === 0) {
                matrix.set({ x, y }, input.depth);
            } else if (manhattanDistance({ x, y }, input.target) === 0) {
                matrix.set(input.target, input.depth);
            } else if (x === 0) {
                matrix.set({ x, y }, erode(y * 48271, input));
            } else if (y === 0) {
                matrix.set({ x, y }, erode(x * 16807, input));
            } else {
                matrix.set({ x, y }, erode(matrix.get({ x: x - 1, y })! * matrix.get({ x, y: y - 1 })!, input));
            }
        }
    }
};

const erode = (n: number, input: Input): number => {
    return (n + input.depth) % 20183;
};

export type ErosionLevel = 0 | 1 | 2;

const createErosionMatrix = (matrix: FixedSizeMatrix<number>): FixedSizeMatrix<ErosionLevel> => {
    const newMatrix = new FixedSizeMatrix<ErosionLevel>(matrix.size);
    matrix.onEveryCell((coordinate, cell) => {
        if (cell !== undefined) {
            newMatrix.set(coordinate, (cell % 3) as ErosionLevel);
        }
    });
    return newMatrix;
};

export type Tool = "climb" | "light" | "none";

export interface Node { coordinate: Coordinate; tool: Tool; }

export const serializeNode = ({ coordinate, tool }: Node): string => `${coordinate.x},${coordinate.y},${tool}`;
export const deserializeNode = (serialized: string): Node => {
    const [x, y, tool] = serialized.split(",");
    if (tool !== "climb" && tool !== "light" && tool !== "none") {
        throw new Error("Invalid tool");
    }
    return {
        coordinate: {
            x: parseInt(x, 10),
            y: parseInt(y, 10)
        },
        tool
    };
};

const getValidTools = (erosionLevel: ErosionLevel): Tool[] => {
    switch (erosionLevel) {
        case 0:
            return ["climb", "light"];
        case 1:
            return ["climb", "none"];
        case 2:
            return ["light", "none"];
    }
};

const tools: Tool[] = ["climb", "light", "none"];

interface NodePaths { [key: string]: number; }

interface PathNode {
    serialized: string;
    node: Node;
    distance: number | null;
}

class CustomGraph {
    private readonly _nodeMap = new Map<string, NodePaths>();

    public addNode(node: Node, neighbours: Array<{ node: Node, weight: number }>) {
        this._nodeMap.set(
            serializeNode(node),
            neighbours.reduce((acc: NodePaths, next) => {
                acc[serializeNode(next.node)] = next.weight;
                return acc;
            }, {})
        );
    }

    public path(startNode: Node, endNode: Node, options?: { cost?: boolean }):
        number | null {
        const toVisit: PathNode[] = wu(this._nodeMap.keys()).map((key) => ({
            serialized: key,
            node: deserializeNode(key),
            distance: null
        })).toArray();
        const endSerialized = serializeNode(endNode);
        wu(toVisit)
            .filter((e) =>
                e.node.tool === startNode.tool &&
                manhattanDistance(e.node.coordinate, startNode.coordinate) === 0
            ).forEach((e) => e.distance = 0);
        while (toVisit.length > 0) {
            const candidateDistance = wu(toVisit)
                .filter((n) => n.distance !== null)
                .map((d) => d.distance)
                .reduce((acc, next) => Math.min(acc!, next!))
                ;
            if (candidateDistance === null) {
                break;
            }
            const candidateNode =
                wu(toVisit.map((e, i) => ({ e, i })))
                    .find((e) => e.e.distance === candidateDistance);
            if (candidateNode === undefined || candidateNode.e.distance === null) {
                throw new Error("Could not find node :(");
            }
            if (endSerialized === candidateNode.e.serialized) {
                return candidateNode.e.distance;
            }
            const neighbours = this._nodeMap.get(candidateNode.e.serialized);
            if (neighbours) {
                Object.keys(neighbours).forEach((key) => {
                    const serializedNode = key;
                    const toVisitNode = wu(toVisit).find((node) => node.serialized === serializedNode);
                    if (toVisitNode !== undefined) {
                        toVisitNode.distance = candidateNode.e.distance! + neighbours[key];
                        if (toVisitNode.serialized === endSerialized) {
                            return toVisitNode.distance;
                        }
                    }
                });
            }
            toVisit.splice(candidateNode.i, 1);
        }
        return null;
    }

}

export const matrixSerializer = (e: 0 | 1 | 2 | undefined): "." | "=" | "|" | "X" => {
    switch (e) {
        case 0:
            return ".";
        case 1:
            return "=";
        case 2:
            return "|";
        default:
            return "X";
    }
};
export const modeMaze = entryForFile(
    async ({ lines, outputCallback }) => {
        const input = parseLines(lines);
        const erosionMatrix = createErosionMatrixFromInput(input);
        await outputCallback(erosionMatrix.toString(matrixSerializer));
        let sum = 0;
        erosionMatrix.onEveryCell((coordinate, cell) => {
            sum = sum + (cell || 0);
        });
        await outputCallback(sum);
    },
    async ({ lines, outputCallback }) => {
        const input = parseLines(lines);
        const erosionMatrix = createErosionMatrixFromInput(input);

        const resultPath = calculatePath(erosionMatrix, input.target);

        for (const step of resultPath.path) {
            await outputCallback(step);
        }
        await outputCallback(resultPath.cost);

        new Map<string, number>().keys();
    },
    { key: "mode-maze", title: "Mode Maze", stars: 2, }
);

export function createErosionMatrixFromInput(input: Input, delta: number | Coordinate = 100) {
    const matrix = buildMatrix(input, delta);
    fillMatrix(matrix, input);
    const erosionMatrix = createErosionMatrix(matrix);
    return erosionMatrix;
}

export function calculatePath(
    erosionMatrix: FixedSizeMatrix<ErosionLevel>,
    target: Coordinate
): { path: string[], cost: number } {
    const weightedGraph = new Graph();
    erosionMatrix.onEveryCell((coordinate, erosionLevel) => {
        if (erosionLevel !== undefined) {
            const validTools = getValidTools(erosionLevel);
            validTools.forEach((tool) => {
                const neighbours = getSurrounding(coordinate);
                const neighbourNodes: Array<{
                    node: Node;
                    weight: number;
                }> = neighbours.map((nCoord) => {
                    const nErosion = erosionMatrix.get(nCoord);
                    if (nErosion !== undefined) {
                        const nTools = getValidTools(nErosion);
                        if (nTools.indexOf(tool) >= 0) {
                            return {
                                node: {
                                    coordinate: nCoord,
                                    tool
                                },
                                weight: 1
                            };
                        }
                    }
                    return null;
                }).filter((e) => e !== null)
                    .map((e) => e!);
                validTools.forEach((otherTool) => {
                    if (otherTool !== tool) {
                        neighbourNodes.push({ node: { coordinate, tool: otherTool }, weight: 7 });
                    }
                });
                weightedGraph.addNode(serializeNode({ coordinate, tool }), neighbourNodes.reduce((acc: {
                    [key: string]: number;
                },                                                                                next) => {
                    acc[serializeNode(next.node)] = next.weight;
                    return acc;
                }, {}));
            });
        }
    });
    const resultPath =
        weightedGraph.path(
            serializeNode({ coordinate: { x: 0, y: 0 }, tool: "light" }),
            serializeNode({ coordinate: target, tool: "light" }),
            { cost: true }
        );
    return resultPath as { path: string[], cost: number };
}
