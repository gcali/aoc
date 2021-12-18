import { subsetGenerator } from "../../../../support/sequences";
import { entryForFile } from "../../../entry";

type Value = {
    parent?: Expression;
    value: number;
};

type Expression = {
    parent?: Expression;
    left: Node;
    right: Node;
};

type Node = {
    parent?: Expression
} & (
        Value | Expression
    );

const parseList = (data: any): Node => {
    if (typeof data === "number") {
        return {
            value: data
        };
    } else {
        const left = parseList(data[0]);
        const right = parseList(data[1]);
        const node: Node = setParents({
            left,
            right
        });
        return node;
    }
};

const isValue = (node: Node): node is Value => {
    return (node as Value).value !== undefined;
};

const parseLine = (line: string): Node => {
    return parseList(JSON.parse(line));
};

const setParents = (node: Node): Node => {
    if (!isValue(node)) {
        node.left.parent = node;
        node.right.parent = node;
    }
    return node;
};

const add = (a: Node, b: Node): Node => {
    const res = setParents({
        left: a,
        right: b
    });
    reduce(res);
    return res;
};

const addTo = (
    node: Expression,
    upExtractor: (node: Expression) => Node,
    downExtractor: (node: Expression) => Node
) => {
    let currentNode: Node = node;
    let found = false;
    while (true) {
        const parent: Expression | undefined = currentNode.parent;
        if (!parent) {
            break;
        }
        const check = upExtractor(parent);
        if (check !== currentNode) {
            found = true;
            currentNode = check;
            break;
        }
        currentNode = parent;
    }
    if (found) {
        // found a parent
        while (!isValue(currentNode)) {
            currentNode = downExtractor(currentNode);
        }
        const toAdd = upExtractor(node);
        if (!isValue(toAdd)) {
            throw new Error("Cannot explode a non leaf expression");
        }
        currentNode.value += toAdd.value;
    }
};

const findExplode = (node: Node, depth = 0): Expression | undefined => {
    if (isValue(node)) {
        return undefined;
    }
    if (depth === 4) {
        return node;
    }
    return findExplode(node.left, depth + 1) || findExplode(node.right, depth + 1);
};

const findSplit = (node: Node): Value | undefined => {
    if (isValue(node)) {
        if (node.value >= 10) {
            return node;
        }
        return undefined;
    }
    return findSplit(node.left) || findSplit(node.right);
};

const explode = (node: Expression) => {
    const upExtractor = (node: Expression): Node => {
        return node.left;
    };
    const downExtractor = (node: Expression): Node => {
        return node.right;
    };

    addTo(node, (n) => n.left, (n) => n.right);
    addTo(node, (n) => n.right, (n) => n.left);

    const parent = node.parent!;
    const newNode: Value = {
        value: 0,
        parent
    };
    if (parent.left === node) {
        parent.left = newNode;
    } else {
        parent.right = newNode;
    }

};

const split = (node: Value) => {
    const newNode: Node = setParents({
        left: {
            value: Math.floor(node.value / 2)
        },
        right: {
            value: Math.ceil(node.value / 2)
        }
    });
    const parent = node.parent;
    if (!parent) {
        throw new Error("Cannot split without parent");
    }
    newNode.parent = parent;
    if (parent.left === node) {
        parent.left = newNode;
    } else {
        parent.right = newNode;
    }
};

const checkMissingParent = (node: Node): boolean => {
    if (isValue(node)) {
        return false;
    }
    if (node.left.parent !== node || node.right.parent !== node) {
        return true;
    }
    return checkMissingParent(node.left) || checkMissingParent(node.right);
};

const reduce = (node: Node) => {
    let didSomething = false;
    do {
        didSomething = false;
        const toExplode = findExplode(node);
        if (toExplode) {
            explode(toExplode);
            didSomething = true;
            continue;
        }
        const toSplit = findSplit(node);
        if (toSplit) {
            split(toSplit);
            didSomething = true;
            continue;
        }

    } while (didSomething);
};

const magnitude = (node: Node): number => {
    if (isValue(node)) {
        return node.value;
    }
    return magnitude(node.left) * 3 + magnitude(node.right) * 2;
};

export const snailfish = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {

        let current = parseLine(lines[0]);
        for (const line of lines.slice(1)) {
            current = add(current, parseLine(line));
        }

        await resultOutputCallback(magnitude(current));
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {

        let biggest = Number.NEGATIVE_INFINITY;

        for (const line of subsetGenerator(lines, 0, 2)) {
            const items = [...line];
            if (items.length === 2) {
                console.log(items);
                const a = magnitude(add(parseLine(items[0]), parseLine(items[1])));
                const b = magnitude(add(parseLine(items[1]), parseLine(items[0])));

                biggest = Math.max(biggest, a, b);
            }
        }


        await resultOutputCallback(biggest);
    },
    {
        key: "snailfish",
        title: "Snailfish",
        supportsQuickRunning: true,
        embeddedData: true,
        stars: 2
    }
);
