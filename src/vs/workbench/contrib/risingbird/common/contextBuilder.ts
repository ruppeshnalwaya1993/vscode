/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from '../../../../base/common/uri.js';
import { ITextModel } from '../../../../editor/common/model.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { ICodeContext, IWorkspaceContext } from './types.js';

export const IContextBuilderService = createDecorator<IContextBuilderService>('contextBuilderService');

/**
 * Service for building context for AI requests
 */
export interface IContextBuilderService {
	readonly _serviceBrand: undefined;

	/**
	 * Build context from a code editor
	 * Note: editor parameter is 'unknown' to avoid browser layer dependency in common
	 */
	buildEditorContext(editor: unknown): Promise<ICodeContext>;

	/**
	 * Build context from a text model
	 */
	buildModelContext(model: ITextModel): Promise<ICodeContext>;

	/**
	 * Build workspace context
	 */
	buildWorkspaceContext(options?: IContextOptions): Promise<IWorkspaceContext>;

	/**
	 * Build context for a specific file
	 */
	buildFileContext(uri: URI): Promise<ICodeContext>;

	/**
	 * Select relevant files for a query
	 */
	selectRelevantFiles(query: string, maxFiles: number): Promise<URI[]>;

	/**
	 * Estimate token count for context
	 */
	estimateTokens(context: ICodeContext): number;

	/**
	 * Trim context to fit within token limit
	 */
	trimContext(context: ICodeContext, maxTokens: number): ICodeContext;
}

/**
 * Options for building context
 */
export interface IContextOptions {
	readonly includeOpenFiles?: boolean;
	readonly includeRecentFiles?: boolean;
	readonly maxFiles?: number;
	readonly maxTokens?: number;
}

