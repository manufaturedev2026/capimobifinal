import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeft, Copy, Edit3, Home, Plus, Ruler, Save, Trash2 } from "lucide-react";
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
  created_at: string;
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
  notes: string | null;
};

type PropertyForm = {
  name: string;
  property_type: string;
  address: string;
  city: string;
  neighborhood: string;
  notes: string;
};

type RoomForm = {
  name: string;
  room_type: string;
  shape: string;
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
const roomTypes = ["Sala", "Quarto", "Suíte", "Cozinha", "Banheiro", "Varanda", "Garagem", "Área externa", "Terreno", "Comercial", "Outro"];
const shapes = ["Retângulo", "Triângulo", "L", "Trapézio", "Manual"];

const emptyPropertyForm: PropertyForm = {
  name: "",
  property_type: "Casa",
  address: "",
  city: "",
  neighborhood: "",
  notes: "",
};

const emptyRoomForm: RoomForm = {
  name: "",
  room_type: "Sala",
  shape: "Retângulo",
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

const calculateRoomArea = (room: RoomForm) => {
  const width = toNumber(room.width);
  const length = toNumber(room.length);
  const height = toNumber(room.height);
  const base = toNumber(room.base);
  const sideA = toNumber(room.side_a);
  const sideB = toNumber(room.side_b);

  switch (room.shape) {
    case "Retângulo":
      return width * length;
    case "Triângulo":
      return (base * height) / 2;
    case "L":
      return width * length + sideA * sideB;
    case "Trapézio":
      return ((base + sideA) * height) / 2;
    case "Manual":
      return toNumber(room.area);
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
  notes: property.notes || "",
});

const roomToForm = (room: MeasuredRoom): RoomForm => ({
  name: room.name,
  room_type: room.room_type,
  shape: room.shape,
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
  const [selectedProperty, setSelectedProperty] = useState<MeasuredProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [propertyForm, setPropertyForm] = useState<PropertyForm>(emptyPropertyForm);
  const [roomForm, setRoomForm] = useState<RoomForm>(emptyRoomForm);

  const measuredPropertiesTable = "measured_properties" as any;
  const measuredRoomsTable = "measured_rooms" as any;
  const computedArea = useMemo(() => calculateRoomArea(roomForm), [roomForm]);

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

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (selectedProperty?.id) fetchRooms(selectedProperty.id);
  }, [fetchRooms, selectedProperty?.id]);

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
      notes: propertyForm.notes.trim() || null,
    };

    if (editingPropertyId) {
      const { data, error } = await supabase.from(measuredPropertiesTable).update(payload).eq("id", editingPropertyId).select("*").single();
      if (error) {
        toast({ title: "Erro ao salvar imóvel", description: error.message, variant: "destructive" });
        return;
      }
      setSelectedProperty(data as MeasuredProperty);
      toast({ title: "Imóvel atualizado" });
    } else {
      const { data, error } = await supabase.from(measuredPropertiesTable).insert(payload).select("*").single();
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
    const { error } = await supabase.from(measuredPropertiesTable).delete().eq("id", property.id).eq("user_id", userId);
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
    const { data: copiedProperty, error } = await supabase
      .from(measuredPropertiesTable)
      .insert({
        user_id: userId,
        name: `${property.name} - Cópia`,
        property_type: property.property_type,
        address: property.address,
        city: property.city,
        neighborhood: property.neighborhood,
        notes: property.notes,
      })
      .select("*")
      .single();

    if (error || !copiedProperty) {
      toast({ title: "Erro ao duplicar imóvel", description: error?.message, variant: "destructive" });
      return;
    }

    const { data: originalRooms } = await supabase.from(measuredRoomsTable).select("*").eq("property_id", property.id).eq("user_id", userId);
    if (originalRooms?.length) {
      await supabase.from(measuredRoomsTable).insert(
        originalRooms.map((room: MeasuredRoom) => ({
          property_id: (copiedProperty as MeasuredProperty).id,
          user_id: userId,
          name: room.name,
          room_type: room.room_type,
          shape: room.shape,
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
      ? supabase.from(measuredRoomsTable).update(payload).eq("id", editingRoomId).eq("user_id", userId)
      : supabase.from(measuredRoomsTable).insert(payload);
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
    const { error } = await supabase.from(measuredRoomsTable).delete().eq("id", room.id).eq("user_id", userId);
    if (error) {
      toast({ title: "Erro ao excluir ambiente", description: error.message, variant: "destructive" });
      return;
    }
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
    toast({ title: "Ambiente excluído" });
    await fetchProperties();
  };

  const measurementFields = () => {
    if (roomForm.shape === "Manual") {
      return <Field label="Área total (m²)" value={roomForm.area} onChange={(value) => setRoomForm((prev) => ({ ...prev, area: value }))} />;
    }
    if (roomForm.shape === "Triângulo") {
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
    if (roomForm.shape === "L") {
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
              <Button onClick={openNewProperty} className="h-12 rounded-2xl font-bold shadow-lg shadow-primary/20">
                <Plus size={18} /> Novo Imóvel
              </Button>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <Ruler size={48} className="mx-auto mb-4 text-muted-foreground/40" />
              <h3 className="font-display text-xl font-bold text-foreground">Nenhum imóvel medido</h3>
              <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro imóvel para começar a adicionar ambientes.</p>
              <Button onClick={openNewProperty} className="mt-6 rounded-2xl">
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
            <button onClick={() => setSelectedProperty(null)} className="mb-4 flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
              <ArrowLeft size={17} /> Voltar para imóveis
            </button>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{selectedProperty.property_type}</p>
                <h2 className="font-display text-3xl font-extrabold text-foreground">{selectedProperty.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{selectedProperty.neighborhood}, {selectedProperty.city}</p>
              </div>
              <div className="rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-lg shadow-primary/20">
                <p className="text-xs font-semibold opacity-80">Total calculado</p>
                <p className="font-display text-3xl font-extrabold">{formatArea(selectedProperty.total_area)}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={openNewRoom} className="rounded-2xl"><Plus size={16} /> Adicionar ambiente</Button>
              <Button variant="outline" onClick={() => openEditProperty(selectedProperty)} className="rounded-2xl"><Edit3 size={16} /> Editar imóvel</Button>
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
                    <Button size="sm" variant="outline" onClick={() => openEditRoom(room)} className="flex-1 rounded-xl"><Edit3 size={14} /> Editar</Button>
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
            <Button onClick={saveProperty} className="h-12 w-full rounded-2xl font-bold"><Save size={16} /> Salvar imóvel</Button>
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
            </div>
            <TextArea label="Observações" value={roomForm.notes} onChange={(value) => setRoomForm((prev) => ({ ...prev, notes: value }))} />
            <Button onClick={saveRoom} className="h-12 w-full rounded-2xl font-bold"><Save size={16} /> Salvar ambiente</Button>
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
      className={`flex h-11 items-center justify-center rounded-2xl border transition-all ${destructive ? "border-destructive/20 text-destructive hover:bg-destructive/10" : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
