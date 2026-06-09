// AI 聊天接口服务 (通过 Vite 代理连接本地 Ollama)
const BASE_URL = '/api/ollama'
const MODEL = 'qwen3.5:9b'

export async function chatWithAI(messages) {
  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `你是一个专业的网易云音乐AI助手。
当用户需要你推荐歌曲或歌单时，你必须严格以 JSON 格式返回你的推荐结果。不要在 JSON 外附加任何文字。
如果用户的需求不是推荐音乐，请正常使用文字回答。

【必须遵守的 JSON 格式规范】：
{
  "type": "recommendation",
  "text": "这是对用户需求的简短文字回应或推荐语",
  "songs": [
    { "name": "歌曲名", "artist": "歌手名(可选)", "reason": "为什么推荐这首歌(简短)" }
  ]
}

示例：
{
  "type": "recommendation",
  "text": "为你找到以下几首适合深夜放松的歌曲，希望能陪伴你度过宁静的夜晚：",
  "songs": [
    { "name": "反方向的钟", "artist": "周杰伦", "reason": "经典的 R&B 节奏，带有一丝怀旧的伤感" },
    { "name": "夜的第七章", "artist": "周杰伦", "reason": "华丽的暗黑古典风，适合夜深人静时细细品味" }
  ]
}`
          },
          ...messages
        ],
        stream: false,
        options: {
          temperature: 0.3
        }
      })
    })

    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`)
    }

    const data = await response.json()
    const content = data.message.content

    // 尝试解析是否为 JSON (可能是带有 markdown 标记的 json)
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      const jsonString = jsonMatch ? jsonMatch[1] : content
      const parsedData = JSON.parse(jsonString)

      if (parsedData.type === 'recommendation') {
        return {
          type: 'recommendation',
          text: parsedData.text,
          songs: parsedData.songs || [],
          content: content
        }
      }
    } catch (e) {
      // 不是合法的 JSON，当作普通文本返回
    }

    return {
      type: 'text',
      content: content
    }
  } catch (error) {
    console.error('AI Chat Error:', error)
    return {
      type: 'error',
      content: '抱歉，无法连接到本地大模型，请检查 Ollama 是否已启动。'
    }
  }
}
