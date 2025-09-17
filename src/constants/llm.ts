export const LLM_MODELS = {
  /** Only used for object generation */
  ANTHROPIC_CLAUDE_3_5_SONNET_20241022: "anthropic/claude-3.5-sonnet-20241022",
  /** Very good for content generation */
  ANTHROPIC_CLAUDE_SONNET_4: "anthropic/claude-sonnet-4",
  /** Small thinking model */
  OPENAI_GPT_4O_MINI: "openai/gpt-4o-mini",
  /** Big thinking model */
  OPENAI_GPT_4O: "openai/gpt-4o",
} as const;
