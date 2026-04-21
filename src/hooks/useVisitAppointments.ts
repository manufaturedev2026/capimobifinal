import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VisitStatus = "confirmada" | "pendente" | "reagendada" | "cancelada" | "fechada";

export interface VisitAppointment {
  id: string;
  user_id: string;
  seller_id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  item_id: string | null;
  property_type: string | null;
  property_code: string | null;
  address: string | null;
  city: string | null;
  visit_date: string; // YYYY-MM-DD
  visit_time: string; // HH:MM:SS
  team_member_id: string | null;
  responsible_name: string | null;
  status: VisitStatus;
  notes: string | null;
  outcome: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisitInput {
  client_name: string;
  client_phone?: string | null;
  client_email?: string | null;
  item_id?: string | null;
  property_type?: string | null;
  property_code?: string | null;
  address?: string | null;
  city?: string | null;
  visit_date: string;
  visit_time: string;
  team_member_id?: string | null;
  responsible_name?: string | null;
  status?: VisitStatus;
  notes?: string | null;
}

export const STATUS_META: Record<VisitStatus, { label: string; color: string; bg: string; dot: string }> = {
  confirmada: { label: "Confirmada", color: "text-emerald-700", bg: "bg-emerald-100", dot: "bg-emerald-500" },
  pendente:   { label: "Pendente",   color: "text-amber-700",   bg: "bg-amber-100",   dot: "bg-amber-500" },
  reagendada: { label: "Reagendada", color: "text-blue-700",    bg: "bg-blue-100",    dot: "bg-blue-500" },
  cancelada:  { label: "Cancelada",  color: "text-red-700",     bg: "bg-red-100",     dot: "bg-red-500" },
  fechada:    { label: "Fechada",    color: "text-purple-700",  bg: "bg-purple-100",  dot: "bg-purple-500" },
};

export function useVisitAppointments(userId?: string, sellerId?: string) {
  const [visits, setVisits] = useState<VisitAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("visit_appointments")
      .select("*")
      .order("visit_date", { ascending: true })
      .order("visit_time", { ascending: true });
    if (!error) setVisits((data as VisitAppointment[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const createVisit = async (input: VisitInput) => {
    if (!userId || !sellerId) throw new Error("Usuário não autenticado");
    const { data, error } = await supabase
      .from("visit_appointments")
      .insert({ ...input, user_id: userId, seller_id: sellerId })
      .select()
      .single();
    if (error) throw error;
    setVisits((p) => [...p, data as VisitAppointment].sort((a, b) =>
      `${a.visit_date} ${a.visit_time}`.localeCompare(`${b.visit_date} ${b.visit_time}`)
    ));
    return data as VisitAppointment;
  };

  const updateVisit = async (id: string, patch: Partial<VisitInput> & { status?: VisitStatus; outcome?: string | null }) => {
    const { data, error } = await supabase
      .from("visit_appointments")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    setVisits((p) => p.map((v) => (v.id === id ? (data as VisitAppointment) : v)));
    return data as VisitAppointment;
  };

  const deleteVisit = async (id: string) => {
    const { error } = await supabase.from("visit_appointments").delete().eq("id", id);
    if (error) throw error;
    setVisits((p) => p.filter((v) => v.id !== id));
  };

  return { visits, loading, refetch: fetchVisits, createVisit, updateVisit, deleteVisit };
}
