<template lang="pug">
.graph-wrapper
    .title(v-if="title") {{ title }}
    .graph(ref="graph", :class="{ hidden: !edges }")
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

import { isGraphCommunicatorMessage } from "../entries/graphCommunication";

import { Edge, Network } from "vis-network";
import { DataSet } from "vis-data";
import { MessageSender } from "../entries/entry";

export type GraphSetupEvent = {
    messageSender: MessageSender;
    reset: () => void;
};

@Component({})
export default class Graph extends Vue {
    private network: Network | null = null;
    private title: string | null = null;
    private nodes: DataSet<
        { color: string; id: number; label: string },
        "id"
    > | null = null;
    private edges: DataSet<Edge, "id"> | null = null;

    public mounted() {
        this.$emit("setup", {
            messageSender: this.messageHandler,
            reset: this.reset,
        } as GraphSetupEvent);
    }

    private reset() {
        this.network = null;
    }
    private async messageHandler(message: any): Promise<void> {
        if (!isGraphCommunicatorMessage(message)) {
            return;
        }
        switch (message.type) {
            case "setup":
                console.log(this);
                this.nodes = new DataSet(
                    message.nodes.map((n) => ({
                        ...n,
                    }))
                );

                this.edges = new DataSet<Edge>(message.edges);

                const container = this.$refs.graph as HTMLElement | undefined;
                if (!container) {
                    throw new Error("Could not find container");
                }
                const data = {
                    nodes: this.nodes,
                    edges: this.edges,
                };

                this.network = new Network(container, data, {
                    interaction: {
                        zoomView: false,
                    },
                    layout: {
                        improvedLayout: false,
                    },
                });
                break;

            case "change-node-color":
                this.changeColor(message.id, message.color);
                break;

            case "add-node":
                this.hardNodes.add(message.node);
                break;

            case "add-edge":
                this.hardEdges.add(message.edge);
                break;

            case "change-edge-color":
                const edge = this.hardEdges.get(message.id)!;
                edge.color = message.color;
                this.hardEdges.update(edge);
                break;

            case "remove-node":
                this.hardNodes.remove(message.id);
                break;

            case "remove-edge":
                this.hardEdges.remove(message.id);
                break;
            case "title":
                this.title = message.title;
                break;
        }
    }

    private get hardEdges(): typeof Graph.prototype.edges & DataSet<any> {
        if (!this.edges) {
            throw new Error("Setup not called");
        }
        return this.edges;
    }

    private get hardNodes(): typeof Graph.prototype.nodes & DataSet<any> {
        if (!this.nodes) {
            throw new Error("Setup not called");
        }
        return this.nodes;
    }

    private changeColor(id: number, color: string) {
        const node = this.hardNodes.get(id)!;
        node.color = color;
        this.hardNodes.update(node);
    }
}
</script>
<style lang="scss" scoped>
.graph {
    height: 400px;
}
</style>