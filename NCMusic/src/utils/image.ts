/**
 * 网易云音乐图片 CDN 裁剪工具
 * 通过在 URL 后追加 ?param=WxH 实现服务端实时裁剪
 * 示例: https://p1.music.126.net/xxx.jpg?param=200y200
 */

export function cropImageUrl(url: string, width: number, height: number): string {
  if (!url) return ''
  // 已经带参数的 URL，用 & 拼接
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}param=${width}y${height}`
}

// 预设尺寸，覆盖项目中的所有图片场景
export const IMG_SIZE = {
  PLAYLIST_COVER: { w: 220, h: 220 },   // MusicHall 推荐歌单封面
  NEW_SONG_COVER: { w: 164, h: 164 },   // MusicHall 新歌封面 (82px CSS × 2 DPR)
  SINGER_AVATAR: { w: 160, h: 160 },    // MusicHall 歌手头像
  MY_PLAYLIST_COVER: { w: 300, h: 300 },// MyMusic 歌单封面
  PLAYER_COVER: { w: 440, h: 440 },     // Player 播放页封面 (220px CSS × 2 DPR)
  USER_AVATAR: { w: 64, h: 64 },        // 顶部用户头像
} as const
