// Format datetime to date only (yyyy-MM-dd HH:mm:ss -> yyyy-MM-dd)
function formatDate(datetime) {
    return datetime ? datetime.substring(0, 10) : ''
}

/**
 * 词义化时间（类似Typecho的dateWord）
 * @param {string|Date|number} from - 起始时间
 * @param {string|Date|number} now - 终止时间，默认当前时间
 * @returns {string}
 */
function dateWord(from, now) {
    if (!from) return ''

    const fromDate = new Date(from)
    const nowDate = now ? new Date(now) : new Date()
    const fromTime = fromDate.getTime()
    const nowTime = nowDate.getTime()
    const between = Math.floor((nowTime - fromTime) / 1000)

    // 同一天
    if (between >= 0 && between < 86400 && fromDate.getDate() === nowDate.getDate()) {
        if (between < 60) {
            if (between === 0) return '刚刚'
            return `${between}秒前`
        }
        if (between < 3600) {
            const min = Math.floor(between / 60)
            return `${min}分钟前`
        }
        const hour = Math.floor(between / 3600)
        return `${hour}小时前`
    }

    // 昨天
    const yesterday = new Date(nowDate)
    yesterday.setDate(yesterday.getDate() - 1)
    if (fromDate.getDate() === yesterday.getDate() &&
        fromDate.getMonth() === yesterday.getMonth() &&
        fromDate.getFullYear() === yesterday.getFullYear()) {
        const hours = String(fromDate.getHours()).padStart(2, '0')
        const minutes = String(fromDate.getMinutes()).padStart(2, '0')
        return `昨天 ${hours}:${minutes}`
    }

    // 一个星期内
    if (between > 0 && between < 604800) {
        const day = Math.floor(between / 86400)
        return `${day}天前`
    }

    // 同一年
    if (fromDate.getFullYear() === nowDate.getFullYear()) {
        return `${fromDate.getMonth() + 1}月${fromDate.getDate()}日`
    }

    // 不同年
    return `${fromDate.getFullYear()}年${fromDate.getMonth() + 1}月`
}

export { formatDate, dateWord }