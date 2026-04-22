import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Camera, Copy, Edit3, FileText, Home, ImagePlus, MoveDown, MoveUp, Plus, Ruler, Save, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  state: string | null;
  reference_point: string | null;
  city: string;
  neighborhood: string;
  notes: string | null;
  asking_price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  iptu: number | null;
  condominium_fee: number | null;
  total_area: number;
  land_width: number | null;
  land_length: number | null;
  land_area_manual: number | null;
  measured_by: string | null;
  measurement_mode: string | null;
  external_shape: string | null;
  external_width: number | null;
  external_length: number | null;
  external_base: number | null;
  external_height: number | null;
  external_side_a: number | null;
  external_side_b: number | null;
  external_area_manual: number | null;
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
  room_id: string | null;
  sort_order: number;
};

type PropertyForm = {
  name: string;
  property_type: string;
  address: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  state: string;
  reference_point: string;
  city: string;
  neighborhood: string;
  asking_price: string;
  bedrooms: string;
  bathrooms: string;
  parking_spaces: string;
  iptu: string;
  condominium_fee: string;
  land_width: string;
  land_length: string;
  land_area_manual: string;
  measured_by: string;
  measurement_mode: string;
  external_shape: string;
  external_width: string;
  external_length: string;
  external_base: string;
  external_height: string;
  external_side_a: string;
  external_side_b: string;
  external_area_manual: string;
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
const measurementModes = ["Medição por Ambientes", "Medição Externa da Construção", "Medição do Terreno"];
const externalShapes = ["Retângulo", "L", "Triângulo", "Trapézio", "Irregular"];
const photoCategories = ["Fachada", "Sala", "Quartos", "Cozinha", "Banheiros", "Área externa", "Garagem", "Outros"];
const themedPrimaryButton = "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20";
const themedOutlineButton = "border-primary/25 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground";

const emptyPropertyForm: PropertyForm = {
  name: "",
  property_type: "Casa",
  address: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  state: "",
  reference_point: "",
  city: "",
  neighborhood: "",
  asking_price: "",
  bedrooms: "",
  bathrooms: "",
  parking_spaces: "",
  iptu: "",
  condominium_fee: "",
  land_width: "",
  land_length: "",
  land_area_manual: "",
  measured_by: "",
  measurement_mode: "Medição por Ambientes",
  external_shape: "Retângulo",
  external_width: "",
  external_length: "",
  external_base: "",
  external_height: "",
  external_side_a: "",
  external_side_b: "",
  external_area_manual: "",
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

const calculateExternalArea = (property: Pick<MeasuredProperty, "external_shape" | "external_width" | "external_length" | "external_base" | "external_height" | "external_side_a" | "external_side_b" | "external_area_manual">) => {
  const width = Number(property.external_width || 0);
  const length = Number(property.external_length || 0);
  const base = Number(property.external_base || 0);
  const height = Number(property.external_height || 0);
  const sideA = Number(property.external_side_a || 0);
  const sideB = Number(property.external_side_b || 0);
  switch (property.external_shape) {
    case "Retângulo": return width * length;
    case "L": return width * length + sideA * sideB;
    case "Triângulo": return (base * height) / 2;
    case "Trapézio": return ((base + sideA) * height) / 2;
    case "Irregular": return Number(property.external_area_manual || 0);
    default: return 0;
  }
};

const propertyToForm = (property: MeasuredProperty): PropertyForm => ({
  name: property.name,
  property_type: property.property_type,
  address: property.address || "",
  cep: property.cep || "",
  street: property.street || "",
  number: property.number || "",
  complement: property.complement || "",
  state: property.state || "",
  reference_point: property.reference_point || "",
  city: property.city,
  neighborhood: property.neighborhood,
  asking_price: property.asking_price?.toString() || "",
  bedrooms: property.bedrooms?.toString() || "",
  bathrooms: property.bathrooms?.toString() || "",
  parking_spaces: property.parking_spaces?.toString() || "",
  iptu: property.iptu?.toString() || "",
  condominium_fee: property.condominium_fee?.toString() || "",
  land_width: property.land_width?.toString() || "",
  land_length: property.land_length?.toString() || "",
  land_area_manual: property.land_area_manual?.toString() || "",
  measured_by: property.measured_by || "",
  measurement_mode: property.measurement_mode || "Medição por Ambientes",
  external_shape: property.external_shape || "Retângulo",
  external_width: property.external_width?.toString() || "",
  external_length: property.external_length?.toString() || "",
  external_base: property.external_base?.toString() || "",
  external_height: property.external_height?.toString() || "",
  external_side_a: property.external_side_a?.toString() || "",
  external_side_b: property.external_side_b?.toString() || "",
  external_area_manual: property.external_area_manual?.toString() || "",
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
  const navigate = useNavigate();
  const db = useMemo(() => supabase as any, []);
  const [properties, setProperties] = useState<MeasuredProperty[]>([]);
  const [rooms, setRooms] = useState<MeasuredRoom[]>([]);
  const [photos, setPhotos] = useState<MeasuredPhoto[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<MeasuredProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [photoCategory, setPhotoCategory] = useState("Fachada");
  const [photoRoomId, setPhotoRoomId] = useState("geral");
  const [propertyForm, setPropertyForm] = useState<PropertyForm>(emptyPropertyForm);
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm);

  const measuredPropertiesTable = "measured_properties" as any;
  const measuredRoomsTable = "measured_rooms" as any;
  const measuredPhotosTable = "measured_property_photos" as any;
  const computedArea = useMemo(() => calculateRoomArea(roomForm), [roomForm]);
  const technicalAreas = useMemo(() => {
    const landArea = selectedProperty ? Number(selectedProperty.land_area_manual || 0) || Number(selectedProperty.land_width || 0) * Number(selectedProperty.land_length || 0) : 0;
    const externalBuiltArea = selectedProperty ? calculateExternalArea(selectedProperty) : 0;
    const usefulArea = rooms.filter((room) => room.area_type === "Interna útil").reduce((sum, room) => sum + Number(room.area || 0), 0);
    const coveredArea = rooms.filter((room) => room.area_type === "Construída coberta").reduce((sum, room) => sum + Number(room.area || 0), 0);
    const openArea = rooms.filter((room) => room.area_type === "Externa descoberta").reduce((sum, room) => sum + Number(room.area || 0), 0);
    const builtArea = externalBuiltArea || usefulArea + coveredArea;
    const uncoveredArea = Math.max(landArea - builtArea, openArea, 0);
    const occupancyRate = landArea > 0 ? (builtArea / landArea) * 100 : 0;
    return { builtArea, usefulArea, landArea, uncoveredArea, occupancyRate };
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
      setSelectedProperty((prev) => {
        if (!prev) return null;
        const updated = (data || []).find((p: any) => p.id === prev.id) as MeasuredProperty | undefined;
        return updated ?? null;
      });
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

  const fillAddressByCep = async () => {
    const cep = propertyForm.cep.replace(/\D/g, "");
    if (cep.length !== 8) return toast({ title: "CEP inválido", description: "Informe um CEP com 8 dígitos.", variant: "destructive" });
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data?.erro) throw new Error("CEP não encontrado");
      setPropertyForm((prev) => ({ ...prev, street: data.logradouro || prev.street, neighborhood: data.bairro || prev.neighborhood, city: data.localidade || prev.city, state: data.uf || prev.state }));
      toast({ title: "Endereço preenchido pelo CEP" });
    } catch (e: any) {
      toast({ title: "Erro ao buscar CEP", description: e.message, variant: "destructive" });
    }
  };

  const saveProperty = async () => {
    if (!propertyForm.name.trim() || !propertyForm.property_type || !propertyForm.cep.trim() || !propertyForm.street.trim() || !propertyForm.number.trim() || !propertyForm.neighborhood.trim() || !propertyForm.city.trim() || !propertyForm.state.trim()) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome, tipo, CEP, rua, número, bairro, cidade e estado são obrigatórios.", variant: "destructive" });
      return;
    }

    const fullAddress = `${propertyForm.street.trim()}, ${propertyForm.number.trim()}${propertyForm.complement.trim() ? ` - ${propertyForm.complement.trim()}` : ""}`;
    const payload = {
      user_id: userId,
      name: propertyForm.name.trim(),
      property_type: propertyForm.property_type,
      address: fullAddress,
      cep: propertyForm.cep.trim(),
      street: propertyForm.street.trim(),
      number: propertyForm.number.trim(),
      complement: propertyForm.complement.trim() || null,
      state: propertyForm.state.trim(),
      reference_point: propertyForm.reference_point.trim() || null,
      city: propertyForm.city.trim(),
      neighborhood: propertyForm.neighborhood.trim(),
      asking_price: toNumber(propertyForm.asking_price) || null,
      bedrooms: toNumber(propertyForm.bedrooms) || null,
      bathrooms: toNumber(propertyForm.bathrooms) || null,
      parking_spaces: toNumber(propertyForm.parking_spaces) || null,
      iptu: toNumber(propertyForm.iptu) || null,
      condominium_fee: toNumber(propertyForm.condominium_fee) || null,
      land_width: toNumber(propertyForm.land_width) || null,
      land_length: toNumber(propertyForm.land_length) || null,
      land_area_manual: toNumber(propertyForm.land_area_manual) || null,
      measured_by: propertyForm.measured_by.trim() || null,
      measurement_mode: propertyForm.measurement_mode,
      external_shape: propertyForm.external_shape,
      external_width: toNumber(propertyForm.external_width) || null,
      external_length: toNumber(propertyForm.external_length) || null,
      external_base: toNumber(propertyForm.external_base) || null,
      external_height: toNumber(propertyForm.external_height) || null,
      external_side_a: toNumber(propertyForm.external_side_a) || null,
      external_side_b: toNumber(propertyForm.external_side_b) || null,
      external_area_manual: toNumber(propertyForm.external_area_manual) || null,
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
        cep: property.cep,
        street: property.street,
        number: property.number,
        complement: property.complement,
        state: property.state,
        reference_point: property.reference_point,
        city: property.city,
        neighborhood: property.neighborhood,
        asking_price: property.asking_price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        parking_spaces: property.parking_spaces,
        iptu: property.iptu,
        condominium_fee: property.condominium_fee,
        land_width: property.land_width,
        land_length: property.land_length,
        land_area_manual: property.land_area_manual,
        measured_by: property.measured_by,
        measurement_mode: property.measurement_mode,
        external_shape: property.external_shape,
        external_width: property.external_width,
        external_length: property.external_length,
        external_base: property.external_base,
        external_height: property.external_height,
        external_side_a: property.external_side_a,
        external_side_b: property.external_side_b,
        external_area_manual: property.external_area_manual,
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
      await db.from(measuredPhotosTable).insert({ property_id: selectedProperty.id, user_id: userId, image_url: publicUrl.publicUrl, category: photoCategory, room_id: photoRoomId === "geral" ? null : photoRoomId, sort_order: photos.length + 1 });
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

  const updateMeasurementMode = async (mode: string) => {
    if (!selectedProperty) return;
    setSelectedProperty({ ...selectedProperty, measurement_mode: mode });
    const { error } = await db.from(measuredPropertiesTable).update({ measurement_mode: mode }).eq("id", selectedProperty.id).eq("user_id", userId);
    if (error) toast({ title: "Erro ao alterar modo", description: error.message, variant: "destructive" });
  };

  const sendToValuation = () => {
    if (!selectedProperty) return;
    sessionStorage.setItem("meter_property_for_valuation", JSON.stringify({ property: selectedProperty, rooms, photos, areas: technicalAreas }));
    navigate(`/avaliacao-ia?imovel=${selectedProperty.id}`);
  };

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
                <p className="mt-1 text-sm text-muted-foreground">{selectedProperty.address || selectedProperty.street} • {selectedProperty.neighborhood}, {selectedProperty.city}/{selectedProperty.state}</p>
              </div>
              <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg shadow-primary/20">
                <p className="text-xs font-semibold opacity-80">Área Total Atual</p>
                <p className="font-display text-3xl font-extrabold">{formatArea(livePropertyTotal)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={openNewRoom} className={`rounded-2xl ${themedPrimaryButton}`}><Plus size={16} /> Adicionar ambiente</Button>
              <Button variant="outline" onClick={() => openEditProperty(selectedProperty)} className={`rounded-2xl ${themedOutlineButton}`}><Edit3 size={16} /> Editar imóvel</Button>
              <Button onClick={sendToValuation} className={`rounded-2xl ${themedPrimaryButton}`}><FileText size={16} /> Enviar para Avaliador</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MetricCard title="Área Construída" value={technicalAreas.builtArea} />
            <MetricCard title="Terreno" value={technicalAreas.landArea} />
            <MetricCard title="Área Externa" value={technicalAreas.uncoveredArea} />
            <MetricCard title="Taxa de Ocupação" value={technicalAreas.occupancyRate} suffix="%" />
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-bold uppercase text-primary">Modos de medição</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {measurementModes.map((mode) => (
                <button key={mode} type="button" onClick={() => updateMeasurementMode(mode)} className={`rounded-2xl border p-3 text-left text-sm font-bold transition-all ${selectedProperty.measurement_mode === mode ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-primary/10 text-primary"}`}>{mode}</button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Modo atual: <strong className="text-foreground">{selectedProperty.measurement_mode || "Medição por Ambientes"}</strong></p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-primary">Fotos do imóvel</p>
                <h3 className="font-display text-xl font-extrabold text-foreground">Galeria técnica</h3>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Picker label="Categoria" value={photoCategory} options={photoCategories} onChange={setPhotoCategory} />
                <Picker label="Ambiente" value={photoRoomId} options={["geral", ...rooms.map((room) => room.id)]} optionLabels={{ geral: "Imóvel geral", ...Object.fromEntries(rooms.map((room) => [room.id, room.name])) }} onChange={setPhotoRoomId} />
                <label className={`inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold ${themedPrimaryButton}`}>
                  <ImagePlus size={16} /> Adicionar fotos
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(event) => uploadPhotos(event.target.files)} />
                </label>
              </div>
            </div>
            {photos.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"><Camera className="mx-auto mb-2 text-primary" />Nenhuma foto adicionada.</div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="group overflow-hidden rounded-2xl border border-border bg-secondary/40">
                    <img src={photo.image_url} alt={`Foto ${photo.category}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                    <div className="flex items-center justify-between gap-1 p-2">
                      <span className="truncate text-xs font-bold text-foreground">{photo.category}{photo.room_id ? ` • ${rooms.find((room) => room.id === photo.room_id)?.name || "Ambiente"}` : ""}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => movePhoto(photo, -1)} className="text-primary"><MoveUp size={14} /></button>
                        <button type="button" onClick={() => movePhoto(photo, 1)} className="text-primary"><MoveDown size={14} /></button>
                        <button type="button" onClick={() => deletePhoto(photo)} className="text-destructive"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                      <p className="text-[11px] font-semibold text-muted-foreground">{room.area_type}</p>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-primary/20 bg-card text-card-foreground shadow-2xl shadow-primary/10 sm:max-w-xl">
          <DialogHeader className="rounded-2xl border border-primary/15 bg-primary/10 p-4">
            <DialogTitle className="flex items-center gap-2 font-display text-xl font-extrabold text-primary">
              <Edit3 size={18} /> {editingPropertyId ? "Editar imóvel" : "Novo imóvel"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nome do imóvel" value={propertyForm.name} onChange={(value) => setPropertyForm((prev) => ({ ...prev, name: value }))} />
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Tipo</label>
              <Select value={propertyForm.property_type} onValueChange={(value) => setPropertyForm((prev) => ({ ...prev, property_type: value }))}>
                <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-primary/5 focus:ring-primary"><SelectValue /></SelectTrigger>
                <SelectContent className="border-primary/20 bg-popover text-popover-foreground">{propertyTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
              <Field label="CEP *" value={propertyForm.cep} onChange={(value) => setPropertyForm((prev) => ({ ...prev, cep: value }))} />
              <Button type="button" onClick={fillAddressByCep} className={`mt-5 h-12 rounded-2xl ${themedOutlineButton}`} variant="outline">Buscar CEP</Button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Rua *" value={propertyForm.street} onChange={(value) => setPropertyForm((prev) => ({ ...prev, street: value }))} />
              <Field label="Número *" value={propertyForm.number} onChange={(value) => setPropertyForm((prev) => ({ ...prev, number: value }))} />
              <Field label="Complemento" value={propertyForm.complement} onChange={(value) => setPropertyForm((prev) => ({ ...prev, complement: value }))} />
              <Field label="Referência" value={propertyForm.reference_point} onChange={(value) => setPropertyForm((prev) => ({ ...prev, reference_point: value }))} />
              <Field label="Bairro *" value={propertyForm.neighborhood} onChange={(value) => setPropertyForm((prev) => ({ ...prev, neighborhood: value }))} />
              <Field label="Cidade *" value={propertyForm.city} onChange={(value) => setPropertyForm((prev) => ({ ...prev, city: value }))} />
              <Field label="Estado *" value={propertyForm.state} onChange={(value) => setPropertyForm((prev) => ({ ...prev, state: value.toUpperCase() }))} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Valor pedido" value={propertyForm.asking_price} onChange={(value) => setPropertyForm((prev) => ({ ...prev, asking_price: value }))} />
              <Field label="Quartos" value={propertyForm.bedrooms} onChange={(value) => setPropertyForm((prev) => ({ ...prev, bedrooms: value }))} />
              <Field label="Banheiros" value={propertyForm.bathrooms} onChange={(value) => setPropertyForm((prev) => ({ ...prev, bathrooms: value }))} />
              <Field label="Vagas" value={propertyForm.parking_spaces} onChange={(value) => setPropertyForm((prev) => ({ ...prev, parking_spaces: value }))} />
              <Field label="IPTU" value={propertyForm.iptu} onChange={(value) => setPropertyForm((prev) => ({ ...prev, iptu: value }))} />
              <Field label="Condomínio" value={propertyForm.condominium_fee} onChange={(value) => setPropertyForm((prev) => ({ ...prev, condominium_fee: value }))} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Largura terreno (m)" value={propertyForm.land_width} onChange={(value) => setPropertyForm((prev) => ({ ...prev, land_width: value }))} />
              <Field label="Comprimento terreno (m)" value={propertyForm.land_length} onChange={(value) => setPropertyForm((prev) => ({ ...prev, land_length: value }))} />
              <Field label="Área terreno manual" value={propertyForm.land_area_manual} onChange={(value) => setPropertyForm((prev) => ({ ...prev, land_area_manual: value }))} />
            </div>
            <Picker label="Modo de medição" value={propertyForm.measurement_mode} options={measurementModes} onChange={(value) => setPropertyForm((prev) => ({ ...prev, measurement_mode: value }))} />
            <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3">
              <Picker label="Formato externo da construção" value={propertyForm.external_shape} options={externalShapes} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_shape: value }))} />
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {propertyForm.external_shape === "Retângulo" && <><Field label="Largura construção" value={propertyForm.external_width} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_width: value }))} /><Field label="Comprimento construção" value={propertyForm.external_length} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_length: value }))} /></>}
                {propertyForm.external_shape === "L" && <><Field label="Largura bloco 1" value={propertyForm.external_width} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_width: value }))} /><Field label="Comprimento bloco 1" value={propertyForm.external_length} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_length: value }))} /><Field label="Largura bloco 2" value={propertyForm.external_side_a} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_side_a: value }))} /><Field label="Comprimento bloco 2" value={propertyForm.external_side_b} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_side_b: value }))} /></>}
                {propertyForm.external_shape === "Triângulo" && <><Field label="Base construção" value={propertyForm.external_base} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_base: value }))} /><Field label="Altura construção" value={propertyForm.external_height} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_height: value }))} /></>}
                {propertyForm.external_shape === "Trapézio" && <><Field label="Base maior" value={propertyForm.external_base} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_base: value }))} /><Field label="Base menor" value={propertyForm.external_side_a} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_side_a: value }))} /><Field label="Altura" value={propertyForm.external_height} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_height: value }))} /></>}
                {propertyForm.external_shape === "Irregular" && <Field label="Área construída manual" value={propertyForm.external_area_manual} onChange={(value) => setPropertyForm((prev) => ({ ...prev, external_area_manual: value }))} />}
              </div>
            </div>
            <Field label="Responsável pela medição" value={propertyForm.measured_by} onChange={(value) => setPropertyForm((prev) => ({ ...prev, measured_by: value }))} />
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
            <Picker label="Tipo da área" value={roomForm.area_type} options={areaTypes} onChange={(value) => setRoomForm((prev) => ({ ...prev, area_type: value }))} />
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

function MetricCard({ title, value, suffix }: { title: string; value: number; suffix?: string }) {
  const display = suffix === "%" ? `${Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : formatArea(value);
  return <div className="rounded-3xl border border-primary/15 bg-primary/10 p-4 shadow-sm"><p className="text-xs font-bold uppercase text-muted-foreground">{title}</p><p className="mt-1 font-display text-2xl font-extrabold text-primary">{display}</p></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border-primary/20 bg-primary/5 focus-visible:ring-primary" />
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
        className="min-h-24 w-full rounded-2xl border border-primary/20 bg-primary/5 px-3 py-3 text-sm text-foreground outline-none ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      />
    </div>
  );
}

function Picker({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-2xl border-primary/20 bg-primary/5 focus:ring-primary"><SelectValue /></SelectTrigger>
        <SelectContent className="border-primary/20 bg-popover text-popover-foreground">{options.map((option) => <SelectItem key={option} value={option}>{optionLabels?.[option] || option}</SelectItem>)}</SelectContent>
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
