<template lang="pug">
BaseMessageTemplate(
    :title="title",
    :id="id",
    :year="year",
    :entry="entry",
    :messageHandler="messageHandler",
    :additionalReset="reset"
)
    .graph
        .choices
            .title <b>Warning</b>: a lot of flashes during the animation
            .c
                label
                    input(type="checkbox", v-model="animate")
                    | Animate
        Graph(@setup="handleSetup($event)")
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { Entry, MessageSender } from "../../../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";

import { isPassagePathingMessage } from "../../../../entries/single-entries/2021/passage-pathing/communication";

import {
    GraphCommunicatorMessage,
    PrivateGraphCommunicatorMessage,
} from "../../../../entries/graphCommunication";

import Graph, { GraphSetupEvent } from "../../../../components/Graph.vue";

interface TicketData {
    id: number;
    value: number;
    label: string;
}
@Component({
    components: {
        BaseMessageTemplate,
        Graph,
    },
})
export default class PassagePathing extends Vue {
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    private animate = false;

    private graphMessageSender?: MessageSender;

    private reset: () => void = () => {};

    private handleSetup(event: GraphSetupEvent) {
        this.reset = event.reset;
        this.graphMessageSender = event.messageSender;
    }

    private sendMessage(message: PrivateGraphCommunicatorMessage) {
        if (!this.graphMessageSender) {
            throw new Error("Graph message sender not setup");
        }
        this.graphMessageSender({
            ...message,
            kind: "GraphCommunicatorMessage",
        } as GraphCommunicatorMessage);
    }

    private async messageHandler(message: any): Promise<void> {
        if (!isPassagePathingMessage(message)) {
            throw new Error("Invalid message");
        }
        switch (message.type) {
            case "setup":
                // this.showGraph = true;
                message.animateCallback(this.animate);
                this.sendMessage({
                    type: "setup",
                    nodes: message.nodes.map((n) => ({
                        ...n,
                        color: "white",
                    })),
                    edges: message.edges.map((e, i) => ({
                        ...e,
                        id: i,
                        color: "white",
                    })),
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
        this.sendMessage({
            type: "change-node-color",
            id,
            color,
        });
    }
}
</script>

<style lang="scss">
#pathing-graph {
    height: 400px;
}
</style>