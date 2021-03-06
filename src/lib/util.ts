import { LoginForm, NET_CONNECT, ThisFnObj } from "./config";
import * as net from "net";
import { window } from "vscode";
import { Game } from "./main";

/**
 * @author Gems
 * @date 2022/01/15 23:24:57
 * @description
 */
export class Util {
  between(num: number, ...range: [number, number]) {
    const [min, max] = range;
    return num >= min && num <= max;
  }
}

type SocketType = "sys" | "single" | "all";
type SocketDTOList = [any, SocketType, string];
interface SocketDTO<T> {
  data: T;
  type: SocketType;
  target: string;
  source: string;
}
interface BasicDTO<T = any> {
  type: string;
  code: number;
  msg?: string;
  data: T;
}

const socketHandleDict: ThisFnObj<Socket, SocketDTO<BasicDTO>> = {
  sys(payload) {
    const {
      data: { type, code, msg, data },
    } = payload;
    switch (type) {
      case "login": {
        if (code) {
          this.client.end();
        } else {
          this.parent.loginSuccess(data);
        }
        window.showInformationMessage(`GemsRPG:${msg}`);
        return;
      }
      case "getPlayers": {
        this.parent.refreshOnlinePlayer(data);
      }
    }
  },
  single(payload) {
    const {
      data: { type, data },
    } = payload;
    switch (type) {
      case "chat": {
        this.parent.getMsgFromPlayer(data, payload.source);
        return;
      }
    }
  },
};

export class Socket {
  client: net.Socket;
  user: LoginForm;
  parent: Game;
  constructor(parent: Game, form: LoginForm, endCallback: () => void) {
    this.parent = parent;
    const client = net.connect({
      host: NET_CONNECT.host,
      port: NET_CONNECT.port,
    });
    this.client = client;
    client.on("data", (data) => {
      try {
        const payload: SocketDTO<BasicDTO> = JSON.parse(data.toString());
        const fn = socketHandleDict[payload.type];
        fn && fn.call(this, payload);
      } catch (error) {
        window.showErrorMessage("消息出错啦，请重新登录");
        this.client.end();
      }
    });
    client.on("close", () => {
      console.log("socket close");
      endCallback();
    });
    client.on("error", (error) => {
      console.log(error);
      window.showErrorMessage("GemsRPG:与线上服务的连接断开了");
    });
    this.user = form;
    this.send({ type: "login", data: form }, "sys", "");
  }
  send(...rest: SocketDTOList) {
    this.client.write(JSON.stringify(this.genData(...rest)));
  }
  genData(...[data, type, target]: SocketDTOList) {
    return {
      data,
      type,
      target,
      source: this.user.account,
    };
  }
  end() {
    this.client.end();
  }
}
