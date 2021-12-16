<template lang="pug">
BaseMessageTemplate(
    :title="title",
    :id="id",
    :year="year",
    :entry="entry",
    :messageHandler="messageHandler",
    :additionalReset="reset"
)
    Graph(@setup="handleSetup($event)")
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { Entry, MessageSender } from "../../entries/entry";

import Graph, { GraphSetupEvent } from "../../components/Graph.vue";

import BaseMessageTemplate from "./custom/BaseMessageTemplate.vue";

@Component({
    components: {
        Graph,
        BaseMessageTemplate,
    },
})
export default class EntryWithGraph extends Vue {
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;

    private reset: () => void = () => {};

    private handleSetup(event: GraphSetupEvent) {
        this.reset = event.reset;
        this.messageHandler = event.messageSender;
    }

    private messageHandler: MessageSender = async () => {};
}
</script>

<style lang="scss">
#pathing-graph {
    height: 400px;
}
</style>
