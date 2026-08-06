import { Image } from "astro:assets";
import BackpropExplorer from "./BackpropExplorer.astro";
import Callout from "./Callout.astro";
import Figure from "./Figure.astro";
import Sidenote from "./Sidenote.astro";
import Stage from "./Stage.astro";
import Video from "./Video.astro";

// Components in this registry are available in every MDX article without imports.
export const contentComponents = {
  BackpropExplorer,
  Callout,
  Figure,
  Image,
  Sidenote,
  Stage,
  Video,
};
