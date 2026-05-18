// 表情包配置 - bilibili风格
// 路径: /src/assets/images/smilies/bilibili/

// 导入所有表情图片（Vite glob 导入）
const smilieImages = import.meta.glob('../assets/images/smilies/bilibili/*.png', { eager: true, import: 'default' })

// 获取表情图片URL
const getSmilieImgUrl = (filename) => {
  const key = `../assets/images/smilies/bilibili/${filename}`
  return smilieImages[key] || ''
}

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

  let result = text

  // 替换表情代码为实际图片URL
  Object.entries(SMILIES_MAP).forEach(([code, filename]) => {
    const imgUrl = getSmilieImgUrl(filename)
    const escapedCode = code.replace(/[?!]/g, '\\$&')
    const regex = new RegExp(escapedCode, 'g')
    result = result.replace(regex, `<img class="smilies-img" src="${imgUrl}" alt="${code}" title="${code}" style="max-width:30px;display:inline-block;vertical-align:middle;margin:-5px 0px 0px 0px;" />`)
  })

  return result
}

// 解析链接，将URL转换为可点击的a标签
export const parseLinks = (text) => {
  if (!text) return ''
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

// 解析表情和链接（先解析链接再解析表情）
export const renderSmilies = (text) => {
  if (!text) return ''
  let result = parseLinks(text)
  return parseSmilies(result)
}