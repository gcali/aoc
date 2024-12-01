<template lang="pug">
BaseMessageTemplate(
    :title="title"
    :id="id"
    :year="year"
    :entry="entry"
    :messageHandler="messageHandler"
    :additionalReset="reset"
)
    .historian-hysteria
        .first-part(v-if="visiblePairEntries.length > 0")
            .pair-entries
                .pair-entry(v-for="(entry, index) in visiblePairEntries" :key="index")
                    .left {{ entry[0] }}
                    .right {{ entry[1] }}
                    .delta(v-if="entry[2] !== null") {{ entry[2] }}
            .counter {{ counter }}
        .second-part(v-if="lookupEntries.length > 0")
            .current-entry {{  currentEntry }}
            .lookup-entries
                .lookup-entry(v-for="(entry, index) in lookupEntries" :key="index" :class="{'is-active': entry.active}") {{ entry.amount }}
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";
import { setTimeoutAsync } from "../../../../support/async";
import { isHistorianHysteriaMessage } from "../../../../entries/single-entries/2024/historian-hysteria/communication";

type Lookup = {value: number, amount: number, active: boolean};

const windowSize = 10;
@Component({
    components: {
        BaseMessageTemplate
    }
})
export default class HistorianHysteria extends Vue {

    @Prop({required: false, default: undefined}) public messageHandlerSetter?: (sender: MessageSender) => void;
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    private visiblePairEntries: [number, number, number][] = [];
    private counter = 0;

    private lookupEntries: Lookup[] = [];
    private currentEntry: number = 0;
    private lastLookup: Lookup | null = null;

    private reset() {
        this.counter = 0;
        this.visiblePairEntries = [];
        this.lookupEntries = [];
        this.currentEntry = 0;
        this.lastLookup = null;
    }


    private async handleNewPair(pair: [number, number], delta: number) {
        if (this.visiblePairEntries.length > windowSize) {
            this.visiblePairEntries.shift();
        }
        this.visiblePairEntries.push([...pair, delta]);
        this.counter += delta;
    }

    private async handleLookupEntriesSetup(entries: {value: number, amount: number}[]) {
        this.lookupEntries = entries.map(e => ({value: e.value, amount: e.amount, active: false}));
    }

    private async handleLookableEntry(entry: number) {
        this.currentEntry = entry;
        const lookupEntry = this.lookupEntries.find(e => e.value === entry);
        if (this.lastLookup) {
            this.lastLookup.active = false;
        }
        if (lookupEntry) {
            lookupEntry.active = true;
            this.lastLookup = lookupEntry;
        } else {
            this.lastLookup = null;
        }
    }


    private async messageHandler(message: any): Promise<void> {
        if (!isHistorianHysteriaMessage(message)) {
            throw new Error("Invalid message");
        }
        switch (message.type) {
            case "NewPairEntry":
                await this.handleNewPair(message.pair, message.delta)
                break;

            case "SetupLookup":
                await this.handleLookupEntriesSetup(message.lookupEntries);
                break;

            case "SendLookableEntry":
                await this.handleLookableEntry(message.entry);
        }
    }

}
</script>


<style lang="scss" scoped>
.calibrations {
    padding-top: 1em;
}
.calibration {
    .token.valid {
        border: 1px solid navajowhite;
    }
    .token.selected {
        border: 1px solid salmon;
    }
}

        // .scratch-card
        //     .header
        //         .card-id Card {{ card.id }}
        //         .score {{ card.score }}
        //     .left
        //         .cell(v-for="cell in card.win" :id="cell.id") {{ cell.value }}
        //     .right
        //         .cell(v-for="cell in card.mine" :id="cell.id") {{ cell.value }}
.historian-hysteria {
    display: flex;
    align-items: flex-start;
    .first-part {
        display: contents;
    }
    .second-part {
        display: block;
    }
    .lookup-entries {
        display: flex;
        flex-wrap: wrap;
        font-size: 6px;
        .lookup-entry {
            padding: 1px 2px;
            margin: 1px;
            min-width: 1em;
            box-sizing: border-box;
            text-align: center;
            border: 1px solid transparent;
            border-radius: 6px;
            &.is-active {
                border: 1px solid greenyellow;
            }
        }

    }
    .pair-entries {
        display: grid;
        grid-template-columns: 3fr 3fr 3fr;
        width: 12em;
        // max-width: 30em;
        // min-width: 15em;
        .pair-entry {
            display: contents;
        }
    }
}
.scratch-card {
    display: grid;
    grid-template-columns: 3fr 8fr;
    .header {
        grid-column: 1 / span 2;
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid black;
    }
    .header, .cell-wrapper {
        padding: 0.2em 0.5em;

    }
    .cell-wrapper {
        display: grid;
        grid-template-rows: repeat(5, auto);
        grid-auto-flow: column;
        position: relative;
        .cell {
            position: relative;
        }
        .cell span {
            box-sizing: border-box;
            padding-left: 1px;
            padding-top: 1px;
        }
    }
    .selector {
        position: absolute;
        width: 1em;
        height: 1em;
        border: 1px solid indigo;
        border-radius: 1px;
        transition: left 0.01s, top 0.01s;
        visibility: hidden;
    }
    .left {
        border-right: 1px solid black;
    }
    max-width: 100%;
    box-sizing: border-box;
    width: 40em;
    border: 1px solid white;
    margin-top: 1em;
    background-color: lightgoldenrodyellow;
    color: black;
    padding: 1em;
    font-family: Courier;
}
</style> 
