import { useLoginWithEmail, useLoginWithOAuth, usePrivy } from "@privy-io/expo";
import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import { useSession } from "../lib/session";
import { Action, Button, Card, Field, ResourceState, s } from "./ui";
function ConfiguredLogin() {
  // shortcut: email and Google only; add a wallet connector for wallet-only accounts.
  const { sendCode, loginWithCode } = useLoginWithEmail();
  const { login } = useLoginWithOAuth();
  const { user, isReady } = usePrivy();
  const { profile, syncing, error, sync, logout } = useSession();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  if (!isReady) return <ResourceState loading />;
  if (user)
    return (
      <Card>
        <ResourceState loading={syncing} error={error} />
        <Text style={s.text}>
          {profile
            ? "You’re signed in. Your music is waiting."
            : "Setting up your AudioBlocks account…"}
        </Text>
        {error && (
          <>
            <Action label="Retry account setup" run={() => sync()} />
            <Action secondary label="Use another account" run={logout} />
          </>
        )}
        <Button disabled={!profile} onPress={() => router.replace("/")}>
          Let’s listen ↗
        </Button>
      </Card>
    );
  return (
    <Card>
      <Text style={s.title}>Your music starts here.</Text>
      <Text style={s.muted}>
        Sign in with the same account you use on the web.
      </Text>
      <Field
        label="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        editable={!sent}
        placeholder="you@example.com"
      />
      {sent ? (
        <>
          <Field
            label="Verification code"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            value={code}
            onChangeText={setCode}
            placeholder="123456"
          />
          <Action
            label="Verify and sign in"
            disabled={!code.trim()}
            run={() =>
              loginWithCode({ email: email.trim(), code: code.trim() })
            }
          />
          <Action
            secondary
            label="Resend code"
            run={() => sendCode({ email: email.trim() })}
          />
          <Button
            secondary
            onPress={() => {
              setSent(false);
              setCode("");
            }}
          >
            Use another email
          </Button>
        </>
      ) : (
        <Action
          label="Continue with email"
          disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
          run={async () => {
            await sendCode({ email: email.trim() });
            setSent(true);
          }}
        />
      )}
      <Action
        secondary
        label="Continue with Google"
        run={() => login({ provider: "google" })}
      />
    </Card>
  );
}
export function LoginForm() {
  if (
    !process.env.EXPO_PUBLIC_PRIVY_APP_ID ||
    !process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID
  )
    return (
      <Card>
        <Text style={s.text}>
          Set EXPO_PUBLIC_PRIVY_APP_ID and EXPO_PUBLIC_PRIVY_CLIENT_ID in
          Audio-Mobile/.env to enable sign-in.
        </Text>
        <Text style={s.muted}>
          Use the same Privy app as the backend and add a mobile app client in
          the Privy dashboard.
        </Text>
      </Card>
    );
  return <ConfiguredLogin />;
}
