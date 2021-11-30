<template lang="pug">
.title
    .date {{ fullDate }}
        a.link.small(:href="link", target="_blank")
            font-awesome-icon(icon="link")
    .name {{ name }}
        a.link.big(:href="link", target="_blank")
            font-awesome-icon(icon="link")
    hr
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { ordinalOf } from "../support/string";
@Component({})
export default class EntryTitle extends Vue {
    @Prop() private date!: number;
    @Prop() private name!: string;
    @Prop() private year!: string;
    private get fullDate() {
        return `December ${ordinalOf(this.date)}, ${this.year}`;
    }

    private get link() {
        return `https://adventofcode.com/${this.year}/day/${this.date}`;
    }
}
</script>

<style lang="scss" scoped>
.title {
    align-self: stretch;
    margin-bottom: 3em;
    .date {
        font-size: 15px;
    }
    .name {
        line-height: 2;
        font-size: 30px;
    }
    .link {
        margin-left: 0.5em;
        color: $dark-transparent-color;
        font-size: 80%;
        @include small-screen {
            font-size: 100%;
        }
        display: inline-block;
        &.small {
            display: none;
            @include small-screen {
                display: inline-block;
            }
        }
        &.big {
            @include small-screen {
                display: none;
            }
        }
        &:hover {
            color: $dark-transparent-text;
        }
    }
    hr {
        border-style: solid;
    }
}
</style>
