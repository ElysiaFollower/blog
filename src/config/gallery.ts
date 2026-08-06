import type { ImageMetadata } from "astro";
import coverCylien from "../assets/demo/cover-cylien.webp";
import coverGeometry from "../assets/demo/cover-geometry.webp";
import coverMeme from "../assets/demo/cover-meme.webp";
import coverMiku from "../assets/demo/cover-miku.webp";
import coverSeele from "../assets/demo/cover-seele.webp";
import elysiaPoster from "../assets/demo/elysia-logo.webp";
import elysiaPortrait from "../assets/demo/elysia-portrait.webp";
import alienTraveler from "../assets/demo/gallery/alien-traveler.webp";
import alienTravelerTwo from "../assets/demo/gallery/alien-traveler-two.webp";
import aponiaTear from "../assets/demo/gallery/aponia-tear.webp";
import azureGirl from "../assets/demo/gallery/azure-girl.webp";
import butterflyDream from "../assets/demo/gallery/butterfly-dream.webp";
import daughterOfSea from "../assets/demo/gallery/daughter-of-sea.webp";
import elysiaFireworks from "../assets/demo/gallery/elysia-fireworks.webp";
import elysiaGirl from "../assets/demo/gallery/elysia-girl.webp";
import elysiaHall from "../assets/demo/gallery/elysia-hall.webp";
import elysiaInBloom from "../assets/demo/gallery/elysia-in-bloom.webp";
import elysiaKiss from "../assets/demo/gallery/elysia-kiss.webp";
import elysiaNumber02 from "../assets/demo/gallery/elysia-number-02.webp";
import elfElysia from "../assets/demo/gallery/elf-elysia.webp";
import goldenMoment from "../assets/demo/gallery/golden-moment.webp";
import journey from "../assets/demo/gallery/journey.webp";
import kianaInLight from "../assets/demo/gallery/kiana-in-light.webp";
import lifeIsWilderness from "../assets/demo/gallery/life-is-wilderness.webp";
import littleThief from "../assets/demo/gallery/little-thief.webp";
import lostMemories from "../assets/demo/gallery/lost-memories.webp";
import magicalElysia from "../assets/demo/gallery/magical-elysia.webp";
import marryTheWorld from "../assets/demo/gallery/marry-the-world.webp";
import mobiusInfinite from "../assets/demo/gallery/mobius-infinite.webp";
import moment from "../assets/demo/gallery/moment.webp";
import newYear from "../assets/demo/gallery/new-year.webp";
import pardoSummer from "../assets/demo/gallery/pardo-summer.webp";
import pardoTeacher from "../assets/demo/gallery/pardo-teacher.webp";
import princess from "../assets/demo/gallery/princess.webp";
import seeleChess from "../assets/demo/gallery/seele-chess.webp";
import seeleGuard from "../assets/demo/gallery/seele-guard.webp";
import seeleHeartWhite from "../assets/demo/gallery/seele-heart-white.webp";
import seeleLove from "../assets/demo/gallery/seele-love.webp";
import seeleSpring from "../assets/demo/gallery/seele-spring.webp";
import shatteredStars from "../assets/demo/gallery/shattered-stars.webp";
import silverwingSlash from "../assets/demo/gallery/silverwing-slash.webp";
import student from "../assets/demo/gallery/student.webp";
import summerPardo from "../assets/demo/gallery/summer-pardo.webp";
import towardTomorrow from "../assets/demo/gallery/toward-tomorrow.webp";
import trioConcert from "../assets/demo/gallery/trio-concert.webp";
import yoimiya from "../assets/demo/gallery/yoimiya.webp";
import yoimiyaTwo from "../assets/demo/gallery/yoimiya-two.webp";
import sparklePortrait from "../assets/demo/sparkle-portrait.webp";

export interface GalleryImage {
  src: ImageMetadata;
  alt: string;
}

export const galleryImages: GalleryImage[] = [
  { src: elysiaPortrait, alt: "花园茶会中的爱莉希雅" },
  { src: trioConcert, alt: "三人演唱会的舞台瞬间" },
  { src: coverGeometry, alt: "纵向构图的几何主题插画" },
  { src: seeleLove, alt: "暮色中的希儿" },
  { src: pardoSummer, alt: "夏日海边的帕朵菲莉丝" },
  { src: kianaInLight, alt: "站在光中的琪亚娜" },
  { src: coverMiku, alt: "蓝紫色调的初音未来插画" },
  { src: elysiaInBloom, alt: "如飞花般绚丽的少女" },
  { src: moment, alt: "被定格的战斗刹那" },
  { src: seeleSpring, alt: "春日花野中的希儿" },
  { src: marryTheWorld, alt: "白色殿堂中的爱莉希雅" },
  { src: coverSeele, alt: "希儿主题插画" },
  { src: lostMemories, alt: "失却的追忆" },
  { src: mobiusInfinite, alt: "无限的梅比乌斯" },
  { src: elysiaPoster, alt: "粉色甜心小姐主题海报" },
  { src: lifeIsWilderness, alt: "奔向旷野与天空" },
  { src: alienTraveler, alt: "异星旅人的合影" },
  { src: coverMeme, alt: "生成式模型概念图" },
  { src: journey, alt: "跨越荒野的征途" },
  { src: sparklePortrait, alt: "花火主题插画" },
  { src: towardTomorrow, alt: "向着明天并肩前行" },
  { src: coverCylien, alt: "昔涟与柔和光影构成的插画" },
  { src: shatteredStars, alt: "星星粉碎时的模样" },
  { src: elysiaFireworks, alt: "烟花下的爱莉希雅" },
  { src: summerPardo, alt: "夏日里的帕朵菲莉丝" },
  { src: butterflyDream, alt: "蝴蝶与眼睛构成的梦幻画面" },
  { src: princess, alt: "公主主题的角色插画" },
  { src: azureGirl, alt: "湛蓝色调的少女" },
  { src: elysiaNumber02, alt: "金色天幕下并肩前行" },
  { src: student, alt: "学生时代的午后" },
  { src: littleThief, alt: "小贼猫主题插画" },
  { src: seeleHeartWhite, alt: "白色背景下比心的希儿" },
  { src: goldenMoment, alt: "献给黄金的此刻" },
  { src: elfElysia, alt: "妖精爱莉主题插画" },
  { src: yoimiya, alt: "夏日与烟花气息中的宵宫" },
  { src: seeleGuard, alt: "希儿守护的瞬间" },
  { src: alienTravelerTwo, alt: "异星旅人的另一段记录" },
  { src: magicalElysia, alt: "魔法少女爱莉希雅" },
  { src: pardoTeacher, alt: "帕朵老师开课啦" },
  { src: daughterOfSea, alt: "海的女儿" },
  { src: elysiaKiss, alt: "爱莉希雅的飞吻" },
  { src: seeleChess, alt: "棋子意象中的希儿" },
  { src: elysiaHall, alt: "殿堂之中的爱莉希雅" },
  { src: newYear, alt: "新年聚会的热闹时刻" },
  { src: silverwingSlash, alt: "次生银翼挥刃的瞬间" },
  { src: elysiaGirl, alt: "粉色外套的少女" },
  { src: aponiaTear, alt: "阿波尼亚落泪的瞬间" },
  { src: yoimiyaTwo, alt: "宵宫的夏日侧影" },
];
