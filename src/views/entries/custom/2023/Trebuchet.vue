<template lang="pug">
    BaseMessageTemplate(
        :title="title"
        :id="id"
        :year="year"
        :entry="entry"
        :messageHandler="messageHandler"
        :additionalReset="reset"
    )
        .calibrations(v-if="showCalibrations")
            .calibration(v-for="calibration in visibleCalibrations" :key="calibration.id")
                span.token(v-for="token in calibration.tokens" :key="token.id" :class="{valid: token.isValid && token.isActive, selected: token.isSelected && token.isActive}") {{ token.value }}
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";
import { isTrebuchetMessage } from "../../../../entries/single-entries/2023/trebuchet/communication";

interface CalibrationData {
    id: number;
    tokens: TokenData[];
}

interface TokenData {
    id: number;
    value: string;
    isValid: boolean;
    isSelected: boolean;
    isActive: boolean;
}

const windowSize = 10;
@Component({
    components: {
        BaseMessageTemplate
    }
})
export default class TrebuchetView extends Vue {

@Prop({required: false, default: undefined}) public messageHandlerSetter?: (sender: MessageSender) => void;
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    private showCalibrations = false;
    private calibrationData: CalibrationData[] = [];

    private visibleCalibrations: CalibrationData[] = [];

    private reset() {
        this.showCalibrations = false;
        this.calibrationData.length = 0;
        this.visibleCalibrations.length = 0;
    }
    private async messageHandler(message: any): Promise<void> {
        if (!isTrebuchetMessage(message)) {
            throw new Error("Invalid message");
        }
        this.showCalibrations = true;
        switch (message.type) {
            case "setup":
                this.calibrationData = message.lines.map((n, i) => {
                    return {
                        id: i,
                        tokens: n.map((t, j) => ({
                            id: j,
                            value: t.token,
                            isValid: t.isValid,
                            isActive: false,
                            isSelected: t.isSelected
                        }))
                    };
                });
                break;
            case "activate":
                const line = message.selected;
                this.calibrationData[line].tokens.forEach(t => t.isActive = true);
                if (this.visibleCalibrations.length >= windowSize) {
                    this.visibleCalibrations.shift();
                }
                this.visibleCalibrations.push(this.calibrationData[line]);
                
                break;
        }
        // this.showTicket = true;
        // switch (message.type) {
        //     case "setup":
        //         this.ticketData = message.ticket.map((n, i) => {
        //             return {
        //                 id: i,
        //                 value: n,
        //                 label: ""
        //             };
        //         });
        //         break;
        //     case "label":
        //         this.ticketData[message.index].label = message.label;
        //         break;
        // }
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
.ticket {
    max-width: 100%;
    width: 40em;
    border: 1px solid white;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    box-shadow: 4px 9px 3px 1px #607D8B;
    margin-top: 1em;
    background-color: lightgoldenrodyellow;
    color: black;
    padding: 1em;
    font-family: Courier;
    .title {
        font-weight: bold;
        font-size: 120%;
        flex-basis: 100%;
        margin-bottom: 1em;
    }
    .ticket-field {
        flex-grow: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0.2em 1em;
        // margin: 0.2em 1em;
        border: 1px solid black;
        margin-top: -0.75px;
        margin-left: -0.75px;
        // .label {
        //     max-width: 9em;
        // }
        .value {
            &.highlighted {
                border: 1px dashed black;
            }
            text-align: center;
            // display: flex;
            // flex-direction: row;
            // align-items: flex-end;
            // justify-content: flex-end;
            font-weight: bold;
        }
    }
}
</style> 
