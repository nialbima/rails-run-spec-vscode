"use strict";

import * as vscode from "vscode";

import toSpecPath from "./utils/toSpecPath";

interface IOptions {
  path?: string;
  lineNumber?: number;
  commandText?: string;
}

let rubyConfig: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration("ruby");
let railsRoot: string = rubyConfig.get("specRailsRoot") || ".";
let topLevelAppFolders: Array<string> = rubyConfig.get("specTopLevelAppFolders") || ["app"];
let lastCommandText: string;
let activeTerminals: {[index: string]: vscode.Terminal} = {};

const SPEC_TERMINAL_NAME = "Running Specs";
const ZEUS_TERMINAL_NAME = "Zeus Start";

vscode.window.onDidCloseTerminal((terminal: vscode.Terminal) => {
  if (activeTerminals[terminal.name]) {
    delete activeTerminals[terminal.name];
  }
});

function extractPath(options: IOptions, editor: vscode.TextEditor | undefined): string {
  let pathString = options.path || editor?.document.fileName || "";
  let pathWithRoot = railsRoot + pathString;
  return vscode.workspace.asRelativePath(pathWithRoot, false);
}

export function runSpecFile(options: IOptions): void {
  let editor: vscode.TextEditor | undefined = vscode.window?.activeTextEditor,
    path = extractPath(options, editor),
    pattern = getTestFilePattern(),
    fileName = toSpecPath(path, pattern, railsRoot, topLevelAppFolders);

  if (!editor || (!isSpecDirectory(fileName, pattern) && !isSpec(fileName, pattern) && !options.commandText)) {
    return;
  }

  if (rubyConfig.get("specSaveFile")) {
    vscode.window.activeTextEditor?.document?.save();
  }

  let isZeusInit = isZeusActive() && !activeTerminals[getTerminalName(ZEUS_TERMINAL_NAME)];

  if (isZeusInit) {
    zeusTerminalInit();
  }

  if (isZeusInit) {
    let interval = getZeusStartTimeout();

    if (interval > 0) {
      vscode.window.showInformationMessage("Starting Zeus ...");
    }

    setTimeout(() => {
      executeInTerminal(fileName, options);
    }, interval);
  } else {
    executeInTerminal(fileName, options);
  }
}

export function runLastSpec(): void {
  if (lastCommandText) {
    runSpecFile({commandText: lastCommandText});
  }
}

function executeInTerminal(fileName: string, options: IOptions): void {
  const specTerminal = getOrCreateTerminal(SPEC_TERMINAL_NAME);
  const execute = () => executeCommand(specTerminal, fileName, options);

  if (shouldClearTerminal()) {
    vscode.commands.executeCommand("workbench.action.terminal.clear").then(execute);
  } else {
    execute();
  }
}

function executeCommand(specTerminal: vscode.Terminal, fileName: string, options: IOptions): void {
  specTerminal.show(shouldPreserveFocus());

  let lineNumberText = options.lineNumber ? `:${options.lineNumber}` : "",
    commandText = options.commandText || `${getSpecCommand()} ${fileName}${lineNumberText}`;

  specTerminal.sendText(commandText);

  lastCommandText = commandText;
}

function getTerminalName(prefix: string): string {
  const activeTextEditor = vscode.window?.activeTextEditor;
  const documentUri = activeTextEditor?.document?.uri || vscode.Uri.file("");
  return [prefix, vscode.workspace?.getWorkspaceFolder(documentUri)?.name].join(" ");
}

function getOrCreateTerminal(prefix: string): vscode.Terminal {
  const terminalName = getTerminalName(prefix);

  if (activeTerminals[terminalName]) {
    return activeTerminals[terminalName];
  } else {
    const terminal = vscode.window.createTerminal(terminalName);
    activeTerminals[terminalName] = terminal;
    return terminal;
  }
}

function getSpecCommand(): unknown {
  if (customSpecCommand()) {
    return customSpecCommand();
  } else if (isZeusActive()) {
    return "zeus test";
  } else {
    return "bundle exec rspec";
  }
}

function shouldPreserveFocus(): boolean {
  return !rubyConfig.get("specFocusTerminal");
}

function shouldClearTerminal(): unknown {
  return rubyConfig.get("specClearTerminal");
}

function customSpecCommand(): unknown {
  return rubyConfig.get("specCommand");
}

function isZeusActive(): unknown {
  return rubyConfig.get("specGem") === "zeus";
}

function getTestFilePattern(): string {
  return rubyConfig.get("specPattern") || "spec";
}

function getZeusStartTimeout(): number {
  return rubyConfig.get("zeusStartTimeout") || 0;
}

function zeusTerminalInit(): void {
  const terminalName = getTerminalName(ZEUS_TERMINAL_NAME);
  let zeusTerminal = vscode.window.createTerminal(terminalName);

  activeTerminals[terminalName] = zeusTerminal;
  zeusTerminal.sendText("zeus start");
}

function isSpec(fileName: string, pattern: string): boolean {
  return fileName.indexOf(`_${pattern}.rb`) > -1;
}

function isSpecDirectory(fileName: string, pattern: string): boolean {
  return fileName.indexOf(pattern) > -1 && fileName.indexOf(".rb") === -1;
}
