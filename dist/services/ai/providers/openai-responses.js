import { BaseAIProvider, applySafeExtraParams } from "./base-provider.js";
import { AISessionManager } from "../session/ai-session-manager.js";
import { ToolSchemaConverter } from "../tools/tool-schema.js";
import { log } from "../../logger.js";
export class OpenAIResponsesProvider extends BaseAIProvider {
    aiSessionManager;
    constructor(config, aiSessionManager) {
        super(config);
        this.aiSessionManager = aiSessionManager;
    }
    getProviderName() {
        return "openai-responses";
    }
    supportsSession() {
        return true;
    }
    async executeToolCall(systemPrompt, userPrompt, toolSchema, sessionId) {
        let session = await this.aiSessionManager.getSession(sessionId, "openai-responses");
        if (!session) {
            session = await this.aiSessionManager.createSession({
                provider: "openai-responses",
                sessionId,
            });
        }
        let conversationId = session.conversationId;
        let currentPrompt = userPrompt;
        let iterations = 0;
        const maxIterations = this.config.maxIterations ?? 5;
        const iterationTimeout = this.config.iterationTimeout ?? 30000;
        while (iterations < maxIterations) {
            iterations++;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), iterationTimeout);
            try {
                const tool = ToolSchemaConverter.toResponsesAPI(toolSchema);
                const requestBody = {
                    model: this.config.model,
                    input: currentPrompt,
                    tools: [tool],
                };
                if (conversationId) {
                    requestBody.conversation = conversationId;
                }
                else {
                    requestBody.instructions = systemPrompt;
                }
                if (this.config.extraParams) {
                    applySafeExtraParams(requestBody, this.config.extraParams);
                }
                const response = await fetch(`${this.config.apiUrl}/responses`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.config.apiKey}`,
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                if (!response.ok) {
                    const errorText = await response.text().catch(() => response.statusText);
                    log("OpenAI Responses API error", {
                        provider: this.getProviderName(),
                        model: this.config.model,
                        status: response.status,
                        error: errorText,
                        iteration: iterations,
                    });
                    return {
                        success: false,
                        error: `API error: ${response.status} - ${errorText}`,
                        iterations,
                    };
                }
                const data = (await response.json());
                conversationId = data.conversation || conversationId;
                if (iterations === 1) {
                    const userSeq = (await this.aiSessionManager.getLastSequence(session.id)) + 1;
                    await this.aiSessionManager.addMessage({
                        aiSessionId: session.id,
                        sequence: userSeq,
                        role: "user",
                        content: userPrompt,
                    });
                }
                const toolCall = this.extractToolCall(data, toolSchema.function.name);
                if (toolCall) {
                    await this.aiSessionManager.updateSession(sessionId, "openai-responses", {
                        conversationId,
                    });
                    return {
                        success: true,
                        data: this.validateResponse(toolCall),
                        iterations,
                    };
                }
                currentPrompt = this.buildRetryPrompt(data);
            }
            catch (error) {
                clearTimeout(timeout);
                if (error instanceof Error && error.name === "AbortError") {
                    return {
                        success: false,
                        error: `API request timeout (${this.config.iterationTimeout}ms)`,
                        iterations,
                    };
                }
                return {
                    success: false,
                    error: String(error),
                    iterations,
                };
            }
        }
        return {
            success: false,
            error: `Max iterations (${this.config.maxIterations}) reached without tool call`,
            iterations,
        };
    }
    extractToolCall(data, expectedToolName) {
        if (!data.output || !Array.isArray(data.output)) {
            return null;
        }
        for (const item of data.output) {
            if (item.type === "function_call" && item.name === expectedToolName) {
                if (item.arguments) {
                    try {
                        const parsed = JSON.parse(item.arguments);
                        return parsed;
                    }
                    catch (error) {
                        log("Failed to parse function call arguments", {
                            error: String(error),
                            toolName: item.name,
                            arguments: item.arguments,
                        });
                        return null;
                    }
                }
                else {
                    log("Function call found but no arguments", {
                        toolName: item.name,
                        callId: item.call_id,
                    });
                }
            }
        }
        return null;
    }
    buildRetryPrompt(data) {
        let assistantResponse = "";
        if (data.output && Array.isArray(data.output)) {
            for (const item of data.output) {
                if (item.type === "message" && item.content) {
                    assistantResponse =
                        typeof item.content === "string" ? item.content : JSON.stringify(item.content);
                    break;
                }
            }
        }
        return `Previous response: ${assistantResponse}\n\nPlease use the save_memories tool to extract and save the memories from the conversation as instructed.`;
    }
    validateResponse(data) {
        if (!data || typeof data !== "object") {
            throw new Error("Response is not an object");
        }
        if (Array.isArray(data)) {
            throw new Error("Response cannot be an array");
        }
        const keys = Object.keys(data);
        if (keys.length === 0) {
            throw new Error("Response object is empty");
        }
        for (const key of keys) {
            if (data[key] === undefined || data[key] === null) {
                throw new Error(`Response field '${key}' is null or undefined`);
            }
        }
        return data;
    }
}
