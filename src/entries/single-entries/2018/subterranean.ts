import { oldEntryForFile, entryForFile } from "../../entry";
import { DoubleLinkedNode } from "../../../support/data-structure";
import { howManySameAtEnd } from "../../../support/sequences";

enum PlantStatus {
    full = "#",
    empty = "."
}

function toPlantStatus(s: string) {
    if (s === "#") {
        return PlantStatus.full;
    } else {
        return PlantStatus.empty;
    }
}

interface Pattern {
    pattern: PlantStatus[];
    result: PlantStatus;
}

class Greenhouse {
    private start: DoubleLinkedNode<PlantStatus> | null = null;
    private end: DoubleLinkedNode<PlantStatus> | null = null;

    constructor(initialStatus: PlantStatus[], private patterns: Pattern[], private startIndex: number = 0) {
        // this.startIndex = 0;
        initialStatus.forEach((s) => {
            if (this.start === null) {
                this.start = new DoubleLinkedNode<PlantStatus>(s);
                this.end = this.start;
            } else {
                this.end = this.end!.append(s);
            }
        });
        this.fixEmptyPots();
    }

    public get status() {
        return {
            status: this.start!.visitToRight(),
            startIndex: this.startIndex
        };
    }

    public get sum() {
        const status = this.status;
        const filled = status
            .status
            .map((e, index) => ({
                index: index + status.startIndex,
                value: e
            }))
            .filter((e) => e.value === PlantStatus.full)
            .map((e) => e.index);
        const sum = filled.reduce((acc, next) => acc + next);
        return sum;
    }

    public passGeneration(): Greenhouse {
        const newStatus: PlantStatus[] = [PlantStatus.empty, PlantStatus.empty];
        let e = this.start!.next!.next!;
        while (e.next!.next !== null) {
            const nextFive = e.prev!.prev!.visitToRight(5);
            if (nextFive.length !== 5) {
                break;
            }
            const found = this.patterns.some((p) => {
                let foundDifferent: boolean = false;
                for (let i = 0; i < nextFive.length; i++) {
                    if (p.pattern[i] !== nextFive[i]) {
                        foundDifferent = true;
                        break;
                    }
                }
                if (foundDifferent) {
                    return false;
                } else {
                    newStatus.push(p.result);
                    return true;
                }
            });
            if (!found) {
                newStatus.push(PlantStatus.empty);
            }
            e = e.next!;
        }
        const newGreenhouse = new Greenhouse(newStatus, this.patterns, this.startIndex);
        newGreenhouse.fixEmptyPots();
        return newGreenhouse;
        // this.fixEmptyPots();
    }

    public toString(): string {
        if (this.start === null) {
            return "empty";
        } else {
            return `${this.start.visitToRight().join("")} ${this.startIndex}`;
        }
    }

    public fixEmptyPots() {
        const emptyBufferSize = 4;
        let consecutiveEmptyPots = 0;
        let e = this.start;
        while (e !== null && e.value === PlantStatus.empty) {
            consecutiveEmptyPots++;
            e = e.next;
        }
        while (consecutiveEmptyPots < emptyBufferSize) {
            this.start = this.start!.prepend(PlantStatus.empty);
            this.startIndex--;
            consecutiveEmptyPots++;
        }
        while (consecutiveEmptyPots > emptyBufferSize) {
            this.start!.removeNext();
            this.startIndex++;
            consecutiveEmptyPots--;
        }

        consecutiveEmptyPots = 0;
        e = this.end;
        while (e !== null && e.value === PlantStatus.empty) {
            consecutiveEmptyPots++;
            e = e.prev;
        }
        while (consecutiveEmptyPots < emptyBufferSize) {
            this.end = this.end!.append(PlantStatus.empty);
            consecutiveEmptyPots++;
        }
        while (consecutiveEmptyPots > emptyBufferSize) {
            this.end!.removePrev();
            consecutiveEmptyPots--;
        }
    }
}

export const entry = entryForFile(
    async ({lines, outputCallback}) => {
        let greenhouse = parseLines(lines);
        for (let i = 0; i < 20; i++) {
            greenhouse = greenhouse.passGeneration();
        }
        const sum = greenhouse.sum;
        await outputCallback(sum);
    },
    async ({lines, outputCallback}) => {
        let greenhouse = parseLines(lines);
        let lastSum: number | null = null;
        const diffs: number[] = [];
        const generations = 50000000000;
        for (let i = 1; i < 1000; i++) {
            greenhouse = greenhouse.passGeneration();
            const sum = greenhouse.sum;
            if (lastSum) {
                diffs.push(sum - lastSum);
            }
            lastSum = sum;
            if (diffs.length > 20 && howManySameAtEnd(diffs) >= 20) {
                const step = diffs[diffs.length - 1];
                const todo = generations - i;
                await outputCallback(sum + todo * step);
                return;
            }
        }
        await outputCallback("No pattern found");
        await outputCallback(JSON.stringify(diffs));
    },
    { key: "subterranean", title: "Subterranean Substainability", stars: 2, embeddedData: "subterranean-substainability/subterranean" }
);
function parseLines(lines: string[]): Greenhouse {
    const initialState = lines[0]
        .slice(lines[0].indexOf(":") + 2)
        .trim()
        .split("")
        .map((e) => e === "#" ? PlantStatus.full : PlantStatus.empty);
    const patterns: Pattern[] = lines
        .slice(2)
        .map((l) => l.trim())
        .filter((l) => l.indexOf(">") > 0)
        .map((l) => l.replace(/ /g, "").replace(/>/g, "").split("="))
        .map((couple) => ({
            result: toPlantStatus(couple[1]),
            pattern: couple[0].split("").map((p) => toPlantStatus(p))
        }));
    const greenhouse = new Greenhouse(initialState, patterns);
    return greenhouse;
}

