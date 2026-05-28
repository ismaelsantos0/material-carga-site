import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  FileText, Loader2, ArrowDownToLine, ArrowUpFromLine,
  Package, User, ExternalLink,
} from "lucide-react";
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

interface MaterialDetalhe {
  id_patrimonio: string;
  descricao: string;
  tipo: string;
  valor: number;
  situacao: string;
  local?: string;
  responsavel?: string;
  observacao?: string;
}

const Auditoria = () => {
  const navigate = useNavigate();
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Sheet de detalhes do material
  const [materialSheet, setMaterialSheet] = useState(false);
  const [materialDetalhe, setMaterialDetalhe] = useState<MaterialDetalhe | null>(null);
  const [loadingMaterial, setLoadingMaterial] = useState(false);

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

  const handleOpenMaterial = async (id_patrimonio: string) => {
    if (!id_patrimonio || id_patrimonio === "—") return;
    setMaterialSheet(true);
    setMaterialDetalhe(null);
    setLoadingMaterial(true);
    try {
      const res = await api.get(`/materiais/${id_patrimonio}`);
      setMaterialDetalhe(res.data);
    } catch {
      setMaterialDetalhe(null);
    } finally {
      setLoadingMaterial(false);
    }
  };

  const handleOpenMilitar = (nomeMilitar: string) => {
    if (!nomeMilitar || nomeMilitar === "—") return;
    navigate(`/militares?search=${encodeURIComponent(nomeMilitar)}`);
  };

  const renderBadge = (tipo: string) => {
    const t = tipo?.toLowerCase() || "";
    if (t.includes("cautel"))
      return (
        <Badge variant="destructive" className="gap-1">
          <ArrowUpFromLine className="h-3 w-3" /> Cautela
        </Badge>
      );
    if (t.includes("devolu"))
      return (
        <Badge variant="default" className="gap-1 bg-emerald-600 hover:bg-emerald-700">
          <ArrowDownToLine className="h-3 w-3" /> Devolução
        </Badge>
      );
    if (t.includes("suspens"))
      return (
        <Badge variant="default" className="gap-1 bg-orange-500 hover:bg-orange-600 text-white">
          <FileText className="h-3 w-3" /> {tipo}
        </Badge>
      );
    if (t.includes("reativa"))
      return (
        <Badge variant="default" className="gap-1 bg-blue-500 hover:bg-blue-600 text-white">
          <FileText className="h-3 w-3" /> {tipo}
        </Badge>
      );
    if (t.includes("exclu"))
      return (
        <Badge variant="secondary" className="gap-1 bg-gray-500 hover:bg-gray-600 text-white">
          <FileText className="h-3 w-3" /> {tipo}
        </Badge>
      );
    return <Badge variant="outline">{tipo}</Badge>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Auditoria — Movimentações e Eventos
        </h1>
        <p className="text-muted-foreground text-sm">
          Histórico de cautelas, devoluções e gestão de militares
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
                        {/* Data/Hora */}
                        <TableCell className="font-mono text-sm whitespace-nowrap">
                          {mov.data_hora
                            ? new Date(mov.data_hora).toLocaleString("pt-BR")
                            : "—"}
                        </TableCell>

                        {/* Evento */}
                        <TableCell>{renderBadge(mov.tipo)}</TableCell>

                        {/* Material — clicável */}
                        <TableCell>
                          {mov.descricao_material ? (
                            <button
                              onClick={() => handleOpenMaterial(mov.id_patrimonio)}
                              className="flex items-center gap-1 text-left font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                              <Package className="h-3.5 w-3.5 shrink-0" />
                              {mov.descricao_material}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Nº Patrimônio — clicável */}
                        <TableCell>
                          {mov.id_patrimonio ? (
                            <button
                              onClick={() => handleOpenMaterial(mov.id_patrimonio)}
                              className="font-mono text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                              {mov.id_patrimonio}
                            </button>
                          ) : (
                            <span className="text-muted-foreground font-mono">—</span>
                          )}
                        </TableCell>

                        {/* Militar — clicável */}
                        <TableCell>
                          {mov.nome_militar ? (
                            <button
                              onClick={() => handleOpenMilitar(mov.nome_militar!)}
                              className="flex items-center gap-1 text-left font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                              <User className="h-3.5 w-3.5 shrink-0" />
                              {mov.nome_militar}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Operador */}
                        <TableCell className="text-muted-foreground text-sm">
                          {mov.usuario_logado || "—"}
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

      {/* ── Sheet de detalhes do Material ── */}
      <Sheet open={materialSheet} onOpenChange={setMaterialSheet}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Detalhes do Material
            </SheetTitle>
            {materialDetalhe && (
              <SheetDescription>
                Nº Patrimônio: {materialDetalhe.id_patrimonio}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="mt-6">
            {loadingMaterial ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : materialDetalhe ? (
              <div className="space-y-5">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Descrição</p>
                    <p className="font-semibold text-base">{materialDetalhe.descricao}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Tipo</p>
                    <Badge variant="outline">{materialDetalhe.tipo}</Badge>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Situação</p>
                    <Badge
                      className={
                        materialDetalhe.situacao?.toLowerCase() === "em uso"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-success text-success-foreground"
                      }
                    >
                      {materialDetalhe.situacao}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Valor</p>
                    <p className="font-medium">
                      {materialDetalhe.valor != null
                        ? Number(materialDetalhe.valor).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        : "—"}
                    </p>
                  </div>

                  {materialDetalhe.local && (
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Local</p>
                      <p className="font-medium">{materialDetalhe.local}</p>
                    </div>
                  )}

                  {materialDetalhe.responsavel && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Responsável</p>
                      <p className="font-medium">{materialDetalhe.responsavel}</p>
                    </div>
                  )}

                  {materialDetalhe.observacao && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Observação</p>
                      <p className="text-sm">{materialDetalhe.observacao}</p>
                    </div>
                  )}
                </div>

                <hr className="border-border" />

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setMaterialSheet(false);
                    navigate("/");
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Ver no Painel de Materiais
                </Button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                Não foi possível carregar os detalhes do material.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Auditoria;
