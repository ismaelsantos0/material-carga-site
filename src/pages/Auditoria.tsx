import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

interface Movimentacao {
  id: number;
  id_patrimonio: string;
  tipo: string;
  data_hora: string;
  nome_militar?: string;
  descricao_material?: string;
  usuario_logado?: string;
}

const Auditoria = () => {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/movimentacoes/");
        setMovimentacoes(res.data);
      } catch {
        setMovimentacoes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderBadge = (tipo: string) => {
    const t = tipo?.toLowerCase() || "";
    if (t.includes("cautel")) {
      return (
        <Badge variant="destructive" className="gap-1">
          <ArrowUpFromLine className="h-3 w-3" />
          Cautela
        </Badge>
      );
    }
    if (t.includes("devolu")) {
      return (
        <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
          <ArrowDownToLine className="h-3 w-3" />
          Devolução
        </Badge>
      );
    }
    if (t.includes("suspens")) {
      return (
        <Badge variant="default" className="gap-1 bg-orange-500 hover:bg-orange-600 text-white">
          <FileText className="h-3 w-3" />
          {tipo}
        </Badge>
      );
    }
    if (t.includes("reativa")) {
      return (
        <Badge variant="default" className="gap-1 bg-blue-500 hover:bg-blue-600 text-white">
          <FileText className="h-3 w-3" />
          {tipo}
        </Badge>
      );
    }
    if (t.includes("exclu")) {
      return (
        <Badge variant="secondary" className="gap-1 bg-gray-500 hover:bg-gray-600 text-white">
          <FileText className="h-3 w-3" />
          {tipo}
        </Badge>
      );
    }
    return <Badge variant="outline">{tipo}</Badge>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Auditoria — Movimentações e Eventos
        </h1>
        <p className="text-muted-foreground text-sm">Histórico de cautelas, devoluções e gestão de militares</p>
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
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Nº Patrimônio</TableHead>
                    <TableHead>Militar</TableHead>
                    <TableHead>Operador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma movimentação registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimentacoes.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {mov.data_hora
                            ? new Date(mov.data_hora).toLocaleString("pt-BR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {renderBadge(mov.tipo)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {mov.descricao_material || "—"}
                        </TableCell>
                        <TableCell className="font-mono">{mov.id_patrimonio}</TableCell>
                        <TableCell>{mov.nome_militar || "—"}</TableCell>
                        <TableCell>{mov.usuario_logado || "—"}</TableCell>
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

export default Auditoria;
