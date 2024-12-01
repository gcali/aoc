<template lang="pug">
    BaseMessageTemplate(
        :title="title"
        :id="id"
        :year="year"
        :entry="entry"
        :messageHandler="messageHandler"
        :additionalReset="reset"
    )
        .grid(ref="grid")
                
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";
import { NotImplementedError } from "../../../../support/error";

import {defineGrid, extendHex } from "honeycomb-grid";


@Component({
    components: {
        BaseMessageTemplate
    }
})
export default class ConwayCubesView extends Vue {

@Prop({required: false, default: undefined}) public messageHandlerSetter?: (sender: MessageSender) => void;
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    public mounted() {
        // const grid = this.$refs.grid as HTMLElement;
        // grid.innerHTML = "";
        // const draw = SVG();
        // const Hex = extendHex({ size: 5 });
        // const Grid = defineGrid(Hex);
        // // get the corners of a hex (they're the same for all hexes created with the same Hex factory)
        // const corners = Hex().corners();
        // // an SVG symbol can be reused
        // const hexSymbol = draw.symbol()
        //     // map the corners' positions to a string and create a polygon
        //     .polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
        //     .fill("none")
        //     .stroke({ width: 1, color: "#999" });

        // // render 10,000 hexes
        // Grid.rectangle({ width: 100, height: 100 }).forEach((hex) => {
        //     const { x, y } = hex.toPoint();
        //     // use hexSymbol and set its position for each hex
        //     draw.use(hexSymbol).translate(x, y);
        // });
        // draw.addTo(grid);
    }

    private reset() {
    }
    private async messageHandler(message: any): Promise<void> {
    }


}
</script>


<style lang="scss" scoped>
.grid {
    display: flex;
    flex-direction: column;
    .header {
        display: flex;
        flex-direction: row;
    }
    .grid-output {
        display: flex;
        flex-direction: column;
        justify-content: center;
        font-family: monospace;
        .grid-line {
            display: flex;
            flex-direction: row;
            justify-content: center;
        }
    }
}
</style> 


