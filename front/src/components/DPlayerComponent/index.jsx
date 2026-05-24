import React, { useMemo } from 'react'
import DPlayer from 'react-dplayer'

const DPlayerComponent = React.memo(function DPlayerComponent({ url, pic, danmu, autoplay, addition }) {
  const options = useMemo(() => ({
    video: {
      url: url,
      ...(pic ? { pic: pic } : {}),
    },
    autoplay: autoplay === 'true',
    ...(danmu === 'false' ? {} : { danmaku: { maximum: 0 } }),
    ...(addition ? { danmaku: { addition: [addition] } } : {}),
  }), [url, pic, danmu, autoplay, addition])

  return (
    <div className="dplayer-wrapper">
      <DPlayer options={options} />
    </div>
  )
})

export default DPlayerComponent
