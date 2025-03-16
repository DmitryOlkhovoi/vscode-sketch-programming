import { AssistantCreateParams } from "openai/resources/beta/assistants.mjs";

export interface Config {
    openAIApiKey: string;
    projectId: string;
    assistantName?: string;
    vectorStoreName?: string;
    assistantCreateParams?: AssistantCreateParams;
}