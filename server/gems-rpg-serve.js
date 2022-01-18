"use strict";
(() => {
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
  function getDay() {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
  if (!fs.existsSync(getFilePath("log"))) {
    fs.mkdirSync(getFilePath("log"));
  }
  if (!fs.existsSync(getFilePath("db"))) {
    fs.mkdirSync(getFilePath("db"));
  }

  function readUser(account) {
    if (fs.existsSync(getFilePath("db", account))) {
      const file = fs.readFileSync(getFilePath("db", account), "utf8");
      return JSON.parse(file);
    }
  }
  function writeUser(account, data) {
    const payload = JSON.stringify(data);
    fs.writeFile(getFilePath("db", account), payload, "utf8", () => void 0);
  }

  function printLog(message) {
    const path = getFilePath("log", `${getDay()}.txt`);
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, "", "utf8");
    }
    const time = new Date().toLocaleString();
    const msg = `${time}  ${message}`;
    console.log(msg);
    fs.appendFile(path, msg + "\r\n", "utf8", () => void 0);
  }

  const clients = new Map();
  function singleSend(connection, payload) {
    connection.write(JSON.stringify(payload));
  }
  function singlecast(payload) {
    if (clients.has(payload.target)) {
      singleSend(clients.get(payload.target).connect, payload);
    }
  }
  function broadcast(payload) {
    clients.forEach(({ connect }) => {
      singleSend(connect, payload);
    });
  }
  const onData = {
    sys(data) {
      switch (data.type) {
        case "login": {
          const { account, password } = data.data;
          if (clients.has(account)) {
            singleSend(this, {
              type: "sys",
              data: { type: "login", msg: "该账号已登录", code: 1 },
            });
            printLog(`用户 ${account} 试图重复登录，当前在线${clients.size}人`);
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
          }
          writeUser(account, { account, password, loginTime: Date.now() });
          const gameData = { account, password, ...model };
          singleSend(this, {
            type: "sys",
            data: { type: "login", msg: "登录成功", code: 0, data: gameData },
          });
          this.account = account;
          clients.set(account, { connect: this, data: gameData });
          printLog(`用户 ${account} 登录成功，当前在线${clients.size}人`);
          onData.sys.call(this, { type: "getPlayers" });
          return;
        }
        case "getPlayers": {
          broadcast({
            type: "sys",
            data: {
              type: "getPlayers",
              code: 0,
              msg: "同步在线用户",
              data: Array.from(clients, ([_, value]) => {
                return value.data.account;
              }),
            },
          });
          return;
        }
      }
      // if (data.type === "login") {

      // }
    },
    single(data, target, source, payload) {
      switch (data.type) {
        case "chat": {
          printLog(`用户 ${source} 对 ${target} 发起私聊 内容:${data.data}`);
          singlecast(payload);
          return;
        }
      }
    },
  };
  net
    .createServer((connection) => {
      printLog("创建连接了");
      connection.on("data", (dto) => {
        printLog(dto);
        const payload = JSON.parse(dto);
        const { type, data, target, source } = payload;
        const fn = onData[type];
        fn && fn.call(connection, data, target, source, payload);
      });
      connection.on("close", () => {
        printLog("close 断开连接了");
        const { account } = connection;
        if (clients.has(account)) {
          writeUser(account, clients.get(account).data);
          clients.delete(account);
          printLog(`用户 ${account} 断开连接，当前在线${clients.size}人`);
        }
        connection.end();
        onData.sys.call(connection, { type: "getPlayers" });
      });

      connection.on("error", (err) => {
        printLog(`用户 ${connection.account} 强制断开连接`);
        printLog(err);
        connection.end();
      });
    })
    .listen(PORT, () => printLog(`服务运行至 http://${ip}:${PORT}`));
})();
