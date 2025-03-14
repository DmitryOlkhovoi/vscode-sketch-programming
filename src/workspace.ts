import * as vscode from 'vscode';
import * as path from "path";
import * as fs from "fs/promises";
import { pathToFileURL } from "url";
import OpenAI from 'openai';
import Storage from './storage';
import { Config } from './types';

class Workspace {
    assistant: any
    private openAiClient: OpenAI | null = null;
    private storage: Storage | null = null;
    config: Config | null = null;

    public root: string;
    public isReady: boolean = false;

    constructor (root: string) {
        this.root = root;
    }

    async initialize() {
        await this.loadSketchConfig();
        
        if (this.config) {
            this.openAiClient = new OpenAI({ apiKey: this.config.openAIApiKey });
            this.storage = new Storage(this.openAiClient, this.config.openAIVectorStoreId);
        }
    }

    async loadSketchConfig() {
        try {
            console.log("Loading sketch config...");
            const configPath = path.join(this.root, "sketch", "sketch.config.js");

            await fs.access(configPath);

            const fileURL = pathToFileURL(configPath);
            const config = await import(fileURL.href); 

            this.config = config.default;
        } catch (error) {
            vscode.window.showErrorMessage(`Sketch-programming Workspace: ${this.root} - Error loading sketch config`);
            console.error(error, this.root);
        }
    }

    async transpile(content: string) {
        console.log("Transpiling...", this.config);
    }
}

export default Workspace;