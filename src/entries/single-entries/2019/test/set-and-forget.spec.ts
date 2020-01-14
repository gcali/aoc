import "mocha";
import { expect } from "chai";
import { Field } from "../set-and-forget";
import { expectSameArrays } from "../../../../support/assertions";

describe("Set and forget", () => {
    it("finds the correct number of intersections on basic example", async () => {
        const rows = [
            ".#.",
            "###",
            ".#.",
        ];
        const field = new Field(rows);
        const intersections = await field.getIntersections();
        expect(intersections).to.have.length(1);
    });

    it("finds the correct number of intersections on complex example", async () => {
        const rows = [
            "..#..........",
            "..#..........",
            "#######...###",
            "#.#...#...#.#",
            "#############",
            "..#...#...#..",
            "..#####...^.."
        ];
        const field = new Field(rows);
        const intersections = await field.getIntersections();
        expect(intersections).to.have.length(4);
    });

    it("gets the movements in a simple case", async () => {
        const rows = [
            ".#.",
            ".#.",
            ".^.",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements(false);
        expect(movements).to.have.length(1);
        expect(movements[0]).to.equal(2);
    });

    it("gets the movements with a turn", async () => {
        const rows = [
            ".##",
            ".#.",
            ".^.",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expect(movements).to.have.length(3);
        expect(movements[0]).to.equal(2);
        expect(movements[1]).to.equal("R");
        expect(movements[2]).to.equal(1);
    });

    it("gets the movements with a loop", async () => {
        const rows = [
            "..####.",
            "..#..#.",
            ".#####.",
            "..^....",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            3,
            "R",
            3,
            "R",
            2,
            "R",
            4
        ]);
    });
    it("gets the movements with a loop ending in nothing", async () => {
        const rows = [
            "..####.",
            "..#..#.",
            "######.",
            "..^....",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            3,
            "R",
            3,
            "R",
            2,
            "R",
            5
        ]);
    });
    it("gets the movements with a u turn costing the nothing", async () => {
        const rows = [
            "..#####",
            "..#...#",
            "..#...#",
            "..^....",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            3,
            "R",
            4,
            "R",
            2,
        ]);
    });

    it("gets the movements with a spiral costing the nothing", async () => {
        const rows = [
            "..#####",
            "..#...#",
            "..#.###",
            "..^....",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            3,
            "R",
            4,
            "R",
            2,
            "R",
            2
        ]);
    });
    it("gets the movements with a loop costing the nothing", async () => {
        const rows = [
            "..#####",
            "..#...#",
            ".######",
            "..^....",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            3,
            "R",
            4,
            "R",
            2,
            "R",
            5
        ]);
    });
    it("gets the movements with a loop costing the nothing and ending in nothing", async () => {
        const rows = [
            "..#####",
            "..#...#",
            "#######",
            "..^....",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            3,
            "R",
            4,
            "R",
            2,
            "R",
            6
        ]);
    });
    it("gets the movements when going left", async () => {
        const rows = [
            ".....",
            ".....",
            ".###.",
            "...^.",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            1,
            "L",
            2
        ]);
    });
    it("gets the movements when going too left", async () => {
        const rows = [
            "....",
            "....",
            "###.",
            "..^.",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            1,
            "L",
            2
        ]);
    });
    it("gets the movements when going too right", async () => {
        const rows = [
            ".....",
            ".....",
            "..###",
            "..^..",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            1,
            "R",
            2
        ]);
    });
    it("gets the movements when doing a big loop", async () => {
        const rows = [
            ".................",
            "...#.............",
            "...#..######.....",
            "...#..#....#.....",
            "...#########.....",
            "......#..........",
            "......^..........",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            4,
            "R",
            5,
            "R",
            2,
            "R",
            8,
            "R",
            3
        ]);
    });
    it("gets the movements when doing a big loop with multiple directions", async () => {
        const rows = [
            ".................",
            ".###.............",
            ".#.#..######.....",
            ".#.#..#....#.....",
            ".#.#########.....",
            "......#..........",
            "......^..........",
        ];
        const field = new Field(rows);
        const movements = await field.getMovements();
        expectSameArrays(movements, [
            4,
            "R",
            5,
            "R",
            2,
            "R",
            8,
            "R",
            3,
            "L",
            2,
            "L",
            3
        ]);
    });

});
