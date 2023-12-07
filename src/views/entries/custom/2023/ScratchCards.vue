<template lang="pug">
    BaseMessageTemplate(
        :title="title"
        :id="id"
        :year="year"
        :entry="entry"
        :messageHandler="messageHandler"
        :additionalReset="reset"
    )
        .scratch-card(v-if="card")
            .header
                .card-id Card {{ card.id }}
                .score {{ card.score }}
            .left.cell-wrapper(ref="left")
                .cell(v-for="cell in card.win" :key="cell.id") 
                    span {{ cell.value }}
            .right.cell-wrapper(ref="right")
                .selector(ref="selector")
                .cell(v-for="cell in card.mine" :key="cell.id") 
                    span {{ cell.value }}
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";
import { CommunicatorScratchCard, isScratchCardsMessage } from "../../../../entries/single-entries/2023/scratch-cards/communicator";
import { setTimeoutAsync } from "../../../../support/async";

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

    private card: CommunicatorScratchCard | null = null;
    // {
    //     id: 1,
    //     score: "123",
    //     win: "5 37 16 3 56 11 23 72 7 8".split(" ").map((e, i) => ({
    //         value: parseInt(e, 10),
    //         id: i
    //     })),
    //     mine: "3 79 35 45 72 69 15 14 48 88 96 37 11 75 83 56 23 7 16 50 21 91 32 97 17"
    //         .split(" ").map((e, i) => ({
    //             value: parseInt(e, 10),
    //             id: i
    //         }))
    // };

    private nextCell: number | undefined = undefined;

    private cells: {
        win: HTMLDivElement[],
        mine: HTMLDivElement[]
     } = {win: [], mine: []};

    private reset() {
        this.card = null;
        return;
        const selector = this.$refs["selector"] as HTMLDivElement;
        const right = this.$refs["right"] as HTMLDivElement;
        const cells = [...right.querySelectorAll(".cell span")] as HTMLDivElement[];
        console.log(selector);
        const sizes = cells.map(e => e.getBoundingClientRect());
        const height = Math.max(...sizes.map(e => e.height));
        const width = Math.max(...sizes.map(e => e.width));
        selector.style.width = `${width}px`;
        selector.style.height = `${height}px`;
        selector.style.visibility = "hidden";
        const {top: baseTop, left: baseLeft} = right.getBoundingClientRect();
        const {top, left} = cells[0].getBoundingClientRect();
        selector.style.top = `${top - baseTop}px`;
        selector.style.left = `${left - baseLeft}px`;
        this.nextCell = 0;
        const iterate = () => {
            if (this.nextCell === undefined) {
                return;
            }
            if (this.nextCell < cells.length) {
                const cell = cells[this.nextCell];
                const {top: baseTop, left: baseLeft} = right.getBoundingClientRect();
                const {top, left} = cell.getBoundingClientRect();
                selector.style.top = `${top - baseTop}px`;
                selector.style.left = `${left - baseLeft}px`;
                selector.style.visibility = "visible";
                this.nextCell++;
                console.log("Updating to pos: " + JSON.stringify({top, left}));
                // setTimeout(iterate, 300);
            } else {
                this.nextCell = undefined;
                selector.ontransitionend = null;
            }
        }
        selector.ontransitionend = iterate;
        // setTimeout(iterate, 0);
        iterate();
        
    }

    private async handleSendCard(card: CommunicatorScratchCard, isSlow: boolean) {
        

        // alert(JSON.stringify(card));
        this.card = card;
        await setTimeoutAsync(0);
        this.selector().style.transition = isSlow ? 
            "left 0.1s, top 0.1s" :
            "left 0.01s, top 0.01s" ;
        const rightCells = this.right();
        const leftCells = this.$refs["left"] as HTMLDivElement;
        this.cells = {
            mine: [...rightCells.querySelectorAll(".cell span")] as HTMLDivElement[],
            win: [...leftCells.querySelectorAll(".cell span")] as HTMLDivElement[],
        };
        [this.cells.mine, this.cells.win].flat().forEach(cell => {
            cell.style.color = "";
            cell.style.border = "";
        });
        const sizes = this.cells.mine.map(e => e.getBoundingClientRect());
        const height = Math.max(...sizes.map(e => e.height));
        const width = Math.max(...sizes.map(e => e.width));
        const selector = this.$refs["selector"] as HTMLDivElement;
        selector.style.width = `${width}px`;
        selector.style.height = `${height}px`;
        selector.style.visibility = "hidden";
        selector.style.top = "0";
        selector.style.left = "0";
    }

    private right(): HTMLDivElement {
        return this.$refs["right"] as HTMLDivElement;
    }

    private selector(): HTMLDivElement {
        return this.$refs["selector"] as HTMLDivElement;
    }

    private async handleMoveSelector(id: number) {
        const cell = this.cells.mine[id];
        const {top: baseTop, left: baseLeft} = this.right().getBoundingClientRect();
        const {top, left} = cell.getBoundingClientRect();
        const selector = this.selector();
        selector.style.top = `${top - baseTop}px`;
        selector.style.left = `${left - baseLeft}px`;
        selector.style.visibility = "visible";
        await new Promise<void>((res) => selector.ontransitionend = () => res());
        // console.log("Updating to pos: " + JSON.stringify({top, left}));
    }

    public async handleSelectWin(mineId: number, winId: number) {
        [this.cells.mine[mineId], this.cells.win[winId]].forEach(cell => {
            cell.style.color = "green";
        })
        this.cells.mine[mineId].style.border = "1px solid green";
        // this.cells.win[winId].style.color = "green";
    }


    private async messageHandler(message: any): Promise<void> {
        if (!isScratchCardsMessage(message)) {
            throw new Error("Invalid message");
        }
        switch (message.type) {
            case "SendCard":
                await this.handleSendCard(message.card, message.isSlow);
                break;
            case "MoveSelector":
                await this.handleMoveSelector(message.id);
                break;
            case "SelectWin":
                await this.handleSelectWin(message.mineId, message.winId);
                break;
            case "SendScore":
                this.card!.score = message.score;
                break;
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
