<template lang="pug">
.entry-choice(:class="{hidden: hidden}")
    label.question {{label}}
    .choices(v-if="!isLast")
        label 
            input(type="radio", value="first", v-model="choice", :disabled="disabled")
            | First
        label 
            input(type="radio", value="second", v-model="choice", :disabled="disabled")
            | Second
    button(@click="show", :disabled="disabled") Execute
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
@Component({})
export default class EntryChoice extends Vue {
    @Prop({ default: false }) public hidden!: boolean;
    @Prop({ default: false }) public disabled!: boolean;
    @Prop({required: true}) public date!: number;
    private choice: string = "first";
    public get isLast() {
        return this.date === 25;
    }
    public get label() {
        return this.isLast ? "" : "Which entry?";
    }
    public show() {
        const emitResult = this.$emit("execute", this.choice);
    }
}
</script>

<style lang="scss" scoped>
.entry-choice {
    display: flex;
    align-items: center;
    .question {
        margin-right: 1em;
    }
    label {
        margin-right: 0.5em;
    }
    .choices {
        margin-right: 1em;
        display: flex;
        flex-wrap: wrap;
    }
}
</style>
