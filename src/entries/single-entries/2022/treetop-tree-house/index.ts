import { directions, isInBounds, sumCoordinate } from "../../../../support/geometry";
import { entryForFile } from "../../../entry";

type Tree = {
    height: number;
    visible: boolean;
}

export const treetopTreeHouse = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const grid = lines.map(line => line.split("").map(e => ({height: parseInt(e, 10), visible: false}) as Tree));
        const size = {x: lines[0].length, y: lines.length}
        const rows = [
            {row: 0, dir: 1},
            {row: lines.length-1, dir: -1}
        ];
        const cols = [
            {col: 0, dir: 1},
            {col: lines[0].length - 1, dir: -1}
        ];

        for (const interesting of rows) {
            for (let col = 0; col < size.x; col++) {
                let previous: number | null = null;
                for (let row = interesting.row; row >= 0 && row < size.y; row += interesting.dir) {
                    previous = innerLoop(grid, row, col, previous);
                }
            }
        }

        for (const interesting of cols) {
            for (let row = 0; row < size.y; row++) {
                let previous: number | null = null;
                for (let col = interesting.col; col >= 0 && col < size.x; col += interesting.dir) {
                    previous = innerLoop(grid, row, col, previous);
                }
            }
        }

        let result = 0;

        for (let row = 0; row < size.y; row++) {
            for (let col = 0; col < size.x; col++) {
                if (grid[row][col].visible) {
                    // console.log(row, col);
                    result++;
                }
            }
        }

        await resultOutputCallback(result);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const grid = lines.map(line => line.split("").map(e => ({height: parseInt(e, 10), visible: false}) as Tree));
        const size = {x: lines[0].length, y: lines.length}

        let bestScenic = 0;

        for (let row = 0; row < size.y; row++) {
            for (let col = 0; col < size.x; col++) {
                const view: number[] = [];

                const dirs = [
                    directions.up,
                    directions.down,
                    directions.left,
                    directions.right
                ];

                const tree = grid[row][col];

                for (const direction of dirs) {
                    let score = 0;
                    let current = {x: col, y: row};
                    while (true) {
                        current = sumCoordinate(direction, current);
                        if (!isInBounds(current, {topLeft: {x: 0, y: 0}, size})) {
                            break;
                        }
                        score++;
                        const value = grid[current.y][current.x];
                        if (value.height >= tree.height) {
                            break;
                        }
                    }
                    view.push(score);
                }
                const scenic = view.reduce((acc, next) => acc * next, 1);
                if (scenic > bestScenic) {
                    bestScenic = scenic;
                }
            }
        }

        await resultOutputCallback(bestScenic);
    },
    {
        key: "treetop-tree-house",
        title: "Treetop Tree House",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);  

function innerLoop(grid: Tree[][], row: number, col: number, previous: number | null) {
    const tree = grid[row][col];
    if (previous === null || previous < tree.height) {
        tree.visible = true;
    }
    if (previous === null) {
        previous = tree.height;
    } else {
        previous = Math.max(tree.height, previous);
    }
    return previous;
}
