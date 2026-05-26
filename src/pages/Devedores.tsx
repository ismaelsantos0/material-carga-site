import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { getUsername } from "@/lib/auth";

interface Devedor {
  id_patrimonio: string;
  descricao: string;
  nome_de_guerra: string;
  nome_completo: string;
  data_cautela: string;
  dias_em_uso: number;
}

const Devedores = () => {
  const [devedores, setDevedores] = useState<Devedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [devolvendo, setDevolvendo] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDevedores = async () => {
    setLoading(true);
    try {
      const res = await api.get("/relatorios/devedores");
      const items = res.data;
      const mapped = (Array.isArray(items) ? items : []).map((item: any) => {
        const dataCautela = item.data_cautela || item.data_movimentacao || "";
        const dias = dataCautela
          ? Math.floor((Date.now() - new Date(dataCautela).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        return {
          id_patrimonio: item.id_patrimonio,
          descricao: item.descricao || "",
          nome_de_guerra: item.nome_de_guerra || item.militar_nome_de_guerra || item.responsavel || "—",
          nome_completo: item.nome_completo || item.militar_nome_completo || "",
          data_cautela: dataCautela,
          dias_em_uso: dias,
        };
      });
      setDevedores(mapped);
    } catch (err) {
      console.error("Erro ao buscar devedores:", err);
      setDevedores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevedores();
  }, []);

  const handleDevolver = async (id_patrimonio: string) => {
    setDevolvendo(id_patrimonio);
    try {
      await api.post("/movimentacoes/devolucao", { id_patrimonio, usuario_logado: getUsername() });
      toast({ title: "Material devolvido com sucesso!" });
      fetchDevedores();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Erro desconhecido";
      toast({ title: "Erro ao devolver material", description: String(msg), variant: "destructive" });
    } finally {
      setDevolvendo(null);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-warning" />
          Relatório de Devedores
        </h1>
        <p className="text-muted-foreground text-sm">
          Materiais em uso — {devedores.length} pendência{devedores.length !== 1 ? "s" : ""}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Patrimônio</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Data Cautela</TableHead>
                    <TableHead>Dias em Uso</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devedores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhum material pendente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    devedores.map((d) => (
                      <TableRow key={d.id_patrimonio}>
                        <TableCell className="font-mono font-medium">{d.id_patrimonio}</TableCell>
                        <TableCell>{d.descricao}</TableCell>
                        <TableCell className="font-semibold">{d.nome_de_guerra}</TableCell>
                        <TableCell>
                          {d.data_cautela
                            ? new Date(d.data_cautela).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              d.dias_em_uso > 30
                                ? "bg-destructive text-destructive-foreground"
                                : d.dias_em_uso > 7
                                ? "bg-warning text-warning-foreground"
                                : "bg-success text-success-foreground"
                            }
                          >
                            {d.dias_em_uso} dia{d.dias_em_uso !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDevolver(d.id_patrimonio)}
                            disabled={devolvendo === d.id_patrimonio}
                          >
                            {devolvendo === d.id_patrimonio ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Undo2 className="mr-1 h-4 w-4" />
                            )}
                            Devolver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Devedores;
