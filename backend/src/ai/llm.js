import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';

/**
 * Single place that knows how to build an LLM client.
 * Swap providers with LLM_PROVIDER in .env — nothing else changes.
 */
export function getLLM({ temperature = 0 } = {}) {
  const provider = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error(
      'LLM_API_KEY is not set. AgentGuard needs a real LLM for both the target agent ' +
        'and the audit workflow. Copy .env.example to .env and add your key.'
    );
  }

  if (provider === 'openai') {
    return new ChatOpenAI({
      apiKey,
      model: process.env.LLM_MODEL || 'gpt-4o',
      temperature,
    });
  }

  if (provider === 'groq') {
    return new ChatGroq({
      apiKey,
      // llama-3.3-70b-versatile and llama-3.1-8b-instant both support tool
      // calling, which the target agent and every audit node depend on.
      model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
      temperature,
    });
  }

  return new ChatAnthropic({
    apiKey,
    model: process.env.LLM_MODEL || 'claude-sonnet-4-5',
    temperature,
    maxTokens: 2048,
  });
}

export function llmConfigured() {
  return Boolean(process.env.LLM_API_KEY);
}

export function llmInfo() {
  return {
    provider: process.env.LLM_PROVIDER || 'anthropic',
    model: process.env.LLM_MODEL || 'claude-sonnet-4-5',
    configured: llmConfigured(),
  };
}