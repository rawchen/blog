// 表情包配置 - bilibili风格
// 路径: /src/assets/images/smilies/bilibili/

// 表情代码到图片文件名的映射
export const SMILIES_MAP = {
  ':mrgreen:': 'icon_mrgreen.png',
  ':neutral:': 'icon_neutral.png',
  ':twisted:': 'icon_twisted.png',
  ':arrow:': 'icon_arrow.png',
  ':shock:': 'icon_eek.png',
  ':smile:': 'icon_smile.png',
  ':???:': 'icon_confused.png',
  ':cool:': 'icon_cool.png',
  ':evil:': 'icon_evil.png',
  ':grin:': 'icon_biggrin.png',
  ':idea:': 'icon_idea.png',
  ':oops:': 'icon_redface.png',
  ':razz:': 'icon_razz.png',
  ':roll:': 'icon_rolleyes.png',
  ':wink:': 'icon_wink.png',
  ':cry:': 'icon_cry.png',
  ':eek:': 'icon_surprised.png',
  ':lol:': 'icon_lol.png',
  ':mad:': 'icon_mad.png',
  ':sad:': 'icon_sad.png',
  ':!:': 'icon_exclaim.png',
  ':?:': 'icon_question.png',
  // 扩展表情
  ':guzhang:': 'guzhang.png',
  ':ok:': 'ok.png',
  ':chigua:': 'chigua.png',
  ':waizui:': 'waizui.png',
  ':keguazi:': 'keguazi.png',
}

// 表情代码列表（按显示顺序）
export const SMILIES_LIST = [
  ':mrgreen:',
  ':neutral:',
  ':twisted:',
  ':arrow:',
  ':shock:',
  ':smile:',
  ':???:',
  ':cool:',
  ':evil:',
  ':grin:',
  ':idea:',
  ':oops:',
  ':razz:',
  ':roll:',
  ':wink:',
  ':cry:',
  ':eek:',
  ':lol:',
  ':mad:',
  ':sad:',
  ':!:',
  ':?:',
  ':guzhang:',
  ':ok:',
  ':chigua:',
  ':waizui:',
  ':keguazi:',
]

// 获取表情图片URL
export const getSmilieUrl = (code) => {
  const filename = SMILIES_MAP[code]
  if (!filename) return null
  // 使用Vite的静态资源导入方式
  return `/src/assets/images/smilies/bilibili/${filename}`
}

// 解析文本中的表情代码，替换为图片标签
export const parseSmilies = (text) => {
  if (!text) return ''

  // 创建正则表达式匹配所有表情代码
  const codes = Object.keys(SMILIES_MAP)
  // 需要对特殊字符进行转义
  const escapedCodes = codes.map(code => code.replace(/[?!]/g, '\\$&'))
  const regex = new RegExp(escapedCodes.join('|'), 'g')

  return text.replace(regex, (match) => {
    const filename = SMILIES_MAP[match]
    if (filename) {
      return `<img class="smilies-img" src="/src/assets/images/smilies/bilibili/${filename}" alt="${match}" title="${match}" style="max-width:30px;display:inline-block;vertical-align:middle;margin:2px;" />`
    }
    return match
  })
}