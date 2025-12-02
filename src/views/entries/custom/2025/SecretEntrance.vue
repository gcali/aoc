<template lang="pug">
MessageTemplateWithPauseAndRun(
    :title="title"
    :id="id"
    :year="year"
    :entry="entry"
    :messageHandler="messageHandler"
    :additionalReset="reset"
)
    .secret-entrance(v-if="initialized")
        .clock
            .indicator(:style="{transform: `rotate(${calculatedRotation()}deg)`}" :class="{match: isMatch}")
    .rotation-name(v-if="initialized") {{rotationName}}
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../../../entries/entry";
import MessageTemplateWithPauseAndRun from "../MessageTemplateWithPauseAndRun.vue";
import { setTimeoutAsync } from "../../../../support/async";
import { isSecretEntranceMessage } from "../../../../entries/single-entries/2025/secret-entrance/communication";

@Component({
    components: {
        MessageTemplateWithPauseAndRun
    }
})
export default class SecretEntrance extends Vue {

    @Prop({required: false, default: undefined}) public messageHandlerSetter?: (sender: MessageSender) => void;
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;


    private rotation = 0;
    private isMatch = false;
    private rotationName: string = "test";
    private initialized = false;

    private calculatedRotation() {
        return this.rotation/100 * 360;
    }

    private reset() {
        this.rotationName = "";
        this.rotation = 0;
        this.isMatch = false;
        this.initialized = false;
    }

    private async messageHandler(message: any): Promise<void> {
        if (!isSecretEntranceMessage(message)) {
            throw new Error("Invalid message: " + JSON.stringify(message));
        }
        switch (message.type) {
            case "rotation":
                this.rotation += message.rotation;
                this.isMatch = message.isMatch;
                break;

            case "name":
                this.rotationName = message.name;
                break;
            
            case "init":
                this.initialized = true;
                break;
        }
    }

}
</script>


<style lang="scss" scoped>
.rotation-name {
    align-self: center;
}
.secret-entrance {
    border: 1px solid grey;
    margin-top: 1em;
        background-color: #d3d3d32e;
    color: rgba(255, 255, 255, 0.9);
    padding: 1em 2em;
    align-self: center;
    .clock {
        width: calc(min(10em, 50vw));
        height: calc(min(10em, 50vw));
        position: relative;
        border-radius: 50%;
        border: 1px solid black;
        background-color: #252934;
    }
    .indicator {
        background-color: white;
        height: calc(min(5em, 25vw));
        width: 0.1em;
        position: absolute;
        left: 50%;
        transform-origin: bottom;
        //transform: rotate(90deg);
        //transition-duration: .01s;
        //transition-property: transform;
        &.match {
            background-color: green;
        }
    }
    .output {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        max-width: 20em;
    }
    .code {
        &::-webkit-scrollbar {
            display: none;
        }
        margin-top: 1em;
        position: relative;
        max-height: 20em;
        overflow-y: scroll;
        border: 1px solid white;
        background-color: black;
        padding-top: 1em;
        box-sizing: border-box;
        padding: 1em 2em;
        word-break: break-all;
        .code-token {
            display: inline;
            &.matched {
                color: lightseagreen;
            }
        }
    }
}
</style> 
