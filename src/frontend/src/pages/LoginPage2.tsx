import { Navigate } from 'react-router-dom'

/** Legacy URL kept for bookmarks. Authentication uses the real login flow. */
export default function LoginPage2() {
  return <Navigate to="/login" replace />
}
