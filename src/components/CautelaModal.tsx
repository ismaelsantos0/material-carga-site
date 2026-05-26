import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown, Search } from "lucide-react";
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
  material: Material;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CautelaModal({ material, open, onClose, onSuccess }: Props) {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [selectedMilitar, setSelectedMilitar] = useState("");
  const [searchMilitar, setSearchMilitar] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMilitares, setLoadingMilitares] = useState(false);
  const { toast } = useToast();

  const isFerr = true; // Sempre exigir seleção de militar

  useEffect(() => {
    if (open) {
      setLoadingMilitares(true);
      setSelectedMilitar("");
      setSearchMilitar("");
      api.get("/militares/").then((res) => {
        console.log("Militares carregados:", res.data);
        setMilitares(res.data);
      }).catch((err) => console.error("Erro ao carregar militares:", err)).finally(() => setLoadingMilitares(false));
    }
  }, [open]);

  const filteredMilitares = militares.filter(
    (m) =>
      m.status !== "Suspenso" &&
      (m.nome_de_guerra?.toLowerCase().includes(searchMilitar.toLowerCase()) ||
      m.nome_completo?.toLowerCase().includes(searchMilitar.toLowerCase()) ||
      m.id?.toString().includes(searchMilitar))
  );

  const handleCautelar = async () => {
    if (isFerr && !selectedMilitar) {
      toast({ title: "Selecione um militar", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const payload = { id_patrimonio: String(material.id_patrimonio), id_militar: Number(selectedMilitar), usuario_logado: getUsername() };
      console.log("Payload cautela:", JSON.stringify(payload));

      await api.post("/movimentacoes/cautela", payload);

      // Baixa o PDF via fetch como Blob para evitar bloqueio cross-origin
      try {
        const pdfUrl = `${api.defaults.baseURL}/relatorios/termo_cautela/${selectedMilitar}/pdf`;
        const response = await fetch(pdfUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `termo_cautela_${selectedMilitar}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (pdfErr) {
        console.error("Erro ao baixar o PDF:", pdfErr);
        toast({ title: "Não foi possível baixar o PDF do termo", variant: "destructive" });
      }

      toast({ title: "Cautela realizada com sucesso!" });
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Erro desconhecido";
      console.error("Erro cautela:", err?.response?.status, err?.response?.data, err);
      toast({ title: "Erro ao cautelar material", description: String(msg), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDevolver = async () => {
    setLoading(true);
    try {
      await api.post("/movimentacoes/devolucao", { id_patrimonio: material.id_patrimonio, usuario_logado: getUsername() });
      toast({ title: "Material devolvido ao estoque" });
      onSuccess();
    } catch {
      toast({ title: "Erro ao devolver material", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Material</SheetTitle>
          <SheetDescription>Nº Patrimônio: {material.id_patrimonio}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Descrição</span>
              <p className="font-medium">{material.descricao}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo</span>
              <p className="font-medium">{material.tipo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Valor</span>
              <p className="font-medium">
                {material.valor != null
                  ? material.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Situação</span>
              <p className="font-medium">{material.situacao}</p>
            </div>
          </div>

          <hr className="border-border" />

          {isFerr && (
            <div className="space-y-3">
              <Label className="font-semibold">Selecionar Militar</Label>
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
                <Select value={selectedMilitar} onValueChange={(val: string) => setSelectedMilitar(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar militar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMilitares.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-muted-foreground">Nenhum militar encontrado</div>
                    ) : (
                      filteredMilitares.map((m) => {
                        const uniqueId = String(m.id);
                        return (
                          <SelectItem key={uniqueId} value={uniqueId}>
                            {`${m.posto_graduacao} ${m.nome_de_guerra} — ${m.nome_completo}`}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-4">
            {material.situacao?.toLowerCase() !== "em uso" && (
              <Button onClick={handleCautelar} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                Cautelar / Transferir
              </Button>
            )}
            {material.situacao?.toLowerCase() === "em uso" && (
              <Button variant="outline" onClick={handleDevolver} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Devolver Material
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
