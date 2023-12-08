import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { lcm } from "../../../../support/algebra";

export const hauntedWasteland = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .group("")
            .startSimpleLabeling()
            .label(e => e[0].split(""), "directions")
            .label(e => new Parser(e)
                .tokenize(" = ")
                .startLabeling()
                .label(left => left.run(), "node")
                .label(right => right
                    .extractGroupRegex(
                        /\((\w+), (\w+)\)/,
                        e => e.run(),
                        e => e.run()
                    )
                    .startSimpleLabeling()
                    .label(e => e, "left")
                    .label(e => e, "right")
                    .run(),
                    "options"
                ).run(),
                "nodes"
            )
            .run();

        const nodeMap = new Map<string, {left: string, right: string}>();

        for (const node of ns.nodes) {
            nodeMap.set(node.node, node.options);
        }

        const start = "AAA";

        let currentState = start;
        const destination = "ZZZ";
        let steps = 0;
        while (currentState !== destination) {
            const options = nodeMap.get(currentState);
            if (!options) {
                throw new Error("Didn't find mapping for " + currentState);
            }
            const {left, right} = options;
            if (ns.directions[(steps % ns.directions.length)] === "L") {
                currentState = left;
            } else {
                currentState = right;
            }
            steps++;
        }

        await resultOutputCallback(steps);
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .group("")
            .startSimpleLabeling()
            .label(e => e[0].split(""), "directions")
            .label(e => new Parser(e)
                .tokenize(" = ")
                .startLabeling()
                .label(left => left.run(), "node")
                .label(right => right
                    .extractGroupRegex(
                        /\((\w+), (\w+)\)/,
                        e => e.run(),
                        e => e.run()
                    )
                    .startSimpleLabeling()
                    .label(e => e, "left")
                    .label(e => e, "right")
                    .run(),
                    "options"
                ).run(),
                "nodes"
            )
            .run();

        const nodeMap = new Map<string, {left: string, right: string}>();

        for (const node of ns.nodes) {
            nodeMap.set(node.node, node.options);
        }

        const start = "AAA";


        const startNodes = ns.nodes.map(n => n.node).filter(e => e.endsWith("A"));
        const endNodes = ns.nodes.map(n => n.node).filter(e => e.endsWith("Z"));
        if (startNodes.length !== endNodes.length) {
            throw new Error("Invalid input");
        }

        let currentStates: string[] = [...startNodes];

        let steps = 0;

        const cyclesAt = new Map<string, number>();
        while (cyclesAt.size < startNodes.length) {
            currentStates = currentStates.map((currentState, i) => {
                if (currentState.endsWith("Z")) {
                    if (!cyclesAt.has(startNodes[i])) {
                        cyclesAt.set(startNodes[i], steps);
                    }
                }
                const options = nodeMap.get(currentState);
                if (!options) {
                    throw new Error("Didn't find mapping for " + currentState);
                }
                const {left, right} = options;
                if (ns.directions[(steps % ns.directions.length)] === "L") {
                    currentState = left;
                } else {
                    currentState = right;
                }
                return currentState;
            })
            steps++;
        }


        let result = 1;
        for (const value of cyclesAt.values()) {
            result = lcm(result, value);
        }

        await resultOutputCallback(result);
    },
    {
        key: "haunted-wasteland",
        title: "Haunted Wasteland",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 8,
        exampleInput: [`LLR

AAA = (BBB, BBB)
BBB = (AAA, ZZZ)
ZZZ = (ZZZ, ZZZ)`, `LR

11A = (11B, XXX)
11B = (XXX, 11Z)
11Z = (11B, XXX)
22A = (22B, XXX)
22B = (22C, 22C)
22C = (22Z, 22Z)
22Z = (22B, 22B)
XXX = (XXX, XXX)`]
    }
);