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
import { Loader2, Plus, Minus } from "lucide-react";
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

  // Quantidade (só no cadastro)
  const [quantidade, setQuantidade] = useState(1);
  // Lista de patrimônios quando quantidade > 1 (só para não-consumo)
  const [patrimonios, setPatrimonios] = useState<string[]>([""]);

  const [saving, setSaving] = useState(false);

  const isConsumo =
    form.tipo === "Material de Consumo" ||
    form.tipo === "Ferramental de Consumo";

  // Sincroniza o array de patrimônios com a quantidade
  useEffect(() => {
    if (!isEdit && !isConsumo) {
      setPatrimonios((prev) => {
        const updated = [...prev];
        while (updated.length < quantidade) updated.push("");
        return updated.slice(0, quantidade);
      });
    }
  }, [quantidade, isConsumo, isEdit]);

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
      setQuantidade(1);
      setPatrimonios([""]);
    }
  }, [material, open]);

  // Quando muda o tipo, reseta patrimônios se virar consumo
  useEffect(() => {
    if (isConsumo) {
      setPatrimonios([""]);
    }
  }, [isConsumo]);

  const handleChange = (field: keyof MaterialPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePatrimonioChange = (index: number, value: string) => {
    setPatrimonios((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleQuantidadeChange = (delta: number) => {
    setQuantidade((prev) => Math.max(1, Math.min(50, prev + delta)));
  };

  const handleSubmit = async () => {
    // Validações base
    if (!form.descricao || !form.tipo) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    // Validação para não-consumo
    if (!isConsumo) {
      if (!form.local) {
        toast.error("Preencha o campo Local.");
        return;
      }
      if (isEdit && !form.id_patrimonio) {
        toast.error("Preencha o Nº Patrimônio.");
        return;
      }
      if (!isEdit) {
        const vazios = patrimonios.some((p) => !p.trim());
        if (vazios) {
          toast.error("Preencha todos os números de patrimônio.");
          return;
        }
        const duplicados = new Set(patrimonios).size !== patrimonios.length;
        if (duplicados) {
          toast.error("Existem números de patrimônio duplicados.");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const basePayload: any = {
        descricao: form.descricao,
        valor: form.valor !== "" ? String(form.valor) : "0",
        tipo: form.tipo,
        ...(form.observacao && { observacao: form.observacao }),
      };

      if (!isConsumo) {
        if (form.local) basePayload.local = form.local;
      }

      if (isEdit) {
        // Edição: um único PUT
        await api.put(`/materiais/${form.id_patrimonio}`, {
          ...basePayload,
          id_patrimonio: form.id_patrimonio,
        });
        toast.success("Material atualizado com sucesso!");
      } else if (isConsumo) {
        // Consumo: POST N vezes (patrimônio automático)
        for (let i = 0; i < quantidade; i++) {
          await api.post("/materiais/", basePayload);
        }
        toast.success(
          quantidade === 1
            ? "Material cadastrado com sucesso!"
            : `${quantidade} materiais cadastrados com sucesso!`
        );
      } else {
        // Carga / Ferramental: POST para cada patrimônio
        for (const pat of patrimonios) {
          await api.post("/materiais/", {
            ...basePayload,
            id_patrimonio: pat.trim(),
          });
        }
        toast.success(
          patrimonios.length === 1
            ? "Material cadastrado com sucesso!"
            : `${patrimonios.length} materiais cadastrados com sucesso!`
        );
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
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Material" : "Novo Material"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Descrição */}
          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              placeholder="Descrição do material"
            />
          </div>

          {/* Valor + Tipo */}
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
              <Select
                value={form.tipo}
                onValueChange={(v) => handleChange("tipo", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Carga">Carga</SelectItem>
                  <SelectItem value="Ferramental">Ferramental</SelectItem>
                  <SelectItem value="Material de Consumo">
                    Material de Consumo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Local (apenas não-consumo) */}
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

          {/* Observação */}
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

          {/* ── QUANTIDADE (apenas cadastro) ── */}
          {!isEdit && (
            <div className="grid gap-2">
              <Label>Quantidade</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantidadeChange(-1)}
                  disabled={quantidade <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center font-semibold text-lg">
                  {quantidade}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantidadeChange(1)}
                  disabled={quantidade >= 50}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                {quantidade > 1 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {isConsumo
                      ? `${quantidade} itens serão cadastrados automaticamente`
                      : `Preencha o patrimônio de cada item abaixo`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── PATRIMÔNIOS individuais (Carga/Ferramental, quantidade > 1) ── */}
          {!isEdit && !isConsumo && quantidade > 1 && (
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">
                Nº Patrimônio por Item *
              </Label>
              <div className="space-y-2 rounded-md border p-3 bg-muted/30">
                {patrimonios.map((pat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      Item {idx + 1}
                    </span>
                    <Input
                      value={pat}
                      onChange={(e) =>
                        handlePatrimonioChange(idx, e.target.value)
                      }
                      placeholder={`Patrimônio ${idx + 1}`}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PATRIMÔNIO único (Carga/Ferramental, quantidade = 1, cadastro) ── */}
          {!isEdit && !isConsumo && quantidade === 1 && (
            <div className="grid gap-2">
              <Label htmlFor="id_patrimonio">Nº Patrimônio *</Label>
              <Input
                id="id_patrimonio"
                value={patrimonios[0]}
                onChange={(e) => handlePatrimonioChange(0, e.target.value)}
                placeholder="Ex: 12345"
              />
            </div>
          )}

          {/* ── PATRIMÔNIO (edição) ── */}
          {isEdit && !isConsumo && (
            <div className="grid gap-2">
              <Label htmlFor="id_patrimonio">Nº Patrimônio *</Label>
              <Input
                id="id_patrimonio"
                value={form.id_patrimonio}
                onChange={(e) => handleChange("id_patrimonio", e.target.value)}
                disabled
                placeholder="Ex: 12345"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit
              ? "Salvar Alterações"
              : quantidade > 1
              ? `Cadastrar ${quantidade} itens`
              : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
