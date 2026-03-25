import Anthropic from '@anthropic-ai/sdk'

/**
 * Strip markdown code fences from Claude responses before JSON.parse.
 * Claude often wraps JSON in ```json ... ``` despite being told not to.
 */
export function extractJson(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  return raw.trim()
}

/**
 * Call Claude with optional web search support.
 * Handles multi-turn tool_use loops and 429 rate-limit retries automatically.
 */
export async function callClaude(
  anthropic: Anthropic,
  prompt: string,
  options: { maxTokens?: number; useWebSearch?: boolean } = {}
): Promise<string> {
  const { maxTokens = 2048, useWebSearch = false } = options

  const tools: any[] = useWebSearch ? [{ type: 'web_search_20250305', name: 'web_search' }] : []

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: prompt },
  ]

  for (let turn = 0; turn < 8; turn++) {
    const response = await callWithRetry(anthropic, {
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      ...(tools.length > 0 ? { tools } : {}),
      messages,
    })

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    if (response.stop_reason === 'end_turn') {
      return text
    }

    if (response.stop_reason === 'tool_use') {
      // For built-in tools like web_search_20250305, Anthropic handles execution
      // server-side. Just continue the conversation — do NOT send tool_result blocks
      // (sending empty results would tell Claude its searches returned nothing).
      messages.push({ role: 'assistant', content: response.content })
    } else {
      return text
    }
  }

  return ''
}

/**
 * Wrap a single API call with up to 3 retries on 429 rate-limit errors.
 * Respects the retry-after header when present, otherwise uses exponential backoff.
 */
async function callWithRetry(
  anthropic: Anthropic,
  params: Anthropic.MessageCreateParamsNonStreaming
): Promise<Anthropic.Message> {
  const MAX_RETRIES = 3

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await anthropic.messages.create(params) as Anthropic.Message
    } catch (err: any) {
      const isRateLimit = err?.status === 429
      if (!isRateLimit || attempt === MAX_RETRIES) throw err

      // Parse retry-after header (seconds) or fall back to exponential backoff
      const retryAfterHeader = err?.headers?.['retry-after']
      const waitMs = retryAfterHeader
        ? parseInt(retryAfterHeader, 10) * 1000
        : Math.min(60000, 5000 * Math.pow(2, attempt))

      console.warn(`[callClaude] Rate limited. Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}...`)
      await sleep(waitMs)
    }
  }

  // Unreachable but satisfies TypeScript
  throw new Error('callWithRetry exhausted all attempts')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
