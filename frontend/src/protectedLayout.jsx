// ProtectedLayout.jsx
import useTokenExpiryRedirect from "./useTokenExpiryRedirect";

export default function ProtectedLayout({ children }) {
  const token = localStorage.getItem("token");
  useTokenExpiryRedirect(token);
  return <>{children}</>;
}
