/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';
import { ITextModel } from '../../../../editor/common/model.js';
import { ITextFileService } from '../../../services/textfile/common/textfiles.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { IContextBuilderService, IContextOptions } from './contextBuilder.js';
import { ICodeContext, IWorkspaceContext } from './types.js';
// import { RisingBirdDefaults } from './constants.js';  // TODO: Will be used in Phase 2 for MAX_CONTEXT_FILES

/**
 * Type guard for editor-like objects (avoids browser layer dependency)
 */
interface IEditorLike {
	getModel(): ITextModel | null;
	getSelection(): { isEmpty(): boolean; startLineNumber: number; endLineNumber: number; startColumn: number; endColumn: number } | null;
}

function isEditorLike(obj: unknown): obj is IEditorLike {
	return typeof obj === 'object' && obj !== null && 'getModel' in obj && 'getSelection' in obj;
}

/**
 * Implementation of context builder service
 */
export class ContextBuilderService implements IContextBuilderService {
	declare readonly _serviceBrand: undefined;

	constructor(
		@IEditorService private readonly editorService: IEditorService,
		@ITextFileService private readonly textFileService: ITextFileService,
		@IWorkspaceContextService private readonly workspaceContextService: IWorkspaceContextService,
		@ILogService private readonly logService: ILogService
	) { }

	async buildEditorContext(editor: unknown): Promise<ICodeContext> {
		// Type guard - we know it's ICodeEditor from browser layer
		if (!isEditorLike(editor)) {
			return {};
		}

		const model = editor.getModel();
		if (!model) {
			return {};
		}

		const uri = model.uri;
		const content = model.getValue();
		const language = model.getLanguageId();

		// Get selection if any
		const selection = editor.getSelection();
		let selectionInfo;
		if (selection && !selection.isEmpty()) {
			selectionInfo = {
				text: model.getValueInRange(selection),
				startLine: selection.startLineNumber,
				endLine: selection.endLineNumber,
				startColumn: selection.startColumn,
				endColumn: selection.endColumn
			};
		}

		// Add open files
		const openEditors = this.editorService.visibleEditors;
		const openFiles: Array<{ uri: URI; content: string; language: string }> = [];
		if (openEditors.length > 0) {
			// TODO: Get text model from editor input properly
			// For now, skip as we need proper editor input handling
			// Will implement in Phase 2 when we need multi-file context
			void openEditors; // Mark as intentionally unused for now
		}

		// Add workspace info
		const workspace = this.workspaceContextService.getWorkspace();
		const workspaceInfo = workspace.folders.length > 0 ? {
			rootUri: workspace.folders[0].uri,
			name: workspace.folders[0].name
		} : undefined;

		const context: ICodeContext = {
			currentFile: {
				uri,
				content,
				language,
				selection: selectionInfo
			},
			openFiles: openFiles.length > 0 ? openFiles : undefined,
			workspaceInfo
		};

		return context;
	}

	async buildModelContext(model: ITextModel): Promise<ICodeContext> {
		const uri = model.uri;
		const content = model.getValue();
		const language = model.getLanguageId();

		// Add workspace info
		const workspace = this.workspaceContextService.getWorkspace();
		const workspaceInfo = workspace.folders.length > 0 ? {
			rootUri: workspace.folders[0].uri,
			name: workspace.folders[0].name
		} : undefined;

		const context: ICodeContext = {
			currentFile: {
				uri,
				content,
				language
			},
			workspaceInfo
		};

		return context;
	}

	async buildWorkspaceContext(options: IContextOptions = {}): Promise<IWorkspaceContext> {
		const workspace = this.workspaceContextService.getWorkspace();
		if (workspace.folders.length === 0) {
			throw new Error('No workspace folder open');
		}

		const rootFolder = workspace.folders[0];

		// TODO: Implement file counting and relevant file selection
		// For now, return basic workspace info
		return {
			rootUri: rootFolder.uri,
			name: rootFolder.name,
			fileCount: 0,
			relevantFiles: []
		};
	}

	async buildFileContext(uri: URI): Promise<ICodeContext> {
		try {
			const content = await this.textFileService.read(uri);

			// Add workspace info
			const workspace = this.workspaceContextService.getWorkspace();
			const workspaceInfo = workspace.folders.length > 0 ? {
				rootUri: workspace.folders[0].uri,
				name: workspace.folders[0].name
			} : undefined;

			const context: ICodeContext = {
				currentFile: {
					uri,
					content: content.value,
					language: content.resource.path.split('.').pop() || 'plaintext'
				},
				workspaceInfo
			};

			return context;
		} catch (error) {
			this.logService.error('Failed to build file context:', error);
			return {};
		}
	}

	async selectRelevantFiles(query: string, maxFiles: number): Promise<URI[]> {
		// TODO: Implement semantic search for relevant files
		// For now, return empty array
		return [];
	}

	estimateTokens(context: ICodeContext): number {
		let totalChars = 0;

		if (context.currentFile) {
			totalChars += context.currentFile.content.length;
		}

		if (context.openFiles) {
			for (const file of context.openFiles) {
				totalChars += file.content.length;
			}
		}

		// Rough estimation: ~4 characters per token
		return Math.ceil(totalChars / 4);
	}

	trimContext(context: ICodeContext, maxTokens: number): ICodeContext {
		const currentTokens = this.estimateTokens(context);

		if (currentTokens <= maxTokens) {
			return context;
		}

		// Strategy: Keep current file, trim open files
		const currentFileTokens = context.currentFile
			? Math.ceil(context.currentFile.content.length / 4)
			: 0;
		const remainingTokens = maxTokens - currentFileTokens;

		const trimmedOpenFiles: Array<{ uri: URI; content: string; language: string }> = [];
		if (remainingTokens > 0 && context.openFiles) {
			let usedTokens = 0;

			for (const file of context.openFiles) {
				const fileTokens = Math.ceil(file.content.length / 4);
				if (usedTokens + fileTokens <= remainingTokens) {
					trimmedOpenFiles.push(file);
					usedTokens += fileTokens;
				} else {
					break;
				}
			}
		}

		const trimmedContext: ICodeContext = {
			currentFile: context.currentFile,
			openFiles: trimmedOpenFiles.length > 0 ? trimmedOpenFiles : undefined,
			workspaceInfo: context.workspaceInfo,
			gitInfo: context.gitInfo
		};

		return trimmedContext;
	}
}

