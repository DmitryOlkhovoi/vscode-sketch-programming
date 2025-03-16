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

// async function updateSketch(document: vscode.TextDocument, config: any) {
// 	const openAi = new OpenAI({ apiKey: config.openAIApiKey });
// 	const storage = new Storage(openAi, config.vectorStoreId);

// 	storage.uploadFile(document.uri.fsPath)
// }

export async function activate(context: vscode.ExtensionContext) {
	console.log(vscode.workspace.workspaceFolders)
	console.log('Sketch Programming -- LLM Transpiler extension is now active!');

	const workspaces: Record<string, Workspace> = {};
	const transpiling = new Set<string>();
	const isTranspilingDirty = new Set<string>();

	let sketchName: string | null = null;
	let root: string | undefined;
	let currentWorkspace: Workspace | null = null;

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

	const createCommand = vscode.commands.registerCommand('sketch-programming--llm-transpiler.create', async () => {
		// TODO refacor to avoid repetition
		if (!root) {
			await updateRoot(vscode.window.activeTextEditor!);
		}

		if (root) {
			currentWorkspace = workspaces[root];
		
			if (!currentWorkspace) {
				workspaces[root] = currentWorkspace = new Workspace(root);
				await currentWorkspace.initialize();
			}
		} else {
			vscode.window.showErrorMessage(`Sketch-programming Workspace: No config in the root`);
		}
		////

		try {
			if (currentWorkspace !== null && currentWorkspace.storage && currentWorkspace.config) {
				const vectoreStoreName = currentWorkspace.config.vectorStoreName || currentWorkspace.config.projectId;
				const assistantName = currentWorkspace.config.assistantName || currentWorkspace.config.projectId;
				let newVectorStore;
	
				if (await currentWorkspace.storage.hasVectorStore(vectoreStoreName)) {
					vscode.window.showInformationMessage(`Sketch-programming Extension: Creating vector store - ${vectoreStoreName} already exists.`);
				} else {
					newVectorStore = await currentWorkspace.storage.createNewVectorStore(vectoreStoreName)
				}
	
				if (await currentWorkspace.hasAssistant(assistantName)) {
					vscode.window.showInformationMessage(`Sketch-programming Extension: Creating assistant - ${assistantName} already exists.`);
				} else {
					if (!newVectorStore?.id) {
						vscode.window.showErrorMessage(`Sketch-programming Extension: Creating assistant - failed to create vector store or assistant. Vector store ID is missing.`);
						return;
					}
	
					const assistant = await currentWorkspace.createAssistant(assistantName, newVectorStore.id, currentWorkspace.config.assistantCreateParams || null);
	
					if (assistant.id) {
						vscode.window.showInformationMessage(`Sketch-programming Extension: Creating - assistant and store created successfully. Upload your sketch files!`);
					}
				}
				
				// Reinitalize workspace to get the new assistant and storage
				currentWorkspace.initialize();
			}
		} catch (error) {
			console.log(`Sketch-programming Extension: Creating - failed to create assistant or store: ${error}`);
			vscode.window.showErrorMessage(`Sketch-programming Extension: Creating - failed to create assistant or store: ${error}`);
		}
    });

	const uploadCommand = vscode.commands.registerCommand('sketch-programming--llm-transpiler.upload', async () => {
		// TODO refacor to avoid repetition
		if (!root) {
			await updateRoot(vscode.window.activeTextEditor!);
		}

		if (root) {
			currentWorkspace = workspaces[root];
		
			if (!currentWorkspace) {
				workspaces[root] = currentWorkspace = new Workspace(root);
				await currentWorkspace.initialize();
			}

			if (currentWorkspace.storage) {
				try {
					await currentWorkspace.storage.uploadSketches();
					vscode.window.showInformationMessage(`Sketch-programming Extension: Uploading - all files uploaded successfully.`);
				} catch (error) {
					console.log(`Sketch-programming Extension: Uploading - failed to upload files: ${error}`);
					vscode.window.showErrorMessage(`Sketch-programming Extension: Uploading - failed to upload files: ${error}`);
				}
			} else {
				vscode.window.showErrorMessage(`Sketch-programming Extension: Uploading - no storage available.`);
			}

		} else {
			vscode.window.showErrorMessage(`Sketch-programming Workspace: No config in the root`);
		}
		////
    });

    context.subscriptions.push(initializeCommand);
    context.subscriptions.push(currentRootCommand);
    context.subscriptions.push(createCommand);
    context.subscriptions.push(uploadCommand);

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
				currentWorkspace = workspaces[root];
				
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
