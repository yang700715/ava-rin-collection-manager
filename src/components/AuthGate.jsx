import { useState } from "react";

const LOGIN_USER = "xiaoxiaoyuan";
const LOGIN_PASS = "change-this-password";

export default function AuthGate({ children }) {
  const [isAuthed, setIsAuthed] = useState(
    localStorage.getItem("ava-auth") === "yes"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === LOGIN_USER && password === LOGIN_PASS) {
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
      <div style={styles.page}>
        <form style={styles.card} onSubmit={handleLogin}>
          <div style={styles.badge}>Private Archive</div>
          <h1 style={styles.title}>Ava_凜 作品庫</h1>
          <p style={styles.subtitle}>私人收藏展示｜請先登入</p>

          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="帳號"
            autoComplete="username"
          />

          <input
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密碼"
            type="password"
            autoComplete="current-password"
          />

          {error && <div style={styles.error}>{error}</div>}

          <button style={styles.button} type="submit">
            登入
          </button>

          <p style={styles.note}>
            此頁為簡易前端保護，適合防止一般瀏覽，不適合放真正機密資料。
          </p>
        </form>
      </div>
    );
  }

  return (
    <>
      <button style={styles.logout} onClick={handleLogout}>
        登出
      </button>
      {children}
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top, #ffe4ef 0%, #f8fafc 45%, #e0f2fe 100%)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "rgba(255,255,255,0.9)",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.16)",
    border: "1px solid rgba(255,255,255,0.7)",
  },
  badge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    background: "#fce7f3",
    color: "#be185d",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 30,
    color: "#111827",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: "#6b7280",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 16,
    marginBottom: 12,
    outline: "none",
  },
  button: {
    width: "100%",
    border: "none",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    background: "#111827",
    color: "white",
    marginTop: 4,
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
    marginBottom: 12,
  },
  note: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 1.6,
    marginTop: 16,
    marginBottom: 0,
  },
  logout: {
    position: "fixed",
    right: 18,
    top: 18,
    zIndex: 9999,
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "8px 14px",
    background: "white",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
  },
};