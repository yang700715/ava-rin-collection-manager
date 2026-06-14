import { useState } from "react";

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

  const handleLogin = (e) => {
    e.preventDefault();

    const matchedAccount = ACCOUNTS.find(
      (account) => account.username === username && account.password === password
    );

    if (matchedAccount) {
      localStorage.setItem("ava-auth", "yes");
      setIsAuthed(true);
      setError("");
      return;
    }

    setError("帳號或密碼錯誤");
  };

  const handleLogout = () => {
    localStorage.removeItem("ava-auth");
    setIsAuthed(false);
    setUsername("");
    setPassword("");
  };

  if (!isAuthed) {
    return (
      <div className="authPage">
        <form className="authPanel" onSubmit={handleLogin}>
          <div className="authBadge">Private Archive</div>

          <h1 className="authTitle">Ava_凜 作品庫</h1>
          <p className="authSubtitle">私人收藏展示｜請先登入</p>

          <input
            className="authInput"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="帳號"
            autoComplete="username"
          />

          <input
            className="authInput"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密碼"
            type="password"
            autoComplete="current-password"
          />

          {error && <div className="authError">{error}</div>}

          <button className="authButton" type="submit">
            登入
          </button>

          <p className="authNote">
            此頁為簡易前端保護，適合防止一般瀏覽。
          </p>
        </form>
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