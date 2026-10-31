import { useState } from "react";
import { Text } from "react-native";
import {
  Action,
  Button,
  Card,
  Field,
  Heading,
  ResourceState,
  Screen,
  s,
} from "../src/components/ui";
import { useSession } from "../src/lib/session";
import { useResource } from "../src/lib/useResource";
type AdminRound = {
  id: string;
  roundNumber: number;
  status: string;
  totalDeposited: string;
  voteCount: number;
  depositCount: number;
  closesAt: string | null;
};
export default function Admin() {
  const { profile, request } = useSession();
  const rounds = useResource<AdminRound[]>(
    profile?.role === "admin" ? "/api/pool/admin/rounds" : null,
  );
  const [duration, setDuration] = useState("24");
  const [confirm, setConfirm] = useState<string | null>(null);
  if (profile?.role !== "admin")
    return (
      <Screen>
        <Text style={s.text}>
          An admin account is required to manage rounds.
        </Text>
      </Screen>
    );
  return (
    <Screen>
      <Heading
        title="Voting rounds"
        subtitle="Open a round or close one early and pay its winners."
      />
      <Card>
        <Field
          label="New round duration (hours)"
          value={duration}
          onChangeText={setDuration}
          keyboardType="decimal-pad"
        />
        <Action
          label="Open voting round"
          disabled={rounds.data?.some((r) => r.status === "open")}
          run={async () => {
            if (!Number.isFinite(Number(duration)) || Number(duration) <= 0)
              throw new Error("Enter a positive duration.");
            await request("/api/pool/admin/rounds", {
              method: "POST",
              authenticated: true,
              body: { durationHours: Number(duration) },
            });
          }}
          onSuccess={rounds.reload}
        />
      </Card>
      <ResourceState
        loading={rounds.loading}
        error={rounds.error}
        retry={rounds.reload}
      />
      {rounds.data?.map((round) => (
        <Card key={round.id}>
          <Text style={s.title}>Round {round.roundNumber}</Text>
          <Text style={s.muted}>
            {round.status} · {round.voteCount} votes · {round.depositCount}{" "}
            deposits
          </Text>
          <Text style={s.label}>{round.totalDeposited} USDC deposited</Text>
          {round.status === "open" &&
            (confirm === round.id ? (
              <>
                <Text style={s.text}>
                  Closing this round triggers on-chain payouts to its winners.
                  This cannot be undone.
                </Text>
                <Action
                  label="Confirm close and payout"
                  run={() =>
                    request(`/api/pool/admin/rounds/${round.id}/close`, {
                      method: "POST",
                      authenticated: true,
                    })
                  }
                  onSuccess={() => {
                    setConfirm(null);
                    rounds.reload();
                  }}
                />
                <Button secondary onPress={() => setConfirm(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button secondary onPress={() => setConfirm(round.id)}>
                Close round early
              </Button>
            ))}
        </Card>
      ))}
    </Screen>
  );
}
