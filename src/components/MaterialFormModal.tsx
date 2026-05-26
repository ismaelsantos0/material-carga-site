import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface MaterialPayload {
  id_patrimonio: string;
  descricao: string;
  valor: number | string;
  tipo: string;
  local: string;
  observacao?: string;
}

interface MaterialFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material?: Partial<MaterialPayload> | null;
}

export const MaterialFormModal = ({
  open,
  onClose,
  onSuccess,
  material,
}: MaterialFormModalProps) => {
  const isEdit = !!material;

  const [form, setForm] = useState<MaterialPayload>({
    id_patrimonio: "",
    descricao: "",
    valor: "",
    tipo: "",
    local: "",
    observacao: "",
  });
  const [saving, setSaving] = useState(false);

  const isConsumo = form.tipo === "Material de Consumo" || form.tipo === "Ferramental de Consumo";

  useEffect(() => {
    if (material) {
      setForm({
        id_patrimonio: material.id_patrimonio || "",
        descricao: material.descricao || "",
        valor: material.valor ?? "",
        tipo: material.tipo || "",
        local: (material as any).local || "",
        observacao: (material as any).observacao || "",
      });
    } else {
      setForm({
        id_patrimonio: "",
        descricao: "",
        valor: "",
        tipo: "",
        local: "",
        observacao: "",
      });
    }
  }, [material, open]);

  const handleChange = (field: keyof MaterialPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!isConsumo && (!form.id_patrimonio || !form.local)) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!form.descricao || !form.tipo) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        descricao: form.descricao,
        valor: form.valor !== "" ? String(form.valor) : "0",
        tipo: form.tipo,
        ...(form.observacao && { observacao: form.observacao }),
      };

      if (!isConsumo) {
        if (form.id_patrimonio) payload.id_patrimonio = form.id_patrimonio;
        if (form.local) payload.local = form.local;
      }

      if (isEdit) {
        await api.put(`/materiais/${form.id_patrimonio}`, payload);
        toast.success("Material atualizado com sucesso!");
      } else {
        await api.post("/materiais/", payload);
        toast.success("Material cadastrado com sucesso!");
      }

      onSuccess();
    } catch {
      toast.error("Erro ao salvar material.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Material" : "Novo Material"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!isConsumo && (
            <div className="grid gap-2">
              <Label htmlFor="id_patrimonio">Nº Patrimônio *</Label>
              <Input
                id="id_patrimonio"
                value={form.id_patrimonio}
                onChange={(e) => handleChange("id_patrimonio", e.target.value)}
                disabled={isEdit}
                placeholder="Ex: 12345"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              placeholder="Descrição do material"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={form.valor}
                onChange={(e) => handleChange("valor", e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div className="grid gap-2">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => handleChange("tipo", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carga">Carga</SelectItem>
                  <SelectItem value="Ferramental">Ferramental</SelectItem>
                  <SelectItem value="Material de Consumo">Material de Consumo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isConsumo && (
            <div className="grid gap-2">
              <Label htmlFor="local">Local *</Label>
              <Input
                id="local"
                value={form.local}
                onChange={(e) => handleChange("local", e.target.value)}
                placeholder="Ex: Almoxarifado"
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={form.observacao}
              onChange={(e) => handleChange("observacao", e.target.value)}
              placeholder="Observações adicionais (opcional)"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Salvar Alterações" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
