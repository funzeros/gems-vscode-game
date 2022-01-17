import * as vscode from "vscode";
import {
  SideBarAllConfigKey,
  SideBarConfigKey,
  SideBarConfigObjFn,
  SIDE_BAR_ALL_CONFIG,
} from "./config";
import { Game } from "./main";

// 树节点
export class EntryItem extends vscode.TreeItem {
  id: string;
  constructor(
    id: string,
    collapsibleState?: vscode.TreeItemCollapsibleState,
    description?: string
  ) {
    let label = id;
    const isSysBtn = id in SIDE_BAR_ALL_CONFIG;
    if (isSysBtn) {
      label = SIDE_BAR_ALL_CONFIG[id as SideBarAllConfigKey];
    }
    super(label, collapsibleState);
    this.id = id;
    this.description = description;
    if (!collapsibleState) {
      if (isSysBtn) {
        this.command = {
          command: "gems_rpg_game_otp.openChild", //命令id
          title: label,
          arguments: [id], //命令接收的参数
        };
      } else {
        this.command = {
          command: "gems_rpg_game_otp.sendMsgToPlayer", //命令id
          title: label,
          arguments: [id], //命令接收的参数
        };
      }
    }
  }
}

//树的内容组织管理
export class EntryList implements vscode.TreeDataProvider<EntryItem> {
  constructor(parent: Game) {
    this.parent = parent;
    this.parent.installSideBar(this);
  }
  public get onDidChangeTreeData(): vscode.Event<EntryItem | undefined | void> {
    return this.eventEmitter.event;
  }
  public parent: Game;
  getTreeItem(element: EntryItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: EntryItem): vscode.ProviderResult<EntryItem[]> {
    if (element) {
      const { id } = element;
      const fn = this.divider[id as SideBarConfigKey];
      return (fn && fn()) || [];
    } else {
      //根节点
      return [
        new EntryItem("sys", vscode.TreeItemCollapsibleState.Expanded),
        new EntryItem("game", vscode.TreeItemCollapsibleState.Collapsed),
        new EntryItem(
          "player",
          vscode.TreeItemCollapsibleState.Expanded,
          `在线(${this.parent.onlinePlayer.length})人`
        ),
      ];
    }
  }
  private get divider(): SideBarConfigObjFn {
    return {
      sys: () => {
        return [
          this.parent.hasLogin
            ? new EntryItem("logout")
            : new EntryItem("login"),
        ];
      },
      game: () => {
        return [];
      },
      player: () => {
        return this.parent.onlinePlayer.map((name) => {
          return new EntryItem(name);
        });
      },
    };
  }
  private eventEmitter = new vscode.EventEmitter<
    EntryItem | undefined | void
  >();
  private updateView() {
    this.eventEmitter.fire();
  }
  public update() {
    this.updateView();
  }
}
