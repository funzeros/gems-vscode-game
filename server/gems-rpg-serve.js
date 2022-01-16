"use strict";
((global) => {
  const fs = require("fs");
  const path = require("path");
  const net = require("net");

  function getIPAdress() {
    const interfaces = require("os").networkInterfaces();
    for (let devName in interfaces) {
      const iface = interfaces[devName];
      for (let i = 0; i < iface.length; i++) {
        const alias = iface[i];
        if (
          alias.family === "IPv4" &&
          alias.address !== "127.0.0.1" &&
          !alias.internal
        ) {
          return alias.address;
        }
      }
    }
  }
  const PORT = 9900;
  const ip = getIPAdress();

  function getFilePath(...paths) {
    return path.join(__dirname, ...paths);
  }

  if (!fs.existsSync(getFilePath("log.txt"))) {
    fs.writeFileSync(getFilePath("log.txt"), "", "utf8");
  }
  if (!fs.existsSync(getFilePath("db"))) {
    fs.mkdirSync(getFilePath("db"));
  }

  function readUser(account) {
    if (fs.existsSync(getFilePath("db", account))) {
      const file = fs.readFileSync(getFilePath("db", account), "utf8");
      return JSON.parse(atob(file));
    }
  }
  function writeUser(account, data) {
    const payload = btoa(JSON.stringify(data));
    fs.writeFile(getFilePath("db", account), payload, "utf8", () => void 0);
  }

  function printLog(message) {
    const time = new Date().toLocaleString();
    const msg = `${time}  ${message}`;
    console.log(msg);
    fs.appendFile(getFilePath("log.txt"), msg + "\r\n", "utf8", () => void 0);
  }

  function singleSend(connection, payload) {
    connection.write(JSON.stringify(payload));
  }
  const clients = new Map();
  const onData = {
    sys(data) {
      switch (data.type) {
        case "login":
          {
            const { account, password } = data.data;
            if (clients.has(account)) {
              singleSend(this, {
                type: "sys",
                data: { type: "login", msg: "该账号已登录", code: 1 },
              });
              printLog(
                `用户 ${account} 试图重复登录，当前在线${clients.size}人`
              );
              return;
            }
            const model = readUser(account);
            if (model) {
              if (model.password !== password) {
                singleSend(this, {
                  type: "sys",
                  data: { type: "login", msg: "密码错误", code: 1 },
                });
                printLog(`用户 ${account} 登录失败，当前在线${clients.size}人`);
                return;
              }
            } else {
              writeUser(account, { account, password });
            }
            singleSend(this, {
              type: "sys",
              data: { type: "login", msg: "登录成功", code: 0, data: model },
            });
            this.account = account;
            clients.set(account, { connect: this, data: readUser(account) });
            printLog(`用户 ${account} 登录成功，当前在线${clients.size}人`);
          }
          break;
      }
      // if (data.type === "login") {

      // }
    },
  };
  try {
    net
      .createServer((connection) => {
        printLog("创建连接了");
        connection.on("data", (dto) => {
          printLog(dto);
          const { type, data, target, source } = JSON.parse(dto);
          const fn = onData[type];
          fn && fn.call(connection, data, target, source);
        });
        connection.on("close", () => {
          printLog("close 断开连接了");
          const { account } = connection;
          if (clients.has(account)) {
            writeUser(account, clients.get(account).data);
            clients.delete(account);
            printLog(`用户 ${account} 断开连接，当前在线${clients.size}人`);
          }
        });

        connection.on("error", (err) => {
          printLog(`用户 ${connection.account} 强制断开连接`);
          printLog(err);
        });
      })
      .listen(PORT, () => printLog(`服务运行至 http://${ip}:${PORT}`));
  } catch (error) {
    printLog(JSON.stringify(error));
  }
})(globalThis);