<template lang="pug">
    .file-selection.unselectable
        button.selection-action(@click="clickSelectionAction", :disabled="disabled") {{this.selectionLabel}}
        input(type="file" ref="file-input" @change="filesUpdated")
        label.selected-file(:class="{hidden: !this.isFileSelected}") {{this.shownName}}
        hr(:class="{hidden: !this.isFileSelected}")
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { readFileFromInput } from "../support/file-reader";
@Component({})
export default class EntryFileInput extends Vue {
    @Prop({ default: false }) public disabled!: boolean;
    @Prop({ default: false }) public readFile!: boolean;
    @Prop({ default: false }) public isUsingEmbedded!: boolean;

    public shownName: string = "";
    public isFileSelected: boolean = false;

    public clickSelectionAction() {
        this.chooseFile();
    }

    @Watch("isUsingEmbedded")
    public watchIsUsingEmbedded(newValue: boolean) {
        if (newValue) {
            this.isFileSelected = false;
        }
    }

    public filesUpdated(e: any) {
        const fileName = this.getFileName();
        if (fileName) {
            this.isFileSelected = true;
            this.shownName = fileName;
            console.log(this.readFile);
            if (this.readFile) {
                const component = this;
                readFileFromInput(this.input!.files![0], (content: string) => {
                    const emitResult = component.$emit("file-content", content);
                });
            }
        }
    }

    public get selectionLabel(): string {
        if (this.isFileSelected) {
            return "Change input file";
        } else {
            return "Select input file";
        }
    }

    private get input() {
        const input = this.$refs["file-input"] as HTMLInputElement;
        return input;
    }

    private getFileName() {
        const input = this.input;
        if (input && input.files) {
            return input.files[0].name;
        } else {
            return null;
        }
    }

    private resetInput() {
        const input = this.input;
        if (input) {
            this.isFileSelected = false;
            input.value = "";
            this.shownName = "";
        }
    }

    private chooseFile() {
        const input = this.input;
        if (input) {
            input.click();
        }
    }
}
</script>


<style lang="scss" scoped>
.file-selection {
    width: auto;
    .selection-action {
        margin-bottom: 1em;
    }
    label {
        font-size: 16px;
    }
    hr {
        margin-top: 1em;
        margin-bottom: 2em;
        width: 50%;
    }
    .selected-file {
        margin-left: 2em;
        background-color: $dark-transparent-color;
        border-radius: 4px;
        padding: 8px 16px;
        color: $dark-transparent-text;
    }
    input {
        display: none;
    }
}
</style>

