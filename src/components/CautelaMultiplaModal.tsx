import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown, Search, Package, X } from "lucide-react";
import api from "@/lib/api";
import { getUsername } from "@/lib/auth";

interface Material {
  id_patrimonio: string;
  descricao: string;
  valor: number;
  tipo: string;
  situacao: string;
  responsavel: string | null;
}

interface Militar {
  id: number;
  nome_completo: string;
  nome_de_guerra: string;
  posto_graduacao: string;
  status?: string;
}

interface Props {
  materials: Material[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CautelaMultiplaModal({ materials, open, onClose, onSuccess }: Props) {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [selectedMilitar, setSelectedMilitar] = useState("");
  const [searchMilitar, setSearchMilitar] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMilitares, setLoadingMilitares] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setLoadingMilitares(true);
      setSelectedMilitar("");
      setSearchMilitar("");
      api
        .get("/militares/")
        .then((res) => setMilitares(res.data))
        .catch((err) => console.error("Erro ao carregar militares:", err))
        .finally(() => setLoadingMilitares(false));
    }
  }, [open]);

  const filteredMilitares = militares.filter(
    (m) =>
      m.status !== "Suspenso" &&
      (m.nome_de_guerra?.toLowerCase().includes(searchMilitar.toLowerCase()) ||
        m.nome_completo?.toLowerCase().includes(searchMilitar.toLowerCase()) ||
        m.id?.toString().includes(searchMilitar))
  );

  const handleCautelarMultiplo = async () => {
    if (!selectedMilitar) {
      toast({ title: "Selecione um militar", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const ids = materials.map((m) => String(m.id_patrimonio));
      const payload = {
        ids_patrimonio: ids,
        id_militar: Number(selectedMilitar),
        usuario_logado: getUsername(),
      };

      await api.post("/movimentacoes/cautela_multipla", payload);

      // Baixar o PDF do termo de cautela consolidado
      try {
        const pdfUrl = `${api.defaults.baseURL}/relatorios/termo_cautela/${selectedMilitar}/pdf`;
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `termo_cautela_${selectedMilitar}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (pdfErr) {
        console.error("Erro ao baixar o PDF:", pdfErr);
        toast({
          title: "Não foi possível baixar o PDF do termo",
          variant: "destructive",
        });
      }

      toast({
        title: `${materials.length} ${materials.length === 1 ? "item cautelado" : "itens cautelados"} com sucesso!`,
      });
      onSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Erro desconhecido";
      toast({
        title: "Erro ao cautelar materiais",
        description: String(msg),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalValor = materials.reduce((acc, m) => {
    const val = typeof m.valor === "number" ? m.valor : parseFloat(String(m.valor)) || 0;
    return acc + val;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Cautela em Lote
          </SheetTitle>
          <SheetDescription>
            {materials.length} {materials.length === 1 ? "material selecionado" : "materiais selecionados"} para cautela
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          {/* Lista resumida dos materiais */}
          <div className="space-y-2">
            <Label className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Materiais Selecionados
            </Label>
            <ScrollArea className="h-44 rounded-md border bg-muted/30 p-2">
              <div className="space-y-1">
                {materials.map((m) => (
                  <div
                    key={m.id_patrimonio}
                    className="flex items-center justify-between rounded-md bg-background px-3 py-2 text-sm shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs text-muted-foreground shrink-0">
                        {m.id_patrimonio}
                      </span>
                      <span className="truncate font-medium">{m.descricao}</span>
                    </div>
                    <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                      {m.tipo}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-between text-xs text-muted-foreground px-1">
              <span>{materials.length} {materials.length === 1 ? "item" : "itens"}</span>
              <span>
                Valor total:{" "}
                {totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>

          <hr className="border-border" />

          {/* Seleção de militar */}
          <div className="space-y-3">
            <Label className="font-semibold">Selecionar Militar Responsável</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar militar..."
                value={searchMilitar}
                onChange={(e) => setSearchMilitar(e.target.value)}
                className="pl-9"
              />
            </div>
            {loadingMilitares ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : (
              <Select
                value={selectedMilitar}
                onValueChange={(val: string) => setSelectedMilitar(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o militar..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredMilitares.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      Nenhum militar encontrado
                    </div>
                  ) : (
                    filteredMilitares.map((m) => (
                      <SelectItem key={String(m.id)} value={String(m.id)}>
                        {`${m.posto_graduacao} ${m.nome_de_guerra} — ${m.nome_completo}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleCautelarMultiplo}
              disabled={loading || !selectedMilitar}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Cautelar {materials.length} {materials.length === 1 ? "item" : "itens"} e Gerar Termo
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
