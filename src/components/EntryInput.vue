<template lang="pug">
    .input.unselectable
        div(v-if="!noInput")
            EntryFileInput(
                readFile="true",
                @file-content="readFileContent",
                :disabled="disabled"
                :isUsingEmbedded="forceEmbedded"
            )
            .embedded(v-if="hasEmbedded")
                button(v-if="forceEmbedded" disabled ) Using embedded data
                button(v-else @click="useEmbedded") Use embedded
        div(v-else :style="{marginBottom: '1em'}") No input available: 
            | you cannot select your input for the current year in order to avoid cheating!
        .choices(:class="{hidden: hideChoices}")
            EntryChoice(:key="this.$route.path", @execute="loadFile", :disabled="disabled")
</template>

<script lang="ts">
import EntryFileInput from "@/components/EntryFileInput.vue";
import EntryChoice from "@/components/EntryChoice.vue";
import { Component, Vue, Emit, Prop, Watch } from "vue-property-decorator";
import { Choice } from "../constants/choice";
import { EntryFileHandling } from "../entries/entry";
import { disabledYear, embeddedLines } from "../entries/embeddedData";

@Component({
    components: {
        EntryFileInput,
        EntryChoice
    }
})
export default class EntryInput extends Vue {
    @Prop({ default: false }) public disabled!: boolean;
    @Prop({required: true, default: ""}) public entryKey!: string;
    @Prop({required: true}) public year!: string;

    private inputContent: string | null = null;
    private forceEmbedded: boolean = false;

    public get noInput(): boolean {
        return this.entryKey in embeddedLines && this.year === disabledYear;
    }

    public get hasEmbedded(): boolean {
        return this.entryKey in embeddedLines;
    }

    public get hideChoices(): boolean {
        return this.inputContent === null && !(this.noInput || this.forceEmbedded);
    }

    public readFileContent(content: string) {
        this.inputContent = content;
        this.forceEmbedded = false;
    }

    public useEmbedded() {
        this.forceEmbedded = true;
        this.inputContent = null;
    }

    @Emit("file-loaded")
    public async loadFile(choice: Choice): Promise<EntryFileHandling> {
        if (this.noInput || this.forceEmbedded) {
            const content = await (embeddedLines[this.entryKey] || (async () => [] as string[]))();
            const lastIndex = content.length - 1;
            if (content.length > 0 && content[lastIndex].endsWith("\n")) {
                content[lastIndex] = content[lastIndex].slice(0, content[lastIndex].length - 1);
            }
            return {choice, content };
        }
        if (!this.inputContent) {
            throw Error("No file was read");
        }

        let contentToSplit = this.inputContent;
        if (contentToSplit.endsWith("\n")) {
            contentToSplit = contentToSplit.slice(0, contentToSplit.length - 1);
        }
        const splitContent = contentToSplit.split("\n");

        return {
            choice,
            content: splitContent
        };
    }
}
</script>

<style lang="scss" scoped>
.input {
    // display: flex;
    // flex-direction: column;
    .choices {
        margin-bottom: 0.5em;
    }
    .embedded {
        margin-bottom: 1em;
    }
}
</style>

