<template lang="pug">
.wrapper
    .screen-output(v-if="canvasSize")
        canvas(
            ref="canvas",
            :width="canvasSize.width",
            :height="canvasSize.height",
            :style="style"
        )
    .output(ref="output", :class="{ hidden: hideOutput }") {{ text }}
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Drawable, ScreenPrinter } from "../entries/entry";
import {
    Bounds,
    boundsContain,
    boundsIntersect,
    Coordinate,
    getBoundaries,
    getTopLeftBottomRight,
    joinBoundaries,
    sumCoordinate,
} from "../support/geometry";

type ScreenCallback = (
    width: number,
    height: number,
    callback: (context: CanvasRenderingContext2D | null) => void
) => void;

type InvalidateItem = {
    bounds: Bounds;
    isInvalid: boolean;
    drawable: Drawable;
};

@Component({})
export default class EntrySimpleOutput extends Vue {
    public get hideOutput(): boolean {
        return this.lines.length <= 0;
    }

    public get text() {
        return this.lines.join("\n");
    }

    public get style() {
        const style: { [key: string]: string } = {};
        if (this.backgroundColor) {
            style["background-color"] = this.backgroundColor;
        }

        return style;
    }
    @Prop({ default: [] }) public lines!: string[];

    @Prop({ default: undefined }) public backgroundColor?: string;

    public $refs!: {
        output: HTMLDivElement;
        canvas: HTMLCanvasElement;
    };

    private canvasSize: { width: number; height: number } | null = null;

    private shouldStopRenderer: boolean = false;

    private toDraw: Drawable[] = [];
    private toDrawForeground: Drawable[] = [];
    private ids: Set<string> = new Set<string>();

    private context: CanvasRenderingContext2D | null = null;
    private stop: boolean = false;

    private pause: boolean = false;
    private pauseFor?: number = undefined;

    private manualRender: boolean = false;

    private manualInvalidate: boolean = false;

    private invalidateMap: {
        [key: string]: InvalidateItem;
    } = {};

    public mounted() {
        this.$emit("print-factory", {
            factory: async (size?: Coordinate): Promise<ScreenPrinter> => {
                this.canvasSize = size
                    ? { width: size.x, height: size.y }
                    : { width: 300, height: 300 };
                this.ids = new Set<string>();
                this.toDraw = [];
                this.toDrawForeground = [];
                this.pause = false;
                return {
                    add: async (item) => {
                        if (!this.ids.has(item.id)) {
                            this.toDraw.push(item);
                            this.internalAddItem(item);
                        } else {
                            console.error(
                                "Duplicate ID, not adding: " + item.id
                            );
                        }
                    },
                    addForeground: async (item) => {
                        if (!this.ids.has(item.id)) {
                            this.toDrawForeground.push(item);
                            this.internalAddItem(item);
                        } else {
                            console.error(
                                "Duplicate ID, not adding to foreground: " +
                                    item.id
                            );
                        }
                    },
                    remove: async (id) => {
                        if (this.ids.has(id)) {
                            const index = this.toDraw.findIndex(
                                (e) => e.id === id
                            );
                            this.toDraw.splice(index, 1);
                            this.ids.delete(id);
                            delete this.invalidateMap[id];
                        }
                    },
                    stop: async () => {
                        this.renderIteration();
                        this.context = null;
                        console.log("Stopping render...");
                    },
                    replace: async (items: Drawable[]) => {
                        const newIds = new Set<string>(
                            items.map((item) => item.id)
                        );
                        if (newIds.size !== items.length) {
                            console.error(
                                "There are duplicated IDs, not replacing"
                            );
                        }
                        this.toDraw = [...items];
                        this.ids = newIds;
                        this.startRender();
                    },
                    pause: (times?: number) => {
                        this.pauseFor = times;
                        this.pause = true;
                        return () => {
                            this.pause = false;
                        };
                    },
                    forceRender: () => {
                        this.renderIteration();
                    },
                    changeColor: async (
                        idOrIndex: string | number,
                        color: string
                    ) => {
                        const index: number =
                            typeof idOrIndex === "string"
                                ? this.toDraw.findIndex(
                                      (e) => e.id === idOrIndex
                                  )
                                : idOrIndex;
                        if (index < 0 || index >= this.toDraw.length) {
                            return;
                        }
                        this.toDraw[index].color = color;
                    },
                    setManualRender: () => {
                        this.manualRender = true;
                    },
                    setManualInvalidate: () => {
                        this.manualInvalidate = true;
                    },
                    invalidate: (key: string | Drawable) => {
                        const item =
                            this.invalidateMap[
                                typeof key === "string" ? key : key.id
                            ];
                        if (!item) {
                            console.error("Invalid key to invalidate: " + key);
                        }
                        item.isInvalid = true;
                        const newBounds = this.getBoundaries(item.drawable);
                        item.bounds = joinBoundaries(item.bounds, newBounds);
                    },
                    getImage: (): Promise<Blob> => {
                        return new Promise<Blob>((res, rej) => {
                            this.$refs.canvas.toBlob((c) => {
                                if (c === null) {
                                    rej();
                                } else {
                                    res(c);
                                }
                            });
                        });
                    },
                };
            },
            clear: () => (this.canvasSize = null),
        });
    }

    @Watch("text")
    public onTextChanged(val: string[], oldVal: string[]) {
        this.$refs.output.scrollTop = this.$refs.output.scrollHeight;
    }

    private getBoundaries(item: Drawable): Bounds {
        if (item.type === "rectangle") {
            return getBoundaries([item.c, sumCoordinate(item.c, item.size)]);
        } else {
            return getBoundaries(item.points);
        }
    }

    private internalAddItem(item: Drawable) {
        this.ids.add(item.id);
        const bounds = this.getBoundaries(item);
        this.invalidateMap[item.id] = {
            bounds,
            isInvalid: true,
            drawable: item,
        };
        this.startRender();
    }

    private startRender() {
        if (!this.stop && this.context === null) {
            console.log("Starting render...");
            this.context = this.$refs.canvas.getContext("2d");
            if (this.context && this.canvasSize) {
                this.context.clearRect(
                    0,
                    0,
                    this.canvasSize.width,
                    this.canvasSize.height
                );
            }
            if (this.manualRender) {
                console.log("Manual render");
                return;
            }
            const render = () => {
                if (this.context !== null && this.canvasSize) {
                    if (!this.pause) {
                        this.renderIteration();
                    }
                    setTimeout(render, 1000 / 30);
                } else {
                    console.log("Render stopped");
                }
            };
            render();
            // setTimeout(render, 1000/30);
            console.log("Render started");
        } else {
            if (this.stop) {
                console.log("Component destroyed");
            }
        }
    }

    private renderIteration() {
        const renderItem = (item: Drawable) => {
            if (!this.context || !this.canvasSize) {
                return;
            }
            this.context.beginPath();
            if (item.type === "rectangle") {
                this.context.rect(item.c.x, item.c.y, item.size.x, item.size.y);
            } else if (item.type === "points") {
                let isFirst = true;
                for (const point of item.points) {
                    if (isFirst) {
                        this.context.moveTo(point.x, point.y);
                        isFirst = false;
                    } else {
                        this.context.lineTo(point.x, point.y);
                    }
                }
            }

            if (item.shouldStroke) {
                this.context.strokeStyle = item.color;
                this.context.stroke();
            } else {

                this.context.fillStyle = item.color;
                this.context.fill();
            }
        };

        if (this.context && this.canvasSize) {
            if (!this.manualInvalidate) {
                this.context.clearRect(
                    0,
                    0,
                    this.canvasSize.width,
                    this.canvasSize.height
                );
                for (const item of this.toDraw) {
                    renderItem(item);
                }

                for (const item of this.toDrawForeground) {
                    renderItem(item);
                }
            } else {
                const points = Object.values(this.invalidateMap)
                    .filter((v) => v.isInvalid)
                    .flatMap((e) => getTopLeftBottomRight(e.bounds));
                let invalidateBounds = getBoundaries(points);
                while (true) {
                    const newPoints = Object.values(this.invalidateMap)
                        .filter(
                            (e) =>
                                boundsIntersect(e.bounds, invalidateBounds) &&
                                !boundsContain(invalidateBounds, e.bounds)
                        )
                        .flatMap((e) => getTopLeftBottomRight(e.bounds));
                    if (newPoints.length === 0) {
                        break;
                    }
                    invalidateBounds = getBoundaries([
                        ...newPoints,
                        ...getTopLeftBottomRight(invalidateBounds),
                    ]);
                }

                invalidateBounds.topLeft.x -= 1;
                invalidateBounds.topLeft.y -= 1;
                invalidateBounds.size.x += 2;
                invalidateBounds.size.y += 2;
                // don't know why :(
                this.context.clearRect(
                    invalidateBounds.topLeft.x,
                    invalidateBounds.topLeft.y,
                    invalidateBounds.size.x,
                    invalidateBounds.size.y
                );
                // this.context.rect(
                //     invalidateBounds.topLeft.x,
                //     invalidateBounds.topLeft.y,
                //     invalidateBounds.size.x,
                //     invalidateBounds.size.y
                // );
                // this.context.strokeStyle = "red";
                // this.context.stroke();
                for (const item of this.toDraw) {
                    const invalidateInfo = this.invalidateMap[item.id];
                    invalidateInfo.isInvalid = false;
                    const bounds = invalidateInfo.bounds;
                    if (boundsIntersect(bounds, invalidateBounds)) {
                        renderItem(item);
                    }
                    invalidateInfo.bounds = this.getBoundaries(item);
                }
                for (const item of this.toDrawForeground) {
                    const invalidateInfo = this.invalidateMap[item.id];
                    invalidateInfo.isInvalid = false;
                    const bounds = invalidateInfo.bounds;
                    if (boundsIntersect(bounds, invalidateBounds)) {
                        renderItem(item);
                    }
                    invalidateInfo.bounds = this.getBoundaries(item);
                }
            }
        }
    }

    private destroyed() {
        this.stop = true;
        this.context = null;
    }
}
</script> 

<style lang="scss" scoped>
.wrapper {
    display: flex;
    flex-direction: column;
    align-items: baseline;
    flex: 1 1 auto;
    .output {
        font-family: monospace;
        flex: 0 1 auto;
        overflow-y: scroll;
        align-self: stretch;
        white-space: pre-wrap;
        background-color: $dark-transparent-color;
        color: white;
        border-radius: 4px;
        min-height: 2em;
        padding: 1em;
        // max-width: 60em;
    }
    .screen-output {
        @include small-screen {
            align-self: center;
        }
        canvas {
            border-radius: 4px;
            background-color: $dark-transparent-color;
        }
    }
}
</style>
