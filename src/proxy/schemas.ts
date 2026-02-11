import { z } from "zod";

const TextContentBlock = z.object({
  type: z.literal("text"),
  text: z.string(),
  cache_control: z.unknown().optional(),
});

const ThinkingContentBlock = z.object({
  type: z.literal("thinking"),
  thinking: z.string(),
  signature: z.string().optional(),
});

const ImageSourceBlock = z.object({
  type: z.literal("base64").optional(),
  media_type: z.string(),
  data: z.string(),
});

const ImageContentBlock = z.object({
  type: z.literal("image"),
  source: ImageSourceBlock,
});

const ToolUseContentBlock = z.object({
  type: z.literal("tool_use"),
  id: z.string(),
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
});

const ToolResultContentBlock = z.object({
  type: z.literal("tool_result"),
  tool_use_id: z.string().optional(),
  content: z.union([z.string(), z.array(z.unknown())]),
  is_error: z.boolean().optional(),
});

const ContentBlock = z.discriminatedUnion("type", [
  TextContentBlock,
  ThinkingContentBlock,
  ImageContentBlock,
  ToolUseContentBlock,
  ToolResultContentBlock,
]);

const MessageContent = z.union([z.string(), z.array(ContentBlock)]);

const Message = z.object({
  role: z.enum(["user", "assistant"]),
  content: MessageContent,
});

const SystemBlock = z.object({
  type: z.literal("text"),
  text: z.string(),
  cache_control: z.unknown().optional(),
});

const ToolDefinition = z.object({
  name: z.string(),
  description: z.string().optional(),
  input_schema: z.unknown().optional(),
  cache_control: z.unknown().optional(),
});

export const ClaudeRequestSchema = z.object({
  model: z.string(),
  messages: z.array(Message),
  system: z.array(SystemBlock).optional(),
  tools: z.array(ToolDefinition).optional(),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  stream: z.boolean().optional(),
  thinking: z.unknown().optional(),
  metadata: z
    .object({
      user_id: z.string().optional(),
    })
    .passthrough()
    .optional(),
});

export const CapturedLogSchema = z.object({
  id: z.number(),
  timestamp: z.string(),
  method: z.string(),
  path: z.string(),
  model: z.string().nullable(),
  sessionId: z.string().nullable(),
  parsedRequest: ClaudeRequestSchema.nullable(),
  rawRequestBody: z.string().nullable(),
  responseStatus: z.number().nullable(),
  responseText: z.string().nullable(),
  inputTokens: z.number().nullable(),
  outputTokens: z.number().nullable(),
  elapsedMs: z.number().nullable(),
  streaming: z.boolean(),
});

export type ClaudeRequest = z.infer<typeof ClaudeRequestSchema>;
export type CapturedLog = z.infer<typeof CapturedLogSchema>;
export type ContentBlockType = z.infer<typeof ContentBlock>;
export type MessageType = z.infer<typeof Message>;
