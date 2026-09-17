export interface ChatCompletionTool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: Record<string, any>;
            required: string[];
        };
    };
}
export interface ResponsesAPITool {
    type: "function";
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
}
export interface AnthropicTool {
    name: string;
    description: string;
    input_schema: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
}
export declare class ToolSchemaConverter {
    static toResponsesAPI(chatCompletionTool: ChatCompletionTool): ResponsesAPITool;
    static toAnthropic(chatCompletionTool: ChatCompletionTool): AnthropicTool;
    static fromChatCompletion(tool: ChatCompletionTool): {
        chatCompletion: ChatCompletionTool;
        responsesAPI: ResponsesAPITool;
        anthropic: AnthropicTool;
    };
}
//# sourceMappingURL=tool-schema.d.ts.map