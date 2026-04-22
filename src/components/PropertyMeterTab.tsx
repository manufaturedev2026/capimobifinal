import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Camera, Copy, Edit3, FileText, Home, ImagePlus, Link2, Mail, MessageCircle, MoveDown, MoveUp, Plus, Ruler, Save, Share2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type MeasuredProperty = {
  id: string;
  user_id: string;
  name: string;
  property_type: string;
  address: string | null;
  city: string;
  neighborhood: string;
  notes: string | null;
  total_area: number;
  land_width: number | null;
  land_length: number | null;
  land_area_manual: number | null;
  measured_by: string | null;
  created_at: string;
  updated_at: string;
};

type MeasuredRoom = {
  id: string;
  property_id: string;
  user_id: string;
  name: string;
  room_type: string;
  shape: string;
  width: number | null;
  length: number | null;
  height: number | null;
  base: number | null;
  side_a: number | null;
  side_b: number | null;
  area: number;
  area_type: string;
  notes: string | null;
};

type MeasuredPhoto = {
  id: string;
  property_id: string;
  user_id: string;
  image_url: string;
  category: string;
  sort_order: number;
};

type PropertyForm = {
  name: string;
  property_type: string;
  address: string;
  city: string;
  neighborhood: string;
  land_width: string;
  land_length: string;
  land_area_manual: string;
  measured_by: string;
  notes: string;
};

type RoomForm = {
  name: string;
  room_type: string;
  shape: string;
  area_type: string;
  width: string;
  length: string;
  height: string;
  base: string;
  side_a: string;
  side_b: string;
  area: string;
  notes: string;
};

const propertyTypes = ["Casa", "Apartamento", "Terreno", "Comercial", "Rural"];
const roomTypes = ["Sala", "Quarto", "Suíte", "Cozinha", "Banheiro", "Corredor", "Garagem", "Varanda", "Área gourmet", "Área de serviço", "Escritório", "Outro"];
const shapes = ["Retângulo / Quadrado", "Triângulo Retângulo", "Formato em L", "Trapézio", "Circular", "Manual"];
const areaTypes = ["Interna útil", "Construída coberta", "Externa descoberta", "Terreno"];
const photoCategories = ["Fachada", "Sala", "Quartos", "Cozinha", "Banheiros", "Área externa", "Garagem", "Outros"];
const themedPrimaryButton = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20";
const themedOutlineButton = "border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground";

const emptyPropertyForm: PropertyForm = {
  name: "",
  property_type: "Casa",
  address: "",
  city: "",
  neighborhood: "",
  land_width: "",
  land_length: "",
  land_area_manual: "",
  measured_by: "",
  notes: "",
};

const emptyRoomForm: RoomForm = {
  name: "",
  room_type: "Sala",
  shape: "Retângulo / Quadrado",
  area_type: "Interna útil",
  width: "",
  length: "",
  height: "",
  base: "",
  side_a: "",
  side_b: "",
  area: "",
  notes: "",
};

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatArea = (area: number | null | undefined) => `${Number(area || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
const formatDateTime = (value: string) => new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

const calculateRoomArea = (room: RoomForm) => {
  const width = toNumber(room.width);
  const length = toNumber(room.length);
  const height = toNumber(room.height);
  const base = toNumber(room.base);
  const sideA = toNumber(room.side_a);
  const sideB = toNumber(room.side_b);

  switch (room.shape) {
    case "Retângulo":
    case "Retângulo / Quadrado":
      return width * length;
    case "Triângulo":
    case "Triângulo Retângulo":
      return (base * height) / 2;
    case "L":
    case "Formato em L":
      return width * length + sideA * sideB;
    case "Trapézio":
      return ((base + sideA) * height) / 2;
    case "Manual":
      return toNumber(room.area);
    case "Circular":
      return 3.1416 * sideA * sideA;
    default:
      return 0;
  }
};

const propertyToForm = (property: MeasuredProperty): PropertyForm => ({
  name: property.name,
  property_type: property.property_type,
  address: property.address || "",
  city: property.city,
  neighborhood: property.neighborhood,
  land_width: property.land_width?.toString() || "",
  land_length: property.land_length?.toString() || "",
  land_area_manual: property.land_area_manual?.toString() || "",
  measured_by: property.measured_by || "",
  notes: property.notes || "",
});

const roomToForm = (room: MeasuredRoom): RoomForm => ({
  name: room.name,
  room_type: room.room_type,
  shape: room.shape,
  area_type: room.area_type || "Interna útil",
  width: room.width?.toString() || "",
  length: room.length?.toString() || "",
  height: room.height?.toString() || "",
  base: room.base?.toString() || "",
  side_a: room.side_a?.toString() || "",
  side_b: room.side_b?.toString() || "",
  area: room.area?.toString() || "",
  notes: room.notes || "",
});

export default function PropertyMeterTab({ userId }: { userId: string }) {
  const { toast } = useToast();
  const db = useMemo(() => supabase as any, []);
  const [properties, setProperties] = useState<MeasuredProperty[]>([]);
  const [rooms, setRooms] = useState<MeasuredRoom[]>([]);
  const [photos, setPhotos] = useState<MeasuredPhoto[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<MeasuredProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [photoCategory, setPhotoCategory] = useState("Fachada");
  const [propertyForm, setPropertyForm] = useState<PropertyForm>(emptyPropertyForm);
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm);

  const measuredPropertiesTable = "measured_properties" as any;
  const measuredRoomsTable = "measured_rooms" as any;
  const measuredPhotosTable = "measured_property_photos" as any;
  const computedArea = useMemo(() => calculateRoomArea(roomForm), [roomForm]);
  const technicalAreas = useMemo(() => {
    const landArea = selectedProperty ? Number(selectedProperty.land_area_manual || 0) || Number(selectedProperty.land_width || 0) * Number(selectedProperty.land_length || 0) : 0;
    const usefulArea = rooms.filter((room) => room.area_type === "Interna útil").reduce((sum, room) => sum + Number(room.area || 0), 0);
    const coveredArea = rooms.filter((room) => room.area_type === "Construída coberta").reduce((sum, room) => sum + Number(room.area || 0), 0);
    const openArea = rooms.filter((room) => room.area_type === "Externa descoberta").reduce((sum, room) => sum + Number(room.area || 0), 0);
    const builtArea = usefulArea + coveredArea;
    const uncoveredArea = Math.max(landArea - builtArea, openArea, 0);
    return { builtArea, usefulArea, landArea, uncoveredArea };
  }, [rooms, selectedProperty]);
  const livePropertyTotal = useMemo(() => {
    const savedTotal = rooms.reduce((sum, room) => sum + Number(room.area || 0), 0);
    if (!editingRoomId && roomDialogOpen) return savedTotal + computedArea;
    if (editingRoomId && roomDialogOpen) {
      const currentRoomArea = rooms.find((room) => room.id === editingRoomId)?.area || 0;
      return savedTotal - Number(currentRoomArea) + computedArea;
    }
    return selectedProperty?.total_area ?? savedTotal;
  }, [computedArea, editingRoomId, roomDialogOpen, rooms, selectedProperty?.total_area]);

  const syncSelectedTotal = (propertyId: string, area: number) => {
    setSelectedProperty((prev) => (prev?.id === propertyId ? { ...prev, total_area: Number(area.toFixed(2)), updated_at: new Date().toISOString() } : prev));
    setProperties((prev) => prev.map((property) => property.id === propertyId ? { ...property, total_area: Number(area.toFixed(2)), updated_at: new Date().toISOString() } : property));
  };

  const fetchProperties = useCallback(async () => {
    const { data, error } = await db
      .from(measuredPropertiesTable)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar imóveis", description: error.message, variant: "destructive" });
    } else {
      setProperties((data || []) as MeasuredProperty[]);
      if (selectedProperty) {
        const updated = (data || []).find((p: any) => p.id === selectedProperty.id) as MeasuredProperty | undefined;
        if (updated) setSelectedProperty(updated);
      }
    }
    setLoading(false);
  }, [db, measuredPropertiesTable, selectedProperty, toast, userId]);

  const fetchRooms = useCallback(async (propertyId: string) => {
    const { data, error } = await db
      .from(measuredRoomsTable)
      .select("*")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar ambientes", description: error.message, variant: "destructive" });
    } else {
      setRooms((data || []) as MeasuredRoom[]);
    }
  }, [db, measuredRoomsTable, toast, userId]);

  const fetchPhotos = useCallback(async (propertyId: string) => {
    const { data, error } = await db
      .from(measuredPhotosTable)
      .select("*")
      .eq("property_id", propertyId)
      .eq("user_id", userId)
      .order("sort_order", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar fotos", description: error.message, variant: "destructive" });
    } else {
      setPhotos((data || []) as MeasuredPhoto[]);
    }
  }, [db, measuredPhotosTable, toast, userId]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (selectedProperty?.id) {
      fetchRooms(selectedProperty.id);
      fetchPhotos(selectedProperty.id);
    }
  }, [fetchPhotos, fetchRooms, selectedProperty?.id]);

  const openNewProperty = () => {
    setEditingPropertyId(null);
    setPropertyForm(emptyPropertyForm);
    setPropertyDialogOpen(true);
  };

  const openEditProperty = (property: MeasuredProperty) => {
    setEditingPropertyId(property.id);
    setPropertyForm(propertyToForm(property));
    setPropertyDialogOpen(true);
  };

  const saveProperty = async () => {
    if (!propertyForm.name.trim() || !propertyForm.city.trim() || !propertyForm.neighborhood.trim()) {
      toast({ title: "Preencha nome, cidade e bairro", variant: "destructive" });
      return;
    }

    const payload = {
      user_id: userId,
      name: propertyForm.name.trim(),
      property_type: propertyForm.property_type,
      address: propertyForm.address.trim() || null,
      city: propertyForm.city.trim(),
      neighborhood: propertyForm.neighborhood.trim(),
      land_width: toNumber(propertyForm.land_width) || null,
      land_length: toNumber(propertyForm.land_length) || null,
      land_area_manual: toNumber(propertyForm.land_area_manual) || null,
      measured_by: propertyForm.measured_by.trim() || null,
      notes: propertyForm.notes.trim() || null,
    };

    if (editingPropertyId) {
      const { data, error } = await db.from(measuredPropertiesTable).update(payload).eq("id", editingPropertyId).select("*").single();
      if (error) {
        toast({ title: "Erro ao salvar imóvel", description: error.message, variant: "destructive" });
        return;
      }
      setSelectedProperty(data as MeasuredProperty);
      toast({ title: "Imóvel atualizado" });
    } else {
      const { data, error } = await db.from(measuredPropertiesTable).insert(payload).select("*").single();
      if (error) {
        toast({ title: "Erro ao criar imóvel", description: error.message, variant: "destructive" });
        return;
      }
      setSelectedProperty(data as MeasuredProperty);
      setRooms([]);
      toast({ title: "Imóvel criado" });
    }

    setPropertyDialogOpen(false);
    fetchProperties();
  };

  const deleteProperty = async (property: MeasuredProperty) => {
    if (!confirm(`Excluir "${property.name}" e todos os ambientes?`)) return;
    const { error } = await db.from(measuredPropertiesTable).delete().eq("id", property.id).eq("user_id", userId);
    if (error) {
      toast({ title: "Erro ao excluir imóvel", description: error.message, variant: "destructive" });
      return;
    }
    if (selectedProperty?.id === property.id) {
      setSelectedProperty(null);
      setRooms([]);
    }
    setProperties((prev) => prev.filter((p) => p.id !== property.id));
    toast({ title: "Imóvel excluído" });
  };

  const duplicateProperty = async (property: MeasuredProperty) => {
    const { data: copiedProperty, error } = await db
      .from(measuredPropertiesTable)
      .insert({
        user_id: userId,
        name: `${property.name} - Cópia`,
        property_type: property.property_type,
        address: property.address,
        city: property.city,
        neighborhood: property.neighborhood,
        land_width: property.land_width,
        land_length: property.land_length,
        land_area_manual: property.land_area_manual,
        measured_by: property.measured_by,
        notes: property.notes,
      })
      .select("*")
      .single();

    if (error || !copiedProperty) {
      toast({ title: "Erro ao duplicar imóvel", description: error?.message, variant: "destructive" });
      return;
    }

    const { data: originalRooms } = await db.from(measuredRoomsTable).select("*").eq("property_id", property.id).eq("user_id", userId);
    if (originalRooms?.length) {
      await db.from(measuredRoomsTable).insert(
        (originalRooms as MeasuredRoom[]).map((room) => ({
          property_id: (copiedProperty as MeasuredProperty).id,
          user_id: userId,
          name: room.name,
          room_type: room.room_type,
          shape: room.shape,
          area_type: room.area_type,
          width: room.width,
          length: room.length,
          height: room.height,
          base: room.base,
          side_a: room.side_a,
          side_b: room.side_b,
          area: room.area,
          notes: room.notes,
        })) as any,
      );
    }

    setSelectedProperty(copiedProperty as MeasuredProperty);
    toast({ title: "Imóvel duplicado" });
    fetchProperties();
    fetchRooms((copiedProperty as MeasuredProperty).id);
  };

  const openNewRoom = () => {
    setEditingRoomId(null);
    setRoomForm(emptyRoomForm);
    setRoomDialogOpen(true);
  };

  const backToProperties = () => {
    setRoomDialogOpen(false);
    setPropertyDialogOpen(false);
    setEditingRoomId(null);
    setEditingPropertyId(null);
    setSelectedProperty(null);
    setRooms([]);
  };

  const openEditRoom = (room: MeasuredRoom) => {
    setEditingRoomId(room.id);
    setRoomForm(roomToForm(room));
    setRoomDialogOpen(true);
  };

  const saveRoom = async () => {
    if (!selectedProperty || !roomForm.name.trim()) {
      toast({ title: "Informe o nome do ambiente", variant: "destructive" });
      return;
    }

    const area = Number(computedArea.toFixed(2));
    if (area <= 0) {
      toast({ title: "Informe medidas válidas", description: "A área calculada precisa ser maior que zero.", variant: "destructive" });
      return;
    }

    const payload = {
      property_id: selectedProperty.id,
      user_id: userId,
      name: roomForm.name.trim(),
      room_type: roomForm.room_type,
      shape: roomForm.shape,
      area_type: roomForm.area_type,
      width: toNumber(roomForm.width) || null,
      length: toNumber(roomForm.length) || null,
      height: toNumber(roomForm.height) || null,
      base: toNumber(roomForm.base) || null,
      side_a: toNumber(roomForm.side_a) || null,
      side_b: toNumber(roomForm.side_b) || null,
      area,
      notes: roomForm.notes.trim() || null,
    };

    const request = editingRoomId
      ? db.from(measuredRoomsTable).update(payload).eq("id", editingRoomId).eq("user_id", userId)
      : db.from(measuredRoomsTable).insert(payload);
    const { error } = await request;

    if (error) {
      toast({ title: "Erro ao salvar ambiente", description: error.message, variant: "destructive" });
      return;
    }

    setRoomDialogOpen(false);
    toast({ title: editingRoomId ? "Ambiente atualizado" : "Ambiente adicionado" });
    await fetchRooms(selectedProperty.id);
    await fetchProperties();
  };

  const deleteRoom = async (room: MeasuredRoom) => {
    if (!confirm(`Excluir ambiente "${room.name}"?`)) return;
    const { error } = await db.from(measuredRoomsTable).delete().eq("id", room.id).eq("user_id", userId);
    if (error) {
      toast({ title: "Erro ao excluir ambiente", description: error.message, variant: "destructive" });
      return;
    }
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    toast({ title: "Ambiente excluído" });
    await fetchProperties();
  };

  const duplicateRoom = async (room: MeasuredRoom) => {
    if (!selectedProperty) return;
    const { error } = await db.from(measuredRoomsTable).insert({
      property_id: selectedProperty.id,
      user_id: userId,
      name: `${room.name} - Cópia`,
      room_type: room.room_type,
      shape: room.shape,
      area_type: room.area_type,
      width: room.width,
      length: room.length,
      height: room.height,
      base: room.base,
      side_a: room.side_a,
      side_b: room.side_b,
      area: room.area,
      notes: room.notes,
    });
    if (error) {
      toast({ title: "Erro ao duplicar ambiente", description: error.message, variant: "destructive" });
      return;
    }
    const updatedTotal = rooms.reduce((sum, item) => sum + Number(item.area || 0), 0) + Number(room.area || 0);
    syncSelectedTotal(selectedProperty.id, updatedTotal);
    toast({ title: "Ambiente duplicado" });
    await fetchRooms(selectedProperty.id);
    await fetchProperties();
  };

  const uploadPhotos = async (files: FileList | null) => {
    if (!selectedProperty || !files?.length) return;
    for (const file of Array.from(files)) {
      const path = `${userId}/measurements/${selectedProperty.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("seller-uploads").upload(path, file, { upsert: false });
      if (uploadError) {
        toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
        continue;
      }
      const { data: publicUrl } = supabase.storage.from("seller-uploads").getPublicUrl(path);
      await db.from(measuredPhotosTable).insert({ property_id: selectedProperty.id, user_id: userId, image_url: publicUrl.publicUrl, category: photoCategory, sort_order: photos.length + 1 });
    }
    toast({ title: "Fotos adicionadas" });
    fetchPhotos(selectedProperty.id);
  };

  const deletePhoto = async (photo: MeasuredPhoto) => {
    const { error } = await db.from(measuredPhotosTable).delete().eq("id", photo.id).eq("user_id", userId);
    if (error) return toast({ title: "Erro ao excluir foto", description: error.message, variant: "destructive" });
    setPhotos((prev) => prev.filter((item) => item.id !== photo.id));
  };

  const movePhoto = async (photo: MeasuredPhoto, direction: -1 | 1) => {
    const index = photos.findIndex((item) => item.id === photo.id);
    const swap = photos[index + direction];
    if (!swap) return;
    await Promise.all([
      db.from(measuredPhotosTable).update({ sort_order: swap.sort_order }).eq("id", photo.id).eq("user_id", userId),
      db.from(measuredPhotosTable).update({ sort_order: photo.sort_order }).eq("id", swap.id).eq("user_id", userId),
    ]);
    if (selectedProperty) fetchPhotos(selectedProperty.id);
  };

  const shareText = selectedProperty ? `${selectedProperty.name}\nÁrea total: ${formatArea(livePropertyTotal)}\n${selectedProperty.address ? `${selectedProperty.address}\n` : ""}${selectedProperty.neighborhood}, ${selectedProperty.city}\nAmbientes: ${rooms.map((room) => `${room.name} (${formatArea(room.area)})`).join(", ")}` : "";
  const shareUrl = selectedProperty ? `${window.location.origin}/painel?medidor=${selectedProperty.id}` : window.location.href;

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    toast({ title: "Link copiado" });
  };

  const reportRows = selectedProperty ? [
    ["Imóvel", selectedProperty.name],
    ["Tipo", selectedProperty.property_type],
    ["Endereço", selectedProperty.address || "Não informado"],
    ["Cidade / Bairro", `${selectedProperty.city} / ${selectedProperty.neighborhood}`],
    ["Data da medição", formatDateTime(selectedProperty.updated_at)],
    ["Área construída", formatArea(technicalAreas.builtArea)],
    ["Área útil interna", formatArea(technicalAreas.usefulArea)],
    ["Terreno total", formatArea(technicalAreas.landArea)],
    ["Área externa descoberta", formatArea(technicalAreas.uncoveredArea)],
    ["Responsável", selectedProperty.measured_by || "Não informado"],
  ] : [];

  const measurementFields = () => {
    if (roomForm.shape === "Manual") {
      return <Field label="Área total (m²)" value={roomForm.area} onChange={(value) => setRoomForm((prev) => ({ ...prev, area: value }))} />;
    }
    if (roomForm.shape === "Triângulo" || roomForm.shape === "Triângulo Retângulo") {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Base (m)" value={roomForm.base} onChange={(value) => setRoomForm((prev) => ({ ...prev, base: value }))} />
          <Field label="Altura (m)" value={roomForm.height} onChange={(value) => setRoomForm((prev) => ({ ...prev, height: value }))} />
        </div>
      );
    }
    if (roomForm.shape === "Trapézio") {
      return (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Base maior" value={roomForm.base} onChange={(value) => setRoomForm((prev) => ({ ...prev, base: value }))} />
          <Field label="Base menor" value={roomForm.side_a} onChange={(value) => setRoomForm((prev) => ({ ...prev, side_a: value }))} />
          <Field label="Altura" value={roomForm.height} onChange={(value) => setRoomForm((prev) => ({ ...prev, height: value }))} />
        </div>
      );
    }
    if (roomForm.shape === "Circular") {
      return <Field label="Raio (m)" value={roomForm.side_a} onChange={(value) => setRoomForm((prev) => ({ ...prev, side_a: value }))} />;
    }
    if (roomForm.shape === "L" || roomForm.shape === "Formato em L") {
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Largura bloco 1" value={roomForm.width} onChange={(value) => setRoomForm((prev) => ({ ...prev, width: value }))} />
          <Field label="Comprimento bloco 1" value={roomForm.length} onChange={(value) => setRoomForm((prev) => ({ ...prev, length: value }))} />
          <Field label="Largura bloco 2" value={roomForm.side_a} onChange={(value) => setRoomForm((prev) => ({ ...prev, side_a: value }))} />
          <Field label="Comprimento bloco 2" value={roomForm.side_b} onChange={(value) => setRoomForm((prev) => ({ ...prev, side_b: value }))} />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 gap-3">
        <Field label="Largura (m)" value={roomForm.width} onChange={(value) => setRoomForm((prev) => ({ ...prev, width: value }))} />
        <Field label="Comprimento (m)" value={roomForm.length} onChange={(value) => setRoomForm((prev) => ({ ...prev, length: value }))} />
      </div>
    );
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="h-9 w-9 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>;
  }

  return (
    <div className="min-h-[70vh] space-y-5">
      {!selectedProperty ? (
        <>
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 shadow-sm">
            <div className="absolute right-0 top-0 h-28 w-28 -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/10" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Ruler size={23} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-extrabold text-foreground">Medidor de Imóveis</h2>
                  <p className="text-sm text-muted-foreground">Imóveis, ambientes e metragem total em um só lugar.</p>
                </div>
              </div>
              <Button onClick={openNewProperty} className={`h-12 rounded-2xl font-bold ${themedPrimaryButton}`}>
                <Plus size={18} /> Novo Imóvel
              </Button>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <Ruler size={48} className="mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-display text-xl font-bold text-foreground">Nenhum imóvel medido</h3>
              <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro imóvel para começar a adicionar ambientes.</p>
              <Button onClick={openNewProperty} className={`mt-6 rounded-2xl ${themedPrimaryButton}`}>
                <Plus size={16} /> Novo Imóvel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="group rounded-3xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl"
                >
                  <button type="button" onClick={() => setSelectedProperty(property)} className="w-full text-left">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Home size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-display text-lg font-bold text-foreground">{property.name}</h3>
                          <p className="truncate text-xs text-muted-foreground">{property.property_type} • {property.neighborhood}, {property.city}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-primary/8 p-4">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Metragem total</p>
                      <p className="mt-1 font-display text-3xl font-extrabold text-primary">{formatArea(property.total_area)}</p>
                      <p className="mt-2 text-[11px] font-medium text-muted-foreground">Última edição: {formatDateTime(property.updated_at)}</p>
                    </div>
                  </button>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <IconAction title="Abrir" onClick={() => setSelectedProperty(property)}><Ruler size={16} /></IconAction>
                    <IconAction title="Editar" onClick={() => openEditProperty(property)}><Edit3 size={16} /></IconAction>
                    <IconAction title="Duplicar" onClick={() => duplicateProperty(property)}><Copy size={16} /></IconAction>
                    <IconAction title="Excluir" destructive onClick={() => deleteProperty(property)}><Trash2 size={16} /></IconAction>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <button type="button" onClick={backToProperties} className="mb-4 flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80">
              <ArrowLeft size={17} /> Voltar para imóveis
            </button>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{selectedProperty.property_type}</p>
                <h2 className="font-display text-3xl font-extrabold text-foreground">{selectedProperty.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedProperty.neighborhood}, {selectedProperty.city}</p>
              </div>
              <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg shadow-primary/20">
                <p className="text-xs font-semibold opacity-80">Área Total Atual</p>
                <p className="font-display text-3xl font-extrabold">{formatArea(livePropertyTotal)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={openNewRoom} className={`rounded-2xl ${themedPrimaryButton}`}><Plus size={16} /> Adicionar ambiente</Button>
              <Button variant="outline" onClick={() => openEditProperty(selectedProperty)} className={`rounded-2xl ${themedOutlineButton}`}><Edit3 size={16} /> Editar imóvel</Button>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <Plus size={42} className="mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-display text-xl font-bold text-foreground">Adicione o primeiro ambiente</h3>
              <p className="mt-1 text-sm text-muted-foreground">Cada sala, quarto, terreno ou área entra no cálculo total.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {rooms.map((room) => (
                <div key={room.id} className="rounded-3xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-primary">{room.room_type} • {room.shape}</p>
                      <h3 className="font-display text-lg font-bold text-foreground">{room.name}</h3>
                    </div>
                    <p className="rounded-2xl bg-primary/10 px-3 py-2 font-display text-lg font-extrabold text-primary">{formatArea(room.area)}</p>
                  </div>
                  {room.notes && <p className="mt-3 text-sm text-muted-foreground">{room.notes}</p>}
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditRoom(room)} className={`flex-1 rounded-xl ${themedOutlineButton}`}><Edit3 size={14} /> Editar</Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateRoom(room)} className={`rounded-xl ${themedOutlineButton}`}><Copy size={14} /></Button>
                    <Button size="sm" variant="outline" onClick={() => deleteRoom(room)} className="rounded-xl text-destructive hover:text-destructive"><Trash2 size={14} /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={propertyDialogOpen} onOpenChange={setPropertyDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingPropertyId ? "Editar imóvel" : "Novo imóvel"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nome do imóvel" value={propertyForm.name} onChange={(value) => setPropertyForm((prev) => ({ ...prev, name: value }))} />
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tipo</label>
              <Select value={propertyForm.property_type} onValueChange={(value) => setPropertyForm((prev) => ({ ...prev, property_type: value }))}>
                <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                <SelectContent>{propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Field label="Endereço opcional" value={propertyForm.address} onChange={(value) => setPropertyForm((prev) => ({ ...prev, address: value }))} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Cidade" value={propertyForm.city} onChange={(value) => setPropertyForm((prev) => ({ ...prev, city: value }))} />
              <Field label="Bairro" value={propertyForm.neighborhood} onChange={(value) => setPropertyForm((prev) => ({ ...prev, neighborhood: value }))} />
            </div>
            <TextArea label="Observações" value={propertyForm.notes} onChange={(value) => setPropertyForm((prev) => ({ ...prev, notes: value }))} />
            <Button onClick={saveProperty} className={`h-12 w-full rounded-2xl font-bold ${themedPrimaryButton}`}><Save size={16} /> {editingPropertyId ? "Salvar imóvel" : "Salvar e Abrir"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingRoomId ? "Editar ambiente" : "Adicionar ambiente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nome do ambiente" value={roomForm.name} onChange={(value) => setRoomForm((prev) => ({ ...prev, name: value }))} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Picker label="Tipo" value={roomForm.room_type} options={roomTypes} onChange={(value) => setRoomForm((prev) => ({ ...prev, room_type: value }))} />
              <Picker label="Formato" value={roomForm.shape} options={shapes} onChange={(value) => setRoomForm((prev) => ({ ...prev, shape: value }))} />
            </div>
            {measurementFields()}
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <p className="text-xs font-bold uppercase text-primary">Área calculada</p>
              <p className="font-display text-3xl font-extrabold text-primary">{formatArea(computedArea)}</p>
              <p className="mt-2 text-xs font-semibold text-muted-foreground">Total do imóvel em tempo real: {formatArea(livePropertyTotal)}</p>
            </div>
            <TextArea label="Observações" value={roomForm.notes} onChange={(value) => setRoomForm((prev) => ({ ...prev, notes: value }))} />
            <Button onClick={saveRoom} className={`h-12 w-full rounded-2xl font-bold ${themedPrimaryButton}`}><Save size={16} /> Salvar ambiente</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl" />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm text-foreground outline-none ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}

function Picker({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function IconAction({ title, destructive, onClick, children }: { title: string; destructive?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onClick={(event) => { event.stopPropagation(); onClick(); }}
      className={`flex h-11 items-center justify-center rounded-2xl border transition-all ${destructive ? "border-destructive/20 text-destructive hover:bg-destructive/10" : "border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"}`}
    >
      {children}
    </button>
  );
}
