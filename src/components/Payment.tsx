import { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as SecureStore from "expo-secure-store";
import { useSession } from "../lib/session";
import { validAmount } from "../lib/logic";
import { Action, Button, Card, Chips, Field, ResourceState, s } from "./ui";

export function Payment({
  roomId,
  price,
  onComplete,
}: {
  roomId?: string;
  price?: string;
  onComplete: () => void;
}) {
  const { request, profile } = useSession();
  const [method, setMethod] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState(profile?.email || "");
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState<{
    id: string;
    checkoutUrl: string;
  } | null>(null);
  const [status, setStatus] = useState("");
  const [restoring, setRestoring] = useState(true);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const storageKey = profile
    ? `audioblocks.payment.${profile.id}.${roomId || "pool"}`
    : null;
  useEffect(() => {
    let active = true;
    setPending(null);
    setRestoring(true);
    setRecoveryError(null);
    if (!storageKey || Platform.OS === "web") {
      setRestoring(false);
      return;
    }
    void SecureStore.getItemAsync(storageKey)
      .then((value) => {
        if (!active || !value) return;
        const saved = JSON.parse(value);
        if (
          typeof saved.id !== "string" ||
          typeof saved.checkoutUrl !== "string" ||
          !saved.checkoutUrl.startsWith("https://")
        )
          throw new Error("Invalid saved checkout.");
        setPending(saved);
        setStatus("awaiting confirmation");
      })
      .catch(() => {
        if (active)
          setRecoveryError(
            "Could not restore the last checkout. Check your transactions before starting another payment.",
          );
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, [storageKey]);
  const currency =
    method === "Naira" ? "NGN" : method === "Card" ? "USD" : "USDC";
  const check = async (id: string) => {
    const result = await request<{ status: string }>(
      roomId
        ? `/api/rooms/ticket/${id}/status`
        : `/api/pool/deposit/fiat/${id}/status`,
      { authenticated: true },
    );
    setStatus(result.status);
    if (
      (result.status === "succeeded" || result.status === "failed") &&
      storageKey &&
      Platform.OS !== "web"
    )
      await SecureStore.deleteItemAsync(storageKey);
    if (result.status === "succeeded") {
      setPending(null);
      setReview(false);
      onComplete();
      Alert.alert(
        "Payment complete",
        roomId
          ? "Your Room ticket is ready."
          : "Thank you for supporting the artists.",
      );
    }
    if (result.status === "failed") {
      setPending(null);
      setReview(false);
    }
  };
  if (!profile || profile.role !== "listener")
    return (
      <Text style={s.muted}>
        Payments are available to signed-in listeners.
      </Text>
    );
  if (restoring || recoveryError)
    return <ResourceState loading={restoring} error={recoveryError} />;
  return (
    <Card>
      <Text style={s.label}>
        {roomId ? "Unlock this Room" : "Fund the community pool"}
      </Text>
      <Text style={s.muted}>
        {roomId
          ? `Ticket price: ${price} USDC. Card and Naira totals are shown at checkout.`
          : "Your contribution supports the top artists each round."}
      </Text>
      {!pending && (
        <>
          <Chips
            items={["USDC", "Card", "Naira"]}
            selected={method}
            onSelect={(v) => {
              setMethod(v);
              setReview(false);
            }}
          />
          {!roomId && (
            <Field
              label={`Amount (${currency})`}
              value={amount}
              onChangeText={(v) => {
                setAmount(v);
                setReview(false);
              }}
              keyboardType="decimal-pad"
              placeholder={method === "Naira" ? "5000" : "10.00"}
            />
          )}
          {method === "Naira" && (
            <Field
              label="Email for Paystack"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setReview(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
          {!review ? (
            <Button
              onPress={() => {
                if (
                  !roomId &&
                  !validAmount(amount, method === "USDC" ? 6 : 2)
                ) {
                  Alert.alert(
                    "Enter an amount",
                    "Use a positive amount without commas.",
                  );
                  return;
                }
                if (
                  method === "Naira" &&
                  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ) {
                  Alert.alert(
                    "Email required",
                    "Enter a valid email address for checkout.",
                  );
                  return;
                }
                setReview(true);
              }}
            >
              Review payment
            </Button>
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={s.text}>
                {roomId
                  ? `Purchase a ticket for ${price} USDC`
                  : `Contribute ${amount} ${currency}`}{" "}
                using{" "}
                {method === "USDC"
                  ? "your AudioBlocks wallet"
                  : method === "Card"
                    ? "card checkout"
                    : "Paystack"}
                . {method === "USDC" && "This transfer cannot be undone."}
              </Text>
              <Action
                label={
                  method === "USDC" ? "Confirm payment" : "Continue to checkout"
                }
                run={async () => {
                  const provider = method === "Card" ? "stripe" : "paystack";
                  const path = roomId
                    ? `/api/rooms/${roomId}/ticket/${method === "USDC" ? "crypto" : `${provider}/init`}`
                    : `/api/pool/deposit${method === "USDC" ? "" : `/fiat/${provider}/init`}`;
                  const body = {
                    ...(!roomId ? { amount } : {}),
                    ...(method === "Naira" ? { email: email.trim() } : {}),
                  };
                  const result = await request<{
                    checkoutUrl?: string;
                    ticketId?: string;
                    fiatDepositId?: string;
                  }>(path, { method: "POST", body, authenticated: true });
                  if (method === "USDC") {
                    setReview(false);
                    setAmount("");
                    onComplete();
                    Alert.alert(
                      "Payment complete",
                      roomId
                        ? "Your Room is unlocked."
                        : "Your deposit was confirmed.",
                    );
                    return;
                  }
                  const id = result.ticketId || result.fiatDepositId;
                  if (
                    !id ||
                    !result.checkoutUrl ||
                    !/^https:\/\//.test(result.checkoutUrl)
                  )
                    throw new Error(
                      "The server did not return a secure checkout URL.",
                    );
                  setPending({ id, checkoutUrl: result.checkoutUrl });
                  if (storageKey && Platform.OS !== "web")
                    await SecureStore.setItemAsync(
                      storageKey,
                      JSON.stringify({ id, checkoutUrl: result.checkoutUrl }),
                    );
                  setStatus("pending");
                  await WebBrowser.openBrowserAsync(result.checkoutUrl);
                  await check(id);
                }}
              />
              <Button secondary onPress={() => setReview(false)}>
                Back
              </Button>
            </View>
          )}
        </>
      )}
      {pending && (
        <>
          <Text style={s.text}>
            Payment status: {status}. Confirmation comes from the payment
            provider.
          </Text>
          <Action label="Check payment status" run={() => check(pending.id)} />
          <Action
            secondary
            label="Reopen checkout"
            run={async () => {
              await WebBrowser.openBrowserAsync(pending.checkoutUrl);
              await check(pending.id);
            }}
          />
          <Text style={s.muted}>
            Return here after checkout and check the status. Closing checkout
            does not confirm payment.
          </Text>
        </>
      )}
    </Card>
  );
}
