import * as vscode from "vscode"
import { EditorUtils } from "./EditorUtils"

export const ACTION_NAMES = {
	EXPLAIN: "Shenma: Explain Code",
	FIX: "Shenma: Fix Code",
	FIX_LOGIC: "Shenma: Fix Logic",
	IMPROVE: "Shenma: Improve Code",
	ADD_TO_CONTEXT: "Shenma: Add to Context",
	NEW_TASK: "Shenma: New Task",

	// right menu and quick menu
	ZGSM_EXPLAIN: "Shenma: Explain Code",
	ZGSM_ADD_COMMENT: "Shenma: Add Comment",
	ZGSM_CODE_REVIEW: "Shenma: Code Review",
	ZGSM_ADD_DEBUG_CODE: "Shenma: Add Debug Code",
	ZGSM_ADD_STRONG_CODE: "Shenma: Add Strong Code",
	ZGSM_SIMPLIFY_CODE: "Shenma: Simplify Code",
	ZGSM_PERFORMANCE: "Shenma: Performance Optimization",
	ZGSM_ADD_TEST: "Shenma: Add Unit test",
} as const

export const COMMAND_IDS = {
	EXPLAIN: "vscode-zgsm.explainCode",
	FIX: "vscode-zgsm.fixCode",
	IMPROVE: "vscode-zgsm.improveCode",
	ADD_TO_CONTEXT: "vscode-zgsm.addToContext",
	NEW_TASK: "vscode-zgsm.newTask",
	ZGSM_EXPLAIN: "vscode-zgsm.explain",
	ZGSM_ADD_COMMENT: "vscode-zgsm.addComment",
	ZGSM_CODE_REVIEW: "vscode-zgsm.codeReview",
	ZGSM_ADD_DEBUG_CODE: "vscode-zgsm.addDebugCode",
	ZGSM_ADD_STRONG_CODE: "vscode-zgsm.addStrongerCode",
	ZGSM_SIMPLIFY_CODE: "vscode-zgsm.simplifyCode",
	ZGSM_PERFORMANCE: "vscode-zgsm.performanceOptimization",
} as const

export class CodeActionProvider implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.QuickFix,
		vscode.CodeActionKind.RefactorRewrite,
	]

	private createAction(title: string, kind: vscode.CodeActionKind, command: string, args: any[]): vscode.CodeAction {
		const action = new vscode.CodeAction(title, kind)
		action.command = { command, title, arguments: args }
		return action
	}

	private createActionPair(
		baseTitle: string,
		kind: vscode.CodeActionKind,
		baseCommand: string,
		args: any[],
	): vscode.CodeAction[] {
		return [
			this.createAction(`${baseTitle} in New Task`, kind, baseCommand, args),
			this.createAction(`${baseTitle} in Current Task`, kind, `${baseCommand}InCurrentTask`, args),
		]
	}

	public provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		try {
			const effectiveRange = EditorUtils.getEffectiveRange(document, range)
			if (!effectiveRange) {
				return []
			}

			const filePath = EditorUtils.getFilePath(document)
			const actions: vscode.CodeAction[] = []

			actions.push(
				this.createAction(
					ACTION_NAMES.ADD_TO_CONTEXT,
					vscode.CodeActionKind.QuickFix,
					COMMAND_IDS.ADD_TO_CONTEXT,
					[
						filePath,
						effectiveRange.text,
						effectiveRange.range.start.line + 1,
						effectiveRange.range.end.line + 1,
					],
				),
			)

			actions.push(
				...this.createActionPair(ACTION_NAMES.EXPLAIN, vscode.CodeActionKind.QuickFix, COMMAND_IDS.EXPLAIN, [
					filePath,
					effectiveRange.text,
					effectiveRange.range.start.line + 1,
					effectiveRange.range.end.line + 1,
				]),
			)

			if (context.diagnostics.length > 0) {
				const relevantDiagnostics = context.diagnostics.filter((d) =>
					EditorUtils.hasIntersectingRange(effectiveRange.range, d.range),
				)

				if (relevantDiagnostics.length > 0) {
					const diagnosticMessages = relevantDiagnostics.map(EditorUtils.createDiagnosticData)
					actions.push(
						...this.createActionPair(ACTION_NAMES.FIX, vscode.CodeActionKind.QuickFix, COMMAND_IDS.FIX, [
							filePath,
							effectiveRange.text,
							effectiveRange.range.start.line + 1,
							effectiveRange.range.end.line + 1,
							diagnosticMessages,
						]),
					)
				}
			} else {
				actions.push(
					...this.createActionPair(ACTION_NAMES.FIX_LOGIC, vscode.CodeActionKind.QuickFix, COMMAND_IDS.FIX, [
						filePath,
						effectiveRange.text,
						effectiveRange.range.start.line + 1,
						effectiveRange.range.end.line + 1,
					]),
				)
			}

			actions.push(
				...this.createActionPair(
					ACTION_NAMES.IMPROVE,
					vscode.CodeActionKind.RefactorRewrite,
					COMMAND_IDS.IMPROVE,
					[
						filePath,
						effectiveRange.text,
						effectiveRange.range.start.line + 1,
						effectiveRange.range.end.line + 1,
					],
				),
			)

			return actions
		} catch (error) {
			console.error("Error providing code actions:", error)
			return []
		}
	}
}
