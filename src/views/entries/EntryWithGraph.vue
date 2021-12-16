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
            #pathing-graph(:class="{hidden: !showGraph}" ref="graph")
                
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";

import {isGraphCommunicatorMessage} from "../../entries/graphCommunication";

import {Edge, Network} from "vis-network";
import {DataSet} from "vis-data";

@Component({
    components: {
        BaseMessageTemplate
    }
})
export default class EntryWithGraph extends Vue {

@Prop({required: false, default: undefined}) public messageHandlerSetter?: (sender: MessageSender) => void;
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    private showGraph = false;
    private network: Network | null = null;
    private animate = false;
    private nodes!: DataSet<{ color: string; id: number; label: string; }, "id">;
    private edges!: DataSet<Edge, "id">;

    private reset() {
        this.showGraph = false;
        this.network = null;
    }
    private async messageHandler(message: any): Promise<void> {
        if (!isGraphCommunicatorMessage(message)) {
            throw new Error("Invalid message");
        }
        switch (message.type) {
            case "setup":
                this.showGraph = true;
                this.nodes = new DataSet(message.nodes.map((n) => ({
                    ...n
                })));

                this.edges = new DataSet<Edge>(message.edges);

                const container = this.$refs.graph as HTMLElement | undefined;
                if (!container) {
                    throw new Error("Could not find container");
                }
                const data = {
                    nodes: this.nodes,
                    edges: this.edges
                };

                this.network = new Network(container, data, {
                    interaction: {
                        zoomView: false
                    }
                });
                break;
            
            case "change-node-color":
                this.changeColor(message.id, message.color);
                break;
            
            case "add-node":
                this.nodes.add(message.node);
                break;
            
            case "add-edge":
                this.edges.add(message.edge);
                break;
            
            case "change-edge-color":
                const edge = this.edges.get(message.id)!;
                edge.color = message.color;
                this.edges.update(edge);
                break;
            
            case "remove-node":
                this.nodes.remove(message.id);
                break;

            case "remove-edge":
                this.edges.remove(message.id);
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
