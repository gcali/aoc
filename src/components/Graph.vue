<template lang="pug">
.graph-wrapper
    .title(v-if="title") {{ title }}
    .graph(ref="graph", :class="{ hidden: !edges }")
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";

import { isGraphCommunicatorMessage } from "../entries/graphCommunication";

import { MessageSender } from "../entries/entry";

export type GraphSetupEvent = {
    messageSender: MessageSender;
    reset: () => void;
};

@Component({})
export default class Graph extends Vue {
    private title: string | null = null;

    public mounted() {
        this.$emit("setup", {
            messageSender: this.messageHandler,
            reset: this.reset,
        } as GraphSetupEvent);
    }

    private reset() {
    }

    private async messageHandler(message: any): Promise<void> {
        if (!isGraphCommunicatorMessage(message)) {
            return;
        }
        return;
    }
}
</script>
<style lang="scss" scoped>
.graph {
    height: 400px;
}
</style>