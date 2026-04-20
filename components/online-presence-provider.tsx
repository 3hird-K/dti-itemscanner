"use client";

import {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

const OnlinePresenceContext = createContext<string[]>([]);

export function OnlinePresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  // Keep a stable supabase client instance for the lifetime of this component
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    const supabase = supabaseRef.current!;
    let channel: RealtimeChannel | null = null;

    // ----- helpers -----
    const teardown = () => {
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
        channel = null;
      }
      setOnlineUsers([]);
    };

    const setupPresence = async (userId: string) => {
      // Clean up any existing channel first
      teardown();

      channel = supabase.channel("online-users-global", {
        config: {
          presence: { key: userId },
        },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          if (!channel) return;
          const state = channel.presenceState();
          // Since user.id is the presence key, Object.keys gives us all online user IDs
          setOnlineUsers(Object.keys(state));
        })
        .on("presence", { event: "join" }, ({ key }) => {
          // Optimistically add when a user joins before sync fires
          setOnlineUsers((prev) =>
            prev.includes(key) ? prev : [...prev, key]
          );
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          setOnlineUsers((prev) => prev.filter((id) => id !== key));
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED" && channel) {
            await channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          }

          // Reconnect automatically on channel error or closed state
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn(
              "[OnlinePresence] Channel issue detected, reconnecting…",
              status
            );
            // Brief delay before reconnect to avoid tight loops
            setTimeout(() => setupPresence(userId), 3_000);
          }
        });
    };

    // ----- drive presence off auth state -----
    // This fires immediately with the current session AND on every future
    // sign-in / sign-out, so we never miss the initial authenticated state.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setupPresence(session.user.id);
        } else {
          // User logged out — stop broadcasting presence
          teardown();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      teardown();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <OnlinePresenceContext.Provider value={onlineUsers}>
      {children}
    </OnlinePresenceContext.Provider>
  );
}

export function useOnlinePresence() {
  return useContext(OnlinePresenceContext);
}