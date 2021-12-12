<template lang="pug">
    BaseMessageTemplate(
        :title="title"
        :id="id"
        :year="year"
        :entry="entry"
        :messageHandler="messageHandler"
        :additionalReset="reset"
    )
        .graph
            .choices
                .title <b>Warning</b>: a lot of flashes during the animation
                .c
                    label
                        input(type="checkbox" v-model="animate")
                        | Animate
            #pathing-graph(:class="{hidden: !showGraph}" ref="graph")
                
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";

import {isPassagePathingMessage} from "../../../../entries/single-entries/2021/passage-pathing/communication";

import {Network} from "vis-network";
import {DataSet} from "vis-data";

interface TicketData {
    id: number;
    value: number;
    label: string;
}
@Component({
    components: {
        BaseMessageTemplate
    }
})
export default class PassagePathing extends Vue {

@Prop({required: false, default: undefined}) public messageHandlerSetter?: (sender: MessageSender) => void;
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    private showGraph = false;
    private network: Network | null = null;
    private animate = false;
    private nodes!: DataSet<{ color: string; id: number; label: string; }, "id">;

    private reset() {
        this.showGraph = false;
        this.network = null;
    }
    private async messageHandler(message: any): Promise<void> {
        if (!isPassagePathingMessage(message)) {
            throw new Error("Invalid message");
        }
        switch (message.type) {
            case "setup":
                this.showGraph = true;
                message.animateCallback(this.animate);
                this.nodes = new DataSet(message.nodes.map((n) => ({
                    ...n,
                    color: "white"
                })));

                const edges = new DataSet<any>(message.edges);

                // const container = document.getElementById("pathing-graph");
                const container = this.$refs.graph as HTMLElement | undefined;
                if (!container) {
                    throw new Error("Could not find container");
                }
                const data = {
                    nodes: this.nodes,
                    edges
                };

                this.network = new Network(container, data, {
                    interaction: {
                        zoomView: false
                    }
                });
                break;
            case "current":
                this.changeColor(message.node, "yellow");
                break;
            case "queue":
                this.changeColor(message.node, "red");
                break;
            case "visited":
                this.changeColor(message.node, "blue");
                break;
        }
    }


    private changeColor(id: number, color: string) {
        const node = this.nodes.get(id)!;
        node.color = color;
        this.nodes.update(node);
    }
}
</script>

<style lang="scss">
#pathing-graph {
    height: 400px;
}
</style>