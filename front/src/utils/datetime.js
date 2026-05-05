// Format datetime to date only (yyyy-MM-dd HH:mm:ss -> yyyy-MM-dd)
function formatDate(datetime) {
    return datetime ? datetime.substring(0, 10) : ''
}