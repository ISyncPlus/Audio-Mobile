import type { PropsWithChildren } from "react";
// Privy's native SDK does not support web; browser preview stays in guest mode.
export function AuthProvider({ children }: PropsWithChildren) {
  return children;
}
