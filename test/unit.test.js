import { describe, it, expect } from 'vitest';

function parseStats(stdout) {
  let modelOutput = stdout;
  let statsString = '';
  try {
    const result = JSON.parse(stdout);
    modelOutput = result.response || '';
    if (result.stats && result.stats.models) {
      let promptTokens = 0;
      let candidateTokens = 0;
      let totalTokens = 0;
      let cachedTokens = 0;
      for (const modelKey in result.stats.models) {
        const m = result.stats.models[modelKey];
        if (m.tokens) {
          promptTokens += m.tokens.prompt || 0;
          candidateTokens += m.tokens.candidates || 0;
          totalTokens += m.tokens.total || 0;
          cachedTokens += m.tokens.cached || 0;
        }
      }
      statsString = `, ${totalTokens} tokens (${promptTokens}i / ${candidateTokens}o`;
      if (cachedTokens > 0) {
        statsString += `, ${cachedTokens} cached`;
      }
      statsString += ')';
    }
  } catch (e) {}
  return { modelOutput, statsString };
}

describe('Parsing Logic', () => {
  it('should correctly parse token stats', () => {
    const stdout = JSON.stringify({
      response: "Test response",
      stats: {
        models: {
          "model-1": { tokens: { prompt: 10, candidates: 5, total: 15, cached: 0 } }
        }
      }
    });
    const { modelOutput, statsString } = parseStats(stdout);
    expect(modelOutput).toBe("Test response");
    expect(statsString).toBe(", 15 tokens (10i / 5o)");
  });

  it('should handle multiple models and cached tokens', () => {
    const stdout = JSON.stringify({
      response: "Test",
      stats: {
        models: {
          "m1": { tokens: { prompt: 10, candidates: 5, total: 15, cached: 5 } },
          "m2": { tokens: { prompt: 20, candidates: 10, total: 30, cached: 0 } }
        }
      }
    });
    const { statsString } = parseStats(stdout);
    expect(statsString).toBe(", 45 tokens (30i / 15o, 5 cached)");
  });
});
