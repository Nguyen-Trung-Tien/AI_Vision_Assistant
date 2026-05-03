import { AuthProvider } from "./providers/AuthProvider";
import { NotificationProvider } from "./providers/NotificationProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
