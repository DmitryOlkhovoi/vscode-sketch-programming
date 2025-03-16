import * as path from "path";
import * as fs from "fs/promises";
import * as vscode from 'vscode';
import { pathToFileURL } from "url";
import OpenAI from "openai";
import Storage from "./storage";
import Workspace from "./workspace";
import { findSketchProjectRoot } from "./utils";
import ProjectInit from "./projectInit";

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
	const transpiling = new Set<string>();
	const isTranspilingDirty = new Set<string>();
	let sketchName: string | null = null;
	let root: string | undefined;

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

	async function updateRoot(editor: vscode.TextEditor) {
		if (!editor) {
			return;
		}

		root = await findSketchProjectRoot(editor.document.uri.fsPath);
	}

	const initializeCommand = vscode.commands.registerCommand('sketch-programming--llm-transpiler.initialize', async () => {
        const projectInit = new ProjectInit();
        await projectInit.copyExampleProjectFiles();
    });

	const currentRootCommand = vscode.commands.registerCommand('sketch-programming--llm-transpiler.currentRoot', async () => {
		if (vscode.window.activeTextEditor) {
			await updateRoot(vscode.window.activeTextEditor);
		}

		vscode.window.showInformationMessage(`Sketch-programming Extension: Current root: ${root || 'No root found, start editing your Sketch files.'}`);
    });

    context.subscriptions.push(initializeCommand);
    context.subscriptions.push(currentRootCommand);

	vscode.window.onDidChangeActiveTextEditor((editor: vscode.TextEditor | undefined) => {
		if (editor) {
			updateSketchName(editor)
			console.log(`Sketch-programming Extension: onDidChangeActiveTextEditor Active sketch - ${sketchName}`)

			if (sketchName) {
				updateRoot(editor);
			}
		}
	})

	vscode.workspace.onWillSaveTextDocument(async ({ document }) => {
		console.log(`Sketch-programming Extension: onDidSaveTextDocument - ${document.uri.fsPath}, isDirty: ${document.isDirty}, isTranspiling: ${transpiling.has(document.uri.fsPath)}, isTranspilingDirty: ${isTranspilingDirty.has(document.uri.fsPath)}`)
		
		if (transpiling.has(document.uri.fsPath)) {
			isTranspilingDirty.add(document.uri.fsPath);
			
			vscode.window.showErrorMessage(`Sketch-programming Extension: onDidSaveTextDocument - ${document.uri.fsPath} is not transpiled yet. This onSave event is ignored.`);
			return
		}

		if (!document.isDirty && !isTranspilingDirty.has(document.uri.fsPath)) {
			return
		}

		console.log(`Sketch-programming Extension: Will save document - ${document.uri.fsPath}`)
		
		if (vscode.window.activeTextEditor && !sketchName) {
			updateSketchName(vscode.window.activeTextEditor);
		}

		if (sketchName) {
			if (!root) {
				await updateRoot(vscode.window.activeTextEditor!);
			}

			if (root) {
				console.log(`Sketch-programming Extension: Config found in the root`);
				let currentWorkspace = workspaces[root];
				
				if (!currentWorkspace) {
                    workspaces[root] = currentWorkspace = new Workspace(root);
					await currentWorkspace.initialize();
                }

				try {
					transpiling.add(document.uri.fsPath)
					isTranspilingDirty.delete(document.uri.fsPath);
					const traspiledCode = await currentWorkspace.transpile(document.getText());

					if (traspiledCode) {
						console.log(`Sketch-programming Extension: transpiled code - ${traspiledCode}`);
						currentWorkspace.saveFile(document, traspiledCode);
					}
				} catch (error) {
					isTranspilingDirty.add(document.uri.fsPath);
					vscode.window.showErrorMessage(`Sketch-programming Extension: Error transpiling code (${document.uri.fsPath}) - ${error}`);
				} finally {
					transpiling.delete(document.uri.fsPath);
				}
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
