import {
  ExtensionContext,
  StatusBarAlignment,
  StatusBarItem,
  window,
  workspace,
} from "vscode";
import {
  PluginConfig,
  LoginForm,
  SideBarChildConfigKey,
  SideBarConfigCommand,
  PluginConfigKey,
} from "./config";
import { Socket, Util } from "./util";

const treeViewCommand: SideBarConfigCommand<Game> = {
  login() {
    if (this.socket) {
      window.showWarningMessage(`[${this.socket.user.account}]已登录`);
      return;
    }
    window
      .showInputBox({
        title: "GemsRPG登录/注册",
        prompt: "格式：账号@密码，例：testaccount@123456",
        placeHolder: "请输入账号与密码(以@分割，首尾空格无效)",
        validateInput: (value) => {
          const list = value.trim().split("@");
          if (list.length < 2) return "缺少@分割符";
          if (list.length > 2) return "@分隔符只能有一个";
          const [account, password] = list;
          if (!this.between(account.length, 4, 10))
            return "账号长度在4-10个字符";
          if (!this.between(password.length, 6, 30))
            return "密码长度在6-30个字符";
        },
      })
      .then((value) => {
        if (!value) return;
        const [account, password] = value.trim().split("@");
        this.login(new LoginForm(account, password));
      });
  },
  logout() {
    window
      .showInformationMessage("确认退出登录？", "确认", "点错了")
      .then((res) => {
        if (res === "确认") {
          this.logout();
        }
      });
  },
};

/**
 * @author Gems
 * @date 2022/01/15 23:24:51
 * @description
 */
export class Game extends Util {
  ctx: ExtensionContext;
  socket?: Socket;
  statusBarItem?: StatusBarItem;
  constructor(ctx: ExtensionContext) {
    super();
    this.ctx = ctx;
    this.init();
  }

  private init() {
    const autoStart = this.readConfig("autoStart");
    const account = this.readConfig("account");
    const password = this.readConfig("password");
    if (autoStart && account && password) {
      this.login(new LoginForm(account, password));
    }
  }
  public treeViewClick(type: SideBarChildConfigKey) {
    treeViewCommand[type].call(this);
  }
  private writeConfig(config: Partial<PluginConfig>) {
    Object.keys(config).forEach((key) => {
      if (key) {
        workspace
          .getConfiguration()
          .update(`GemsRPG.${key}`, config[key as keyof PluginConfig], true);
      }
    });
  }
  private readConfig(name: PluginConfigKey) {
    return workspace.getConfiguration().get(`GemsRPG.${name}`);
  }
  public login(form: LoginForm) {
    if (this.socket) {
      window.showWarningMessage(`[${this.socket.user.account}]已登录`);
      return;
    }
    this.socket = new Socket(this, form, () => {
      this.socket = void 0;
    });
    this.writeConfig(form);
  }
  public logout() {
    if (this.socket) {
      this.socket.end();
      this.socket = void 0;
      window.showInformationMessage("退出登录成功");
      return;
    }
    window.showWarningMessage("请先登录");
  }
  public loginSuccess(payload: any) {
    this.statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 0);
    this.ctx.subscriptions.push(this.statusBarItem);
    this.setStatusBarText(`$(flame)Gems RPG:[${payload.account}]`).show();
  }
  private setStatusBarText(text: string) {
    this.statusBarItem!.text = text;
    return this.statusBarItem!;
  }
}
