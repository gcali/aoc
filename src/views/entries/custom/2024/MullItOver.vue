<template lang="pug">
BaseMessageTemplate(
    :title="title"
    :id="id"
    :year="year"
    :entry="entry"
    :messageHandler="messageHandler"
    :additionalReset="reset"
)
    .mull-it-over
        .output
            .result {{ result }}
            .write-enabled Write register: {{ writeEnabled }}
        .code(ref="domCode")
            .code-token(v-for="(codeToken, index) in codeTokens" ref="domTokens" :key="index" :class="{matched: codeToken.matched}") {{ codeToken.code }}
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import {
    Entry, MessageSender,
} from "../../../../entries/entry";
import BaseMessageTemplate from "../BaseMessageTemplate.vue";
import { setTimeoutAsync } from "../../../../support/async";
import { Match, isMullItOverMessage } from "../../../../entries/single-entries/2024/mull-it-over/communication";

@Component({
    components: {
        BaseMessageTemplate
    }
})
export default class MullItOver extends Vue {

    @Prop({required: false, default: undefined}) public messageHandlerSetter?: (sender: MessageSender) => void;
    @Prop() public title!: string;
    @Prop() public id!: number;
    @Prop() public entry!: Entry;
    @Prop() public year!: number;


    private result: number = 0;
    private codeTokens: {code: string, matched: boolean}[] = [];
    private code: string = "";
    private writeEnabled: boolean = true;
    private offset = 0;

    private reset() {
        this.codeTokens = [];
        this.offset = 0;
        this.result = 0;
        this.writeEnabled = true;
    }

    private async handleMatch(match: Match) {
        const tokenToChange = this.codeTokens.pop()!.code;
        const start = match.index - this.offset;
        const leading = tokenToChange.slice(0, start);
        const token = tokenToChange.slice(start, start + match.length);
        const remaining = tokenToChange.slice(start + match.length);
        if (leading) {
            this.codeTokens.push({code: leading, matched: false});
        }
        const index = this.codeTokens.length;
        this.codeTokens.push({code: token, matched: true});
        this.codeTokens.push({code: remaining, matched: false});
        this.offset = match.index + match.length;
        await setTimeoutAsync(0);
        const dom = this.$refs.domCode as HTMLDivElement;
        const tokenDom = (this.$refs.domTokens as any)[index] as HTMLDivElement;
        if (tokenDom && index % 2 === 0) {
            dom.scrollTop = tokenDom.offsetTop - dom.clientHeight/2;
        }
    }

    private async messageHandler(message: any): Promise<void> {
        if (!isMullItOverMessage(message)) {
            throw new Error("Invalid message: " + JSON.stringify(message));
        }
        switch (message.type) {
            case "code":
                this.codeTokens = [{matched: false, code: message.data}]
                break;

            case "enabled":
                this.writeEnabled = message.enabled;
                break;

            case "result":
                this.result = message.result;
                break;
            case "match":
                await this.handleMatch(message.match);
                break;
        }
    }

}
</script>


<style lang="scss" scoped>
.mull-it-over {
    border: 1px solid grey;
    margin-top: 1em;
    background-color: #323336;
    color: rgba(255, 255, 255, 0.9);
    padding: 1em 2em;
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
