import { entryForFile } from "../../../entry";
import { Parser } from "../../../../support/parser";
import { Coordinate3d, drawStraightLine, serialization, sumCoordinate } from "../../../../support/geometry";
import { DefaultDict, SerializableDictionary } from "../../../../support/data-structure";
import { exampleInput } from "./example";

type Brick = {
    start: Coordinate3d;
    end: Coordinate3d;
}

export const sandSlabs = entryForFile(
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const bricks: Brick[] = new Parser(lines)
            .tokenize("~")
            .startLabeling()
            .label(s => s.extract3dCoordinates(), "start")
            .label(s => s.extract3dCoordinates(), "end")
            .run();

        const space = new SerializableDictionary<Coordinate3d, number>({
            serialize: serialization.serialize,
            deserialize: serialization.deserialize3d
        });
        const heightMapper = new DefaultDict<number, number[]>(() => []);
        for (let i = 0; i < bricks.length; i++) {
            drawBrick(i);
        }

        const isSupported = (id: number) => {
            const brick = bricks[id];
            const points = drawStraightLine(brick.start, brick.end, true);
            for (const point of points) {
                if (point.z === 1) {
                    return true;
                }
                const underneathPoint = sumCoordinate(point, {x: 0, y: 0, z: -1});
                const underneathCell = space.get(underneathPoint);
                if (underneathCell !== undefined && underneathCell !== id) {
                    return true;
                }
            }
            return false;
        }

        const supportedBy = (id: number) => {
            const brick = bricks[id];
            const points = drawStraightLine(brick.start, brick.end, true);
            const bricksUnder: Set<number> = new Set<number>();
            for (const point of points) {
                const underPoint = sumCoordinate(point, {x: 0, y: 0, z: -1});
                const underCell = space.get(underPoint);
                if (underCell !== undefined && underCell !== id) {
                    bricksUnder.add(underCell);
                }
            }
            return bricksUnder;
        }

        while (true) {
            const heights = [...heightMapper.keys].filter(h => h > 1).sort();

            let gotChanges = false;
            // console.log(heights);
            for (const height of heights) {
                const interestingBricks = [...heightMapper.get(height)];
                for (const brickId of interestingBricks) {
                    const brick = bricks[brickId];
                    if (!isSupported(brickId)) {
                        gotChanges = true;
                        const points = drawStraightLine(brick.start, brick.end, true);
                        for (const point of points) {
                            space.unset(point);
                        }
                        const toChange = heightMapper.ensureAndGet(height);
                        const index = toChange.indexOf(brickId);
                        toChange.splice(index, 1);
                        for (const key of ["start", "end"] as (keyof Brick)[]) {
                            brick[key].z -= 1;
                        }
                        const resultHeight = drawBrick(brickId);
                        // console.log(`Lowering ${brickId} from ${height} to ${resultHeight}`);
                    }
                }
            }
            if (!gotChanges) {
                break;
            }
        }

        const cannotBeRemoved = new Set<number>();

        for (let i = 0; i < bricks.length; i++) {
            const supported = supportedBy(i);
            // console.log(`${i} supported by: ${[...supported.values()].join(", ")}`)
            if (supported.size <= 1) {
                for (const item of supported.values()) {
                    cannotBeRemoved.add(item);
                }
            }
        }

        const canBeRemoved = bricks.filter((b, i) => !cannotBeRemoved.has(i));

        await resultOutputCallback(canBeRemoved.length);


        function drawBrick(id: number) {
            const brick = bricks[id];
            let minZ = brick.start.z;
            for (const point of drawStraightLine(brick.start, brick.end, true)) {
                if (point.z < minZ) {
                    minZ = point.z;
                }
                space.set(point, id);
            }
            heightMapper.ensureAndGet(minZ).push(id);
            return minZ;
        }
    },
    async ({ lines, outputCallback, resultOutputCallback }) => {
        const ns = new Parser(lines)
            .asNumbers()
            .run();
        let result: any = 0
        for (let i = 0; i < ns.length; i++) {
            const x = ns[i];
        }
        await resultOutputCallback(result);
    },
    {
        key: "sand-slabs",
        title: "Sand Slabs",
        supportsQuickRunning: true,
        embeddedData: true,
        date: 22,
        exampleInput
    }
);