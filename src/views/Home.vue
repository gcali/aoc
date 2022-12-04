<template lang="pug">
  .home.unselectable
    .falling-star(
        v-for="(star, index) in stars" 
        :style="{left: star.left+'%', animationDuration: star.duration+'s', animationDelay: -star.delay+'s'}"
    )
        .rotating-star
            .animated-star
    //- | Solutions for the Advent of Code {{yearsByRow}}
    .title Solutions for the Advent of Code
    .year-tree
        .tree-floor
            .star *
        .tree-floor(v-for="(floorYears, index) in this.yearsByRow" :key="index")
            .year(v-for="(year, yearIndex) in floorYears" :key="yearIndex")
                router-link(v-if="year", :to="{name: 'entries'}")
                    div(@click="selectYear(year)").year-entry {{year}}
                .fake-year(v-else) 2020
        .tree-floor
            .year.tree-trunk
                div(v-if="years.length !== 7") 2020
                router-link(v-else :to="{name: 'entries'}")
                    div(@click="selectYear(years[0])").year-entry {{years[0]}}
</template>

<script lang="ts">
import Vue from "vue";
import { updateYear } from "../state/state";
import { randrange } from "../support/random";
export default Vue.extend({
    props: {
        years: Array as () => string[]
    },
    computed: {
        stars(): Array<{left: number; duration: number; delay: number}> {
            const result: Array<{left: number; duration: number; delay: number}> = [];
            for (let i = 0; i < 50; i++) {
                const left = randrange(0, 100);
                const duration = randrange(10, 50);
                const delay = randrange(0, duration);
                result.push({left, duration, delay});
            }
            return result;
        },
        yearsByRow() {
            const k = this.years.length;
            const biggestFloor = Math.ceil((-1 + Math.sqrt(1 + 8 * k)) / 2);
            const result: string[][] = [];
            const current = {
                floor: [] as string[],
                size: 1
            };
            let years = [...this.years].reverse();
            if (years.length === 7) {
                years = years.slice(0, 6);
            }
            for (const year of years) {
                current.floor.push(year);
                if (current.floor.length === current.size) {
                    result.push(current.floor);
                    current.floor = [];
                    current.size++;
                }
            }
            if (current.floor.length > 0) {
                let shouldPrepend = false;
                while (current.floor.length < current.size) {
                    if (shouldPrepend) {
                        current.floor.unshift("");
                    } else {
                        current.floor.push("");
                    }
                    shouldPrepend = !shouldPrepend;
                }
                result.push(current.floor);
            }
            return result;

        }
    },
    methods: {
        selectYear(year: string) {
            updateYear(year);
        }
    }

});
</script>

<style lang="scss" scoped>
.home {
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    @keyframes falling-star {
        from {
            top: 0;
        }
        to {
            top: 100%;
        }
    }
    @keyframes rotating-star {
        from {
            transform: rotate(0);
        } 
        to {
            transform: rotate(360deg);
        }
    }
    .animated-star {
        pointer-events: none;
        position: relative;
        color: white;
        transform: scale(2);
        @include small-screen {
            transform: none;
        }
        &:before {
            position: absolute;
            content: "*";
        }
    }
    .falling-star {
        position: absolute;
        animation-duration: 8s;
        animation-name: falling-star;
        animation-timing-function: linear;
        animation-iteration-count: infinite;
    }
    .rotating-star {
        animation-name: rotating-star;
        animation-duration: 20s;
        animation-iteration-count: infinite;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .star {
        pointer-events: none;
        color: yellow;
        font-size: xx-large;
        transform: scale(3);
        margin-bottom: -0.5em;
    }
    .title {
        display: flex;
        @include small-screen {
            color: transparent;
        }
        align-items: center;
        flex-grow: 1.5;
        margin-bottom: 1em;
        font-size: xx-large;
        font-weight: bold;
        text-align: center;
    }
}
.year-tree {
    flex-grow: 1.8;
    @include small-screen {
        flex-grow: 100;
    }
    display: flex;
    flex-direction: column;
    .tree-floor {
        flex-direction: row;
        display: flex;
        justify-content: center;
        .year {
            position: relative;
            border: 1px solid transparent;
            background-color: #7abc7c;
            color: white;
            padding: 1em 0.75em;;
            margin: 0.15em 0.15em;
            border-radius: 1px;
            a {
                color: white;
            }
            .fake-year {
                color: transparent;
            }
        }
        .tree-trunk {
            background-color: #b07b69;
            color: transparent;
        }
    }
}
.year-list {
    margin-top: 1em;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    flex-wrap: wrap;
    max-width: 30em;
    .year-entry {
        margin: 0em 1em;
        margin-bottom: 1em;
        &:first-child {
            margin-left: 0em;
        }
        border: 1px solid black;
        padding: 1em 2em;
        border-radius: 2px;
        box-shadow: 1px 1px 1px 0 lightgrey;
    }
}
</style>
