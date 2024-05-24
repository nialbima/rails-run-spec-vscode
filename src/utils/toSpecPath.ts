// Pattern: name of folder used for files
// filePath: path to file defined either using .asRelativePath or document.filename. That's where

function setDirPath(railsRoot: string, topLevelAppFolder: string, fullPath: string[], pattern: string): Array<string> {
  let indexOfTopLevelAppFolder = fullPath.indexOf(topLevelAppFolder);
  let parentAppFolders = fullPath.slice(0, indexOfTopLevelAppFolder);
  let remainingPath = fullPath.slice(indexOfTopLevelAppFolder + 1);

  if (topLevelAppFolder === "app") {
    return [railsRoot, ...parentAppFolders, pattern, ...remainingPath];
  } else {
    return [railsRoot, ...parentAppFolders, pattern, topLevelAppFolder, ...remainingPath];
  }
}

function asDotPath(filePath: string): string {
  return filePath.slice(0, 2) === "./" ? filePath : `./${filePath}`;
}

export default function toSpecPath(
  filePath: string,
  pattern: string,
  railsRoot: string,
  topLevelAppFolders: Array<string>
): string {
  if (filePath.indexOf(`_${pattern}.rb`) > -1) {
    return asDotPath(filePath);
  }

  let fullPath = filePath.split("/");
  let topLevelAppFolder: string = fullPath.find((e) => topLevelAppFolders.includes(e))!;
  let specFile = fullPath.pop()!.replace(".rb", `_${pattern}.rb`);

  let dirPath = setDirPath(railsRoot!, topLevelAppFolder!, fullPath, pattern);
  return asDotPath([...dirPath, specFile].join("/"));
}
