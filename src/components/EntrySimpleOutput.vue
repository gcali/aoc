<template lang="pug">
    .wrapper()
        .screen-output(v-if="canvasSize")
            canvas( 
                ref="canvas"
                :width="canvasSize.width"
                :height="canvasSize.height"
                :style="style"
            )
        .output(ref="output", :class="{hidden: hideOutput}") {{text}}
</template>


<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Drawable, ScreenPrinter } from "../entries/entry";
import { Coordinate } from "../support/geometry";

type ScreenCallback = (
    width: number,
    height: number,
    callback: ((context: CanvasRenderingContext2D | null) => void)
) => void;

@Component({})
export default class EntrySimpleOutput extends Vue {

    public get hideOutput(): boolean {
        return this.lines.length <= 0;
    }

    public get text() {
        return this.lines.join("\n");
    }
    @Prop({ default: [] }) public lines!: string[];

    @Prop({ default: undefined }) public backgroundColor?: string;

    public $refs!: {
        output: HTMLDivElement,
        canvas: HTMLCanvasElement
    };

    private canvasSize: {width: number, height: number} | null = null;

    private shouldStopRenderer: boolean = false;

    private toDraw: Drawable[] = [];
    private toDrawForeground: Drawable[] = [];
    private ids: Set<string> = new Set<string>();

    private context: CanvasRenderingContext2D | null = null;
    private stop: boolean = false;

    private pause: boolean = false;
    private pauseFor?: number = undefined;

    private manualRender: boolean = false;

    public mounted() {
        this.$emit("print-factory", {
            factory: async (size?: Coordinate): Promise<ScreenPrinter> => {
            this.canvasSize = size ? {width: size.x, height: size.y} : {width: 300, height: 300};
            this.ids = new Set<string>();
            this.toDraw = [];
            this.toDrawForeground = [];
            this.pause = false;
            return {
                add: async (item) => {
                    if (!this.ids.has(item.id)) {
                        this.toDraw.push(item);
                        this.ids.add(item.id);
                        this.startRender();
                    } else {
                        console.error("Duplicate ID, not adding: " + item.id);
                    }
                },
                addForeground: async (item) => {
                    this.toDrawForeground.push(item);
                    this.startRender();
                },
                remove: async (id) => {
                    if (this.ids.has(id)) {
                        const index = this.toDraw.findIndex((e) => e.id === id);
                        this.toDraw.splice(index, 1);
                        this.ids.delete(id);
                    }
                },
                stop: async () => {
                    this.renderIteration();
                    this.context = null;
                    console.log("Stopping render...");
                },
                replace: async (items: Drawable[]) => {
                    const newIds = new Set<string>(items.map((item) => item.id));
                    if (newIds.size !== items.length) {
                        console.error("There are duplicated IDs, not replacing");
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
                changeColor: async (idOrIndex: string | number, color: string) => {
                    const index: number = typeof idOrIndex === "string" ?
                        this.toDraw.findIndex((e) => e.id === idOrIndex)
                        : idOrIndex;
                    if (index < 0 || index >= this.toDraw.length) {
                        return;
                    }
                    this.toDraw[index].color = color;
                },
                setManualRender: () => {
                    this.manualRender = true;
                }
            };
        }, clear: () => this.canvasSize = null});
    }

    @Watch("text")
    public onTextChanged(val: string[], oldVal: string[]) {
        this.$refs.output.scrollTop = this.$refs.output.scrollHeight;
    }

    private startRender() {
        if (!this.stop && this.context === null) {
            console.log("Starting render...");
            this.context = this.$refs.canvas.getContext("2d");
            if (this.manualRender) {
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
            this.context.fillStyle = item.color;
            this.context.fill();
        };

        if (this.context && this.canvasSize) {
            this.context.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
            for (const item of this.toDraw) {
                renderItem(item);
            }

            for (const item of this.toDrawForeground) {
                renderItem(item);
            }
        }

    }

    public get style() {
        const style: {[key: string]: string} = {};
        if (this.backgroundColor) {
            style["background-color"] = this.backgroundColor;
        }

        return style;
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
        canvas {
            border-radius: 4px;
            background-color: $dark-transparent-color;
        }
    }
}
</style>
