import Vue from "vue";
import App from "./App.vue";
import router from "./router";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faSnowman,
  faSnowflake,
  faHollyBerry,
  faGift,
  faCandyCane,
  faSleigh,
  faLink
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(
  faSnowman,
  faSnowflake,
  faHollyBerry,
  faGift,
  faCandyCane,
  faSleigh,
  faLink
);

Vue.component("font-awesome-icon", FontAwesomeIcon);

Vue.config.productionTip = false;

(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
