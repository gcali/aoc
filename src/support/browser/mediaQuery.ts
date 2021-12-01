import { MediaQuery } from "../../entries/entry";

export default {
    isMobile() {
        const ua = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(ua);
        return isMobile;
    }
};
