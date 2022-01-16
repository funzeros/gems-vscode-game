import * as vscode from "vscode";
import {
  SideBarAllConfigKey,
  SideBarConfigObjFn,
  SIDE_BAR_ALL_CONFIG,
} from "./config";

// 树节点
export class EntryItem extends vscode.TreeItem {
  id: SideBarAllConfigKey;
  constructor(
    id: SideBarAllConfigKey,
    collapsibleState?: vscode.TreeItemCollapsibleState
  ) {
    const label = SIDE_BAR_ALL_CONFIG[id];
    super(label, collapsibleState);
    this.id = id;
    this.command = {
      command: "gems_rpg_game_otp.openChild", //命令id
      title: label,
      arguments: [id], //命令接收的参数
    };
  }
}

//树的内容组织管理
export class EntryList implements vscode.TreeDataProvider<EntryItem> {
  onDidChangeTreeData?:
    | vscode.Event<void | EntryItem | null | undefined>
    | undefined;
  getTreeItem(element: EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: EntryItem): vscode.ProviderResult<EntryItem[]> {
    if (element) {
      const { id } = element;
      const fn = this.divider[id];
      return (fn && fn()) || [];
    } else {
      //根节点
      return [
        new EntryItem("sys", vscode.TreeItemCollapsibleState.Expanded),
        new EntryItem("game", vscode.TreeItemCollapsibleState.Expanded),
      ];
    }
  }
  get divider(): SideBarConfigObjFn {
    return {
      sys: () => {
        return [new EntryItem("login"), new EntryItem("logout")];
      },
      game: () => {
        return [];
      },
    };
  }
}
