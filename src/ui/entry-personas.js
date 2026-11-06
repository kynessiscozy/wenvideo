/* 漏斗引路人 → 主应用角色的唯一映射表（猫号专属版）。
 *
 * 本版本只有一个形象：Swing猫师傅。funnel.html 是 public/ 下的独立页面
 * （不能用 ES module 导入），所以它保留了一份很小的视频/立绘路径表；
 * 但「名字、语气、对应哪个 HOME_THEMES 角色」这类跨页语义只在这里定义一次。
 */
export const DEFAULT_PERSONA = 'swing';

export const FUNNEL_PERSONAS = Object.freeze({
  swing: Object.freeze({
    key: 'swing',
    name: 'Swing猫师傅',
    theme: 'swing',
    poster: './art/swing-lord.webp',
    video: './art/swing-invite.mp4?v=70',
    lead: '生日报来，本喵给你看猫格。',
    circle: '是猫师傅先替你圈出来的',
    hooksTitle: '猫 师 傅 先 说 三 句',
    byline: 'Swing猫师傅正在为你排盘…',
  }),
});

export function personaFor(trait) {
  return FUNNEL_PERSONAS[trait] || FUNNEL_PERSONAS[DEFAULT_PERSONA];
}

/** Funnel persona id → HOME_THEMES id. */
export function themeForPersona(trait) {
  return personaFor(trait).theme;
}
