import * as path from "path";
import * as fs from "fs/promises";
import * as vscode from 'vscode';
import { pathToFileURL } from "url";
import OpenAI from "openai";
import Storage from "./storage";
import Workspace from "./workspace";
import { findSketchProjectRoot } from "./utils";

const REGEX_FOR_SKETCH = /\/\/\s*@sketch:\s*([^\s]+)/i;

async function updateSketch(document: vscode.TextDocument, config: any) {
	const openAi = new OpenAI({ apiKey: config.openAIApiKey });
	const storage = new Storage(openAi, config.vectorStoreId);

	storage.uploadFile(document.uri.fsPath)
}

export async function activate(context: vscode.ExtensionContext) {
	console.log(vscode.workspace.workspaceFolders)
	console.log('Sketch Programming -- LLM Transpiler extension is now active!');

	const workspaces: Record<string, Workspace> = {};
	let sketchName: string | null = null;

	function updateSketchName(editor: vscode.TextEditor) {
		if (!editor) {
			return;
		}

		const documentText = editor.document.getText();
		const match = documentText.match(REGEX_FOR_SKETCH);

		if (match) {
			sketchName = match[1];
		} else {
			sketchName = null;
		}
	}

	function transpileSketch(document: vscode.TextDocument, config: any) {
		// const apiKey = config.openAIApiKey;
        // const openAI = new OpenAI({ apiKey });

        // const prompt = `Your sketch: ${document.fileName}\n\n${document.getText()}`;
        // const response = await openAI.Completion.create({
        //     engine: "davinci",
        //     prompt,
        //     maxTokens: 1000,
        //     temperature: 0.7,
        //     frequencyPenalty: 0.0,
        //     presencePenalty: 0.0,
        //     stop: ["\n"]
        // });

        // vscode.window.showInformationMessage(`Transpiled sketch:\n\n${response.choices[0].text}`);
        // console.log("Transpiled sketch:", response.choices[0].text);
	}

	vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
		if (editor) {
			updateSketchName(editor)
		}
	})

	vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
		if (vscode.window.activeTextEditor && !sketchName) {
			updateSketchName(vscode.window.activeTextEditor);
		}

		if (sketchName) {
			const root = await findSketchProjectRoot(document.uri.fsPath);

			if (root) {
				let currentWorkspace = workspaces[root];
				
				if (!currentWorkspace) {
                    workspaces[root] = currentWorkspace = new Workspace(root);
					await currentWorkspace.initialize();
                }
				
				currentWorkspace.transpile(document.getText());
            } else {
				vscode.window.showErrorMessage(`Sketch-programming Workspace: No config in the root`);
			}
		}
	});

	if (vscode.window.activeTextEditor) {
		updateSketchName(vscode.window.activeTextEditor);
	}
}

export function deactivate() {}
