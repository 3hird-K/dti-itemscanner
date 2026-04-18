"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { createClient } from "@/lib/supabase/client";

const OnlinePresenceContext = createContext<string[]>([]);

export function OnlinePresenceProvider({ children }: { children: React.ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;
    let channel: any = null;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!isMounted || !user) return;

      channel = supabase.channel("online-users-global", {
        config: {
          presence: {
            key: user.id,
          },
        },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const newState = channel.presenceState();
          const onlineIds: string[] = [];
          for (const key in newState) {
            // @ts-ignore
            const presenceRecords = newState[key];
            presenceRecords.forEach((record: any) => {
              if (record.user_id && !onlineIds.includes(record.user_id)) {
                onlineIds.push(record.user_id);
              }
            });
          }
          setOnlineUsers(onlineIds);
        })
        .subscribe(async (status: string) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    return () => {
      isMounted = false;
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  return (
    <OnlinePresenceContext.Provider value={onlineUsers}>
      {children}
    </OnlinePresenceContext.Provider>
  );
}

export function useOnlinePresence() {
  return useContext(OnlinePresenceContext);
}
