import { EntryItem } from "./sidebar";

export const enum GameConfig {}
export const SIDE_BAR_CONFIG = {
  sys: "系统",
  game: "游戏内",
  player: "玩家",
};
export const SIDE_BAR_CHILD_CONFIG = {
  login: "登录",
  logout: "登出",
};
export const SIDE_BAR_ALL_CONFIG = {
  ...SIDE_BAR_CONFIG,
  ...SIDE_BAR_CHILD_CONFIG,
};
export type SideBarConfigKey = keyof typeof SIDE_BAR_CONFIG;

export type SideBarChildConfigKey = keyof typeof SIDE_BAR_CHILD_CONFIG;

export type SideBarAllConfigKey = SideBarConfigKey | SideBarChildConfigKey;

export type SideBarConfigObjFn = {
  [k in SideBarAllConfigKey]?: () => EntryItem[];
};

export type SideBarConfigCommand<T> = {
  [k in SideBarChildConfigKey]: (this: T) => void;
};
export type ThisFnObj<T, R> = {
  [k: string]: (this: T, payload: R) => void;
};
export class LoginForm {
  account = "";
  password = "";
  constructor(account: any = "", password: any = "") {
    this.account = account;
    this.password = password;
  }
}
export class PluginConfig extends LoginForm {
  autoStart?: boolean;
  constructor(config: Partial<PluginConfig>) {
    super(config.account, config.password);
    this.autoStart = config.autoStart;
  }
}
export type PluginConfigKey = keyof PluginConfig;
export const NET_CONNECT = {
  host: "localhost",
  // host: "1.15.114.61",
  port: 9900,
};
