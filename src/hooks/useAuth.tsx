import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];

interface BanInfo {
  is_banned: boolean;
  reason: string | null;
  expires_at: string | null;
  is_permanent: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  banInfo: BanInfo | null;
  signUp: (email: string, password: string, fullName: string, phone?: string, city?: string, state?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);

  const checkBan = async (userId: string) => {
    const { data } = await supabase
      .from("user_bans")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      const ban = data[0] as any;
      // Check if temporary ban has expired
      if (!ban.is_permanent && ban.expires_at && new Date(ban.expires_at) < new Date()) {
        setBanInfo(null);
        return;
      }
      setBanInfo({
        is_banned: true,
        reason: ban.reason,
        expires_at: ban.expires_at,
        is_permanent: ban.is_permanent,
      });
    } else {
      setBanInfo(null);
    }
  };

  const fetchProfile = async (userId: string) => {
    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // JWT expired — try refresh once before giving up (don't wipe profile)
    if (error && (error.code === "PGRST303" || /jwt/i.test(error.message || ""))) {
      try {
        await supabase.auth.refreshSession();
      } catch {}
      const retry = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("Erro ao carregar perfil:", error);
      // Keep current profile to avoid flashing a "Vendedor" fallback on transient errors
      return null;
    }

    setProfile(data);
    return data;
  };

  const ensureProfile = async (authUser: User, signupData?: { fullName?: string; phone?: string; city?: string; state?: string }) => {
    const metadata = authUser.user_metadata ?? {};
    const metadataProfile = {
      full_name:
        signupData?.fullName?.trim() ||
        (typeof metadata.full_name === "string" && metadata.full_name.trim()
          ? metadata.full_name.trim()
          : authUser.email?.split("@")[0] ?? "Novo usuário"),
      email: authUser.email ?? "",
      phone: signupData?.phone?.trim() || (typeof metadata.phone === "string" && metadata.phone.trim() ? metadata.phone.trim() : null),
      city: signupData?.city?.trim() || (typeof metadata.city === "string" && metadata.city.trim() ? metadata.city.trim() : null),
      state: signupData?.state?.trim() || (typeof metadata.state === "string" && metadata.state.trim() ? metadata.state.trim() : null),
    };

    let fetchErrored = false;
    const fetchRes = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    let existingProfile = fetchRes.data;
    if (fetchRes.error) {
      if (fetchRes.error.code === "PGRST303" || /jwt/i.test(fetchRes.error.message || "")) {
        try { await supabase.auth.refreshSession(); } catch {}
        const retry = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle();
        existingProfile = retry.data;
        fetchErrored = !!retry.error;
      } else {
        fetchErrored = true;
      }
    }
    if (existingProfile) {
      setProfile(existingProfile);
    }
    if (fetchErrored) {
      // Don't try to insert on a transient error — keep current profile state
      return null;
    }
    if (existingProfile) {
      const profileUpdates: Partial<ProfileInsert> = {};
      if (signupData?.fullName?.trim()) profileUpdates.full_name = metadataProfile.full_name;
      else if (!existingProfile.full_name?.trim() || existingProfile.full_name === authUser.email?.split("@")[0]) profileUpdates.full_name = metadataProfile.full_name;
      if (!existingProfile.email?.trim() && metadataProfile.email) profileUpdates.email = metadataProfile.email;
      if (signupData?.phone?.trim()) profileUpdates.phone = metadataProfile.phone;
      else if (!existingProfile.phone?.trim() && metadataProfile.phone) profileUpdates.phone = metadataProfile.phone;
      if (signupData?.city?.trim()) profileUpdates.city = metadataProfile.city;
      else if (!existingProfile.city?.trim() && metadataProfile.city) profileUpdates.city = metadataProfile.city;
      if (signupData?.state?.trim()) profileUpdates.state = metadataProfile.state;
      else if (!existingProfile.state?.trim() && metadataProfile.state) profileUpdates.state = metadataProfile.state;

      if (Object.keys(profileUpdates).length > 0) {
        const { data, error } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("user_id", authUser.id)
          .select("*")
          .maybeSingle();

        if (!error && data) {
          setProfile(data);
          return data;
        }
      }

      return existingProfile;
    }

    const profilePayload: ProfileInsert = {
      user_id: authUser.id,
      ...metadataProfile,
      store_layout: "marketplace",
      store_theme: "espirito-santo",
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert(profilePayload)
      .select("*")
      .maybeSingle();

    if (error) {
      // 23505 = duplicate key — outro caller (signUp + onAuthStateChange) já criou o perfil.
      // Em vez de zerar o estado, recarrega o perfil existente.
      if (error.code === "23505") {
        const existing = await ensureProfile(authUser, signupData);
        return existing;
      }
      console.error("Erro ao criar perfil automaticamente:", error);
      // If the auth user no longer exists (FK violation), sign out the stale session
      if (error.code === "23503") {
        await supabase.auth.signOut();
      }
      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          setTimeout(() => {
            void ensureProfile(nextSession.user);
            void checkBan(nextSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        try {
          await ensureProfile(currentSession.user);
          await checkBan(currentSession.user.id);
        } catch (e) {
          console.warn("Falha ao carregar perfil/ban (rede):", e);
        }
      } else {
        setProfile(null);
        setBanInfo(null);
      }

      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string, city?: string, state?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, city, state },
        emailRedirectTo: window.location.origin,
      },
    });

    if (!error && data.user) {
      try {
        await ensureProfile(data.user, { fullName, phone, city, state });
        await checkBan(data.user.id);
      } catch (profileError) {
        console.warn("Falha ao garantir perfil após cadastro:", profileError);
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await ensureProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, banInfo, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
