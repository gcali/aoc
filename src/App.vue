<template lang="pug">
#app
    Navbar(:entryByYears="entryByYears")
    #content
        router-view
</template>

<script lang="ts">
import Year from "./components/Year.vue";
import Navbar from "./components/Navbar.vue";
import { Component, Vue } from "vue-property-decorator";
import { entryList, EntryRoute } from "./entries/entryList";
import { baseState, updateYear } from "./state/state";
@Component({
    components: {
        Navbar,
    },
})
export default class App extends Vue {
    private entryByYears: { [key: string]: EntryRoute[] } | null = null;
    public created() {
        this.entryByYears = entryList;
    }
}
</script>


<style lang="scss">
@import "style/global.scss";

body {
    margin: 0;
    background-color: $dark-color;
    color: $text-color;
    #app {
        display: flex;
        flex-direction: row;
        font-family: "Avenir", Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        // color: $dark-color;
        min-height: 100vh;
        @include small-screen {
            flex-direction: column;
            // min-height: unset;
        }
    }
    #content {
        flex: 1 1 auto;
        padding: 2em;
        max-height: 100%;
        // color: $dark-color;
        display: flex;
        flex-direction: column;
    }
}
</style>
