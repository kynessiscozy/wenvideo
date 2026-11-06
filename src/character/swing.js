/** Swing猫师傅：猫号专属版唯一角色，金渐层猫师傅油画定妆。素材与人物定义同在一处，换图只改这里。 */
export const SWING = Object.freeze({
  id: 'swing',
  name: 'Swing猫师傅',
  camera: Object.freeze({ closeScale: 1.45, safeX: .5, safeInset: .05 }),
  assets: Object.freeze({
    portrait: Object.freeze({
      src: './art/swing-cinema3d.webp',
      alt: 'Swing猫师傅穿着深蓝卦纹道袍坐在书桌后，一爪按在铜八卦罗盘上',
      width: 768,
      height: 1365,
    }),
    blink: Object.freeze({ src: './art/swing-cinema3d-blink.webp', alt: '', width: 768, height: 1365, forPortrait: './art/swing-cinema3d.webp' }),
    speaking: Object.freeze({ src: './art/swing-cinema3d-speak.webp', alt: '', width: 768, height: 1365, forPortrait: './art/swing-cinema3d.webp' }),
    avatar: Object.freeze({ src: './art/swing-cinema3d-avatar.webp', alt: '', width: 192, height: 192 }),
  }),
  greeting: '',
  topics: Object.freeze([]),
});
