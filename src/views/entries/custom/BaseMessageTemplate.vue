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
        .output
            EntrySimpleOutput(:key="$route.path", :lines="output")
        slot
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import {
    Entry,
    EntryFileHandling,
    executeEntry,
    MessageSender,
    ScreenPrinter,
    simpleOutputCallbackFactory
} from "../../../entries/entry";
import EntryTemplate from "@/components/EntryTemplate.vue";
import EntrySimpleOutput from "@/components/EntrySimpleOutput.vue";
import { setTimeoutAsync } from "../../../support/async";
import { Coordinate } from "../../../support/geometry";
import { mediaQuery } from "../../../support/browser";

@Component({
    components: {
        EntryTemplate,
        EntrySimpleOutput
    }
})
export default class BaseMessageTemplate extends Vue {

    public get supportsQuickRunning() {
        return this.entry.metadata && this.entry.metadata.supportsQuickRunning;
    }
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;
    @Prop() public messageHandler: MessageSender | undefined;
    @Prop({required: false}) public additionalReset?: () => void;

    private executing: boolean = false;
    private time: string = "";

    private timeout = 50;

    private output: string[] = [];

    private destroying = false;
    private quickRun = false;

    private shouldStop = false;

    private clearScreen?: () => void;

    @Watch("entry")
    public onEntryChanged() {
        this.reset();
        this.quickRun = false;
    }

    public beforeDestroy() {
        this.quickRun = false;
        this.reset();
        this.destroying = true;
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
                isQuickRunning: this.quickRun,
                stopTimer: () => this.time = `${new Date().getTime() - startTime}ms`,
                sendMessage: this.quickRun ? undefined : this.messageHandler,
                mediaQuery,
                isExample: false
            });
        } catch (e) {
            throw e;
        } finally {
            this.executing = false;
        }
    }

    private createPause(): (() => Promise<void>) {
        let lastPause = 0;
        return () => {
            const promise = new Promise<void>((resolve, reject) => {
                if (this.timeout > 0) {
                    setTimeout(resolve , this.timeout);
                } else {
                    const currentTime = new Date().getTime();
                    if (currentTime - lastPause > 500) {
                        lastPause = currentTime;
                        setTimeout(resolve, 0);
                    } else {
                        resolve();
                    }
                }
            });
            return promise;
        };

    }

    private reset() {
        if (this.additionalReset) {
            this.additionalReset();
        }
        if (this.clearScreen) {
            this.clearScreen();
        }
        this.time = "";
        this.destroying = false;
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

