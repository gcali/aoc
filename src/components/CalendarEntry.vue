<template lang="pug">
    router-link(:to="{name: name}").calendar-cell.clickable
        .header 
            | {{ordinalDate}}
            //- .icon.left
            //-     font-awesome-icon(icon="sleigh")
            .icon.right.rotated-right
                font-awesome-icon(icon="gift")
            //- .icon.left.rotated-left
            //-     font-awesome-icon(icon="gift")
            //- .icon.left
            //-     font-awesome-icon(icon="snowflake")
        .title 
            | {{title}}
        .stars
            .star(v-for="star in starObjects" :key="star.key") 
                span(:style="{visibility: star.isFull ? 'visible' : 'hidden'}") ⭐
</template>

<script lang="ts">
import Vue from "vue";
import { baseState } from "../state/state";
import { ordinalOf } from "../support/string";
export default Vue.extend({
    props: {
        title: String,
        date: Number,
        name: String,
        stars: Number,
    },
    data() {
        return {
            dates: baseState.dates
        };
    },
    computed: {
        ordinalDate(): string {
            return ordinalOf(this.date);
        },
        starObjects(): Array<{key: number, isFull: boolean}> {
            return [...Array(2).keys()].map((i) => ({
                key: i,
                isFull: i < this.stars
            }));
        }

    }
});
</script>

<style scoped>
.calendar-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    /* border: 1px solid black; */
    border-radius: 3px;
    margin: 1em;
    overflow: hidden;
    text-decoration: none;
    position: relative;
    background-color: white;
}

.calendar-cell .header {
    padding-top: 0.5em;
    text-align: center;
    padding-bottom: 0.5em;
    background-color: #d21111;
    color: white;
    width: 100%;
    font-weight: bold;
    position: relative;
}

.calendar-cell .icon {
    position: absolute;
    top: 50%;
    /* top: 0.5em; */
    color: rgba(252,208,50,0.5);
    transform: translateY(-50%);
    font-size: 150%;
}

.calendar-cell .icon.right {
    right: 0.5em;
}
.calendar-cell .icon.left {
    left: 0.5em;
}
.calendar-cell .icon.rotated-right {
    transform: translateY(-50%) rotate(15deg) ;
}
.calendar-cell .icon.rotated-left {
    transform: translateY(-50%) rotate(-15deg) ;
}

.calendar-cell .title {
    /* border-top: 1px solid black; */
    width: 10em;
    text-align: center;
    padding: 1em;
    padding-bottom: 0.5em;
    margin-left: 0.5em;
    margin-right: 0.5em;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
}
.calendar-cell .stars {
    display: flex;
    align-items: center;
    padding-bottom: 1em;
}
</style>