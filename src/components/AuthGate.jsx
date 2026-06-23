import { useState } from "react";
import DrawMachine from "./draw/DrawMachine";

const ACCOUNTS = [
  {
    username: "xiaoxiaoyuan",
    password: "change-this-password",
  },
  {
    username: "1016a5-s",
    password: "avamama520",
  },
];

export default function AuthGate({ children }) {
  const [isAuthed, setIsAuthed] = useState(
    localStorage.getItem("ava-auth") === "yes"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPublicDrawMachine, setShowPublicDrawMachine] = useState(false);

  const handleLogin = (event) => {
    event.preventDefault();

    const matchedAccount = ACCOUNTS.find(
      (account) => account.username === username && account.password === password
    );

    if (matchedAccount) {
      localStorage.setItem("ava-auth", "yes");
      setIsAuthed(true);
      setError("");
      return;
    }

    setError("帳號或密碼不正確。");
  };

  const handleLogout = () => {
    localStorage.removeItem("ava-auth");
    setIsAuthed(false);
    setUsername("");
    setPassword("");
  };

  if (!isAuthed) {
    if (showPublicDrawMachine) {
      return (
        <div className="publicDrawPage">
          <DrawMachine
            backLabel="返回登入頁"
            onBack={() => setShowPublicDrawMachine(false)}
          />
        </div>
      );
    }

    return (
      <div className="authPage">
        <form className="authPanel" onSubmit={handleLogin}>
          <div className="authBadge">Private Archive</div>

          <h1 className="authTitle">Ava_凜作品庫</h1>
          <p className="authSubtitle">登入後可瀏覽作品庫與使用收藏工具。</p>

          <input
            className="authInput"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="帳號"
            autoComplete="username"
          />

          <input
            className="authInput"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="密碼"
            type="password"
            autoComplete="current-password"
          />

          {error && <div className="authError">{error}</div>}

          <button className="authButton" type="submit">
            登入
          </button>

          <p className="authNote">
            這是本機私人作品庫，登入狀態沿用 ava-auth。
          </p>
        </form>

        <aside className="drawEntryCard">
          <p className="drawEntryKicker">Local Bonus Tool</p>
          <h2>小小源抽賞機</h2>
          <p>免 API・不燒錢・純瀏覽器抽獎</p>
          <button
            type="button"
            className="ghost"
            onClick={() => setShowPublicDrawMachine(true)}
          >
            前往抽賞機
          </button>
        </aside>
      </div>
    );
  }

  return (
    <>
      <button className="logoutButton" onClick={handleLogout}>
        登出
      </button>
      {children}
    </>
  );
}
