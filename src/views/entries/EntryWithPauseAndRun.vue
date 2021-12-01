<template lang="pug">
    EntryTemplate(
        :title="title"
        :id="id"
        @file-loaded="readFile"
        :disabled="executing"
        :year="year"
        :entryKey="this.entry.metadata.key"
    )
        .quick-run(v-if="supportsQuickRunning").unselectable
            label Quick run
            input(type="checkbox" v-model="quickRun" :disabled="executing")
            label(v-if="time") Time: {{time}}
        .input(:class="{transparent:!executing || quickRun}").unselectable
            button(@click="play", :class="{transparent: !executing || running}") Play
            button(@click="nextState", :class="{transparent: !executing || running}") Next
            button(@click="stop", :class="{transparent: !executing}") Stop
            button(@click="run", :class="{transparent: !executing || running}") Toggle Run
            button(@click="run", :class="{transparent: !executing || !running}") Pause
            .speed
                label Animation delay
                input(v-model="timeout" type="number" min="0" step="10")
        .output
            EntrySimpleOutput(:key="$route.path", :lines="output" @print-factory="readFactory")
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import {
    Entry,
    EntryFileHandling,
    executeEntry,
    ScreenPrinter,
    simpleOutputCallbackFactory
} from "../../entries/entry";
import EntryTemplate from "@/components/EntryTemplate.vue";
import EntrySimpleOutput from "@/components/EntrySimpleOutput.vue";
import { setTimeoutAsync } from "../../support/async";
import { isTimeoutMessage } from "../../entries/entryStatusMessages";
import { Coordinate } from "../../support/geometry";
import {mediaQuery} from "../../support/browser";

@Component({
    components: {
        EntryTemplate,
        EntrySimpleOutput
    }
})
export default class EntryWithPauseAndRun extends Vue {

    public get supportsQuickRunning() {
        return this.entry.metadata && this.entry.metadata.supportsQuickRunning;
    }
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    private executing: boolean = false;
    private resolver?: () => void;
    private shouldStop: boolean = false;
    private shouldRun: boolean = false;
    private running: boolean = false;
    private time: string = "";

    private timeout = 50;

    private output: string[] = [];

    private requireScreen?: (size?: Coordinate) => Promise<ScreenPrinter>;
    private screenPrinter?: ScreenPrinter;

    private destroying = false;
    private quickRun = false;

    private clearScreen?: () => void;

    @Watch("entry")
    public onEntryChanged() {
        this.reset();
        this.quickRun = false;
    }

    public readFactory(args: {factory: (c?: Coordinate) => Promise<ScreenPrinter>, clear: () => void}) {
        this.clearScreen = args.clear;
        this.requireScreen = async (size?: Coordinate) => {
            const result = await args.factory(size);
            this.screenPrinter = result;
            return result;
        };
    }

    public beforeDestroy() {
        this.quickRun = false;
        this.reset();
        this.destroying = true;
        if (this.screenPrinter) {
            this.screenPrinter.stop();
        }
    }

    public async readFile(fileHandling: EntryFileHandling) {
        this.reset();
        this.executing = true;
        const that = this;
        try {
            const startTime = new Date().getTime();
            await executeEntry({
                entry: this.entry,
                choice: fileHandling.choice,
                lines: fileHandling.content,
                outputCallback: simpleOutputCallbackFactory(this.output, () => this.destroying),
                isCancelled: () => that.shouldStop,
                pause: this.createPause(),
                screen: this.requireScreen && !this.quickRun ? { requireScreen: this.requireScreen } : undefined,
                isQuickRunning: this.quickRun,
                stopTimer: () => this.time = `${new Date().getTime() - startTime}ms`,
                mediaQuery
            });
        } catch (e) {
            throw e;
        } finally {
            this.executing = false;
            if (this.screenPrinter) {
                this.screenPrinter.stop();
            }
        }
    }

    public play() {
        this.shouldRun = true;
        this.nextState();
    }

    public stop() {
        this.shouldStop = true;
        this.running = false;
        this.nextState();
    }

    public run() {
        this.shouldRun = !this.shouldRun;
    }
    public nextState() {
        if (this.resolver) {
            const resolver = this.resolver;
            this.resolver = undefined;
            resolver();
        }
    }

    private createPause(): (() => Promise<void>) {
        let drawingPause: (() => void) | undefined;
        let lastPause = 0;
        return () => {
            const promise = new Promise<void>((resolve, reject) => {
                if (this.shouldRun) {
                    this.running = true;
                    const resolver = drawingPause ? () => {
                        if (drawingPause) {
                            drawingPause();
                            drawingPause = undefined;
                        }
                        resolve();
                    } : resolve;
                    if (this.timeout > 0) {
                        setTimeout(resolver , this.timeout);
                    } else {
                        const currentTime = new Date().getTime();
                        if (currentTime - lastPause > 500) {
                            lastPause = currentTime;
                            setTimeout(resolver, 0);
                        } else {
                            resolver();
                        }
                    }
                } else {
                    this.running = false;
                    if (!drawingPause && this.screenPrinter) {
                        drawingPause = this.screenPrinter.pause();
                    }
                    if (this.screenPrinter) {
                        this.screenPrinter.forceRender();
                    }
                    this.resolver = resolve;
                }
            });
            return promise;
        };

    }

    private reset() {
        if (this.clearScreen) {
            this.clearScreen();
        }
        if (this.running) {
            this.stop();
        }
        this.time = "";
        this.destroying = false;
        this.running = false;
        this.shouldRun = false;
        this.shouldStop = false;
        this.executing = false;
        this.output = [];
        if (this.entry.metadata && this.entry.metadata.suggestedDelay !== undefined) {
            this.timeout = this.entry.metadata.suggestedDelay;
        }
    }
}
</script>


<style lang="scss">
.output {
    display: flex;
    align-items: stretch;
}
.input .speed {
    label {
        margin-right: 1em;
    }
    margin: 1em 0em;
}
</style> 