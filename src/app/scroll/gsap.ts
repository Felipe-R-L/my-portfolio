/**
 * The one place GSAP is imported and its plugins registered. Every scene
 * imports from here, so the plugins are registered exactly once.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(ScrollTrigger, Draggable, InertiaPlugin);

export { gsap, ScrollTrigger, Draggable, InertiaPlugin };
