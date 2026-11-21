class AIAssistantService {
  constructor({ apiKey, model, maxImageAttachments, messageCooldownMs, maxOutputTokens, logger }) {
    this.apiKey = apiKey;
    this.model = model;
    this.maxImageAttachments = maxImageAttachments;
    this.messageCooldownMs = messageCooldownMs;
    this.maxOutputTokens = maxOutputTokens;
    this.logger = logger;
    this.cooldowns = new Map();
  }

  isConfigured() {
    return Boolean(this.apiKey);
  }

  formatReply(text) {
    const header = '# :robot: HELIOS bot AI support :robot:';
    return `${header}\n\n${text}`.trim();
  }

  async attachmentToInlineData(attachment) {
    const response = await fetch(attachment.url);
    if (!response.ok) {
      throw new Error(`Gemini image fetch failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      inline_data: {
        mime_type: attachment.contentType || 'image/png',
        data: Buffer.from(arrayBuffer).toString('base64')
      }
    };
  }

  getImageAttachments(attachments) {
    return [...attachments.values()]
      .filter((attachment) => attachment.contentType?.startsWith('image/') && attachment.url)
      .slice(0, this.maxImageAttachments);
  }

  shouldHandleMessage(message, config) {
    if (!config.aiEnabled || !this.isConfigured()) {
      return false;
    }

    const inAiChannel = config.aiChannelId && message.channelId === config.aiChannelId;
    const mentioned = message.mentions.users.has(message.client.user.id);
    return Boolean(inAiChannel || mentioned);
  }

  getCooldownKey(message) {
    return `${message.guildId}:${message.author.id}`;
  }

  getRemainingCooldown(message) {
    const key = this.getCooldownKey(message);
    const lastRequestAt = this.cooldowns.get(key);
    if (!lastRequestAt) {
      return 0;
    }

    const remaining = this.messageCooldownMs - (Date.now() - lastRequestAt);
    return Math.max(0, remaining);
  }

  startCooldown(message) {
    this.cooldowns.set(this.getCooldownKey(message), Date.now());
  }

  getUserFacingError(error) {
    const message = String(error?.message || '');

    if (message.includes('GEMINI_API_KEY')) {
      return 'GEMINI_API_KEY is missing on the host.';
    }

    if (message.includes('status 401')) {
      return 'The Gemini API key is invalid or expired.';
    }

    if (message.includes('status 403')) {
      return 'The Gemini API request was denied. Check project permissions and API access.';
    }

    if (message.includes('status 429')) {
      return 'The AI has temporarily reached a rate limit. Please try again shortly.';
    }

    if (message.includes('status 500') || message.includes('status 502') || message.includes('status 503')) {
      return 'Gemini is temporarily unavailable. Please try again later.';
    }

    if (message.includes('fetch failed') || message.includes('Gemini image fetch failed')) {
      return 'The host cannot reach Gemini or the image. Check that outbound internet/API traffic is allowed.';
    }

    return 'The AI assistant could not process this question right now. Check the AI configuration and try again.';
  }

  async requestGemini(parts) {
    let response;

    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts
            }
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: this.maxOutputTokens
          }
        })
      });
    } catch (error) {
      this.logger?.error('Gemini network request failed', { message: error.message });
      throw new Error(`fetch failed: ${error.message}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger?.error('Gemini request failed', {
        status: response.status,
        body: errorText.slice(0, 500)
      });
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts
      ?.filter((part) => typeof part.text === 'string')
      .map((part) => part.text)
      .join('\n')
      .trim() || '';

    return {
      text,
      finishReason: candidate?.finishReason || null
    };
  }

  async answerFiveMQuestion({ prompt, attachments = [], config, memberName, guildName }) {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    const parts = [
      {
        text: [
          'You are a Discord assistant for a FiveM community.',
          'Your job is to answer FiveM-related questions clearly and practically.',
          'If the message includes image attachments, inspect them and mention anything relevant you can see.',
          'If the image appears unrelated, corrupted, or unclear, say so honestly.',
          'If the question is outside FiveM, GTA roleplay communities, Discord community management, or the configured server info, politely say you are specialized in FiveM/community support.',
          'Reply in the same language as the user.',
          'Keep answers concise, helpful, and production-safe.',
          '',
          `Guild: ${guildName}`,
          `Member: ${memberName}`,
          config.fivemServerAddress ? `Configured FiveM address: ${config.fivemServerAddress}` : null,
          config.fivemConnectLabel ? `Connect label: ${config.fivemConnectLabel}` : null,
          '',
          'User request:',
          prompt
        ]
          .filter(Boolean)
          .join('\n')
      }
    ];

    for (const attachment of attachments) {
      parts.push(await this.attachmentToInlineData(attachment));
    }

    const firstPass = await this.requestGemini(parts);
    if (!firstPass.text) {
      return 'I could not generate an AI response at this time.';
    }

    if (firstPass.finishReason !== 'MAX_TOKENS') {
      return this.formatReply(firstPass.text);
    }

    const continuationParts = [
      {
        text: [
          'Continue the answer exactly where it stopped.',
          'Do not repeat the introduction.',
          'Finish the incomplete sentence first if needed.',
          'Keep the same language and tone.',
          '',
          'Original user request:',
          prompt,
          '',
          'Current partial answer:',
          firstPass.text
        ].join('\n')
      }
    ];

    const secondPass = await this.requestGemini(continuationParts);
    return this.formatReply(secondPass.text ? `${firstPass.text}\n${secondPass.text}`.trim() : firstPass.text);
  }
}

module.exports = { AIAssistantService };
