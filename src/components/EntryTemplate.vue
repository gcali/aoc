<template lang="pug">
    div.wrapper
        EntryTitle(:date="id", :name="title", :year="year")
        EntryInput(
            :key="$route.path"
            @file-loaded="fileLoaded"
            :disabled="disabled" 
            :entryKey="entryKey" 
            :year="year"
            :date="id" 
            :isExample="isExample"
            :hasFixedInput="hasFixedInput"
        )
        slot
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit } from "vue-property-decorator";
import EntryTitle from "@/components/EntryTitle.vue";
import EntryInput from "@/components/EntryInput.vue";
import { EntryFileHandling } from "../entries/entry";
import { updateYear } from "../state/state";
@Component({
    components: {
        EntryTitle,
        EntryInput
    }
})
export default class EntryTemplate extends Vue {
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop({ default: false }) public disabled!: boolean;
    @Prop({ required: true }) public year!: string;
    @Prop({required: false, default: false}) public noInput!: boolean;
    @Prop({required: true}) public entryKey!: string;
    @Prop({default: false}) public isExample!: boolean;
    @Prop({default: false}) public hasFixedInput!: boolean;
    @Emit("file-loaded")
    public fileLoaded(fileHandling: EntryFileHandling) {
        return fileHandling;
    }

    public mounted() {
        updateYear(this.year);
    }

    public updated() {
        updateYear(this.year);
    }
}
</script>


<style lang="scss" scoped>
.wrapper {
    display: flex;
    flex-direction: column;
}
</style>


