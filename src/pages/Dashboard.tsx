import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Search, Package, Loader2, Plus, Pencil, Trash2, ClipboardList, X } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { CautelaModal } from "@/components/CautelaModal";
import { CautelaMultiplaModal } from "@/components/CautelaMultiplaModal";
import { MaterialFormModal } from "@/components/MaterialFormModal";

interface Material {
  id_patrimonio: string;
  descricao: string;
  valor: number;
  tipo: string;
  situacao: string;
  responsavel: string | null;
}

const situacaoBadge = (situacao: string) => {
  const s = situacao?.toLowerCase();
  if (s === "disponível" || s === "disponivel") return <Badge className="bg-success text-success-foreground">Disponível</Badge>;
  if (s === "em uso") return <Badge className="bg-warning text-warning-foreground">Em Uso</Badge>;
  if (s === "manutenção" || s === "manutencao") return <Badge variant="destructive">Manutenção</Badge>;
  return <Badge variant="secondary">{situacao}</Badge>;
};

const Dashboard = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Seleção unitária (comportamento original)
  const [selected, setSelected] = useState<Material | null>(null);

  // Seleção múltipla (nova funcionalidade)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiCautelaOpen, setMultiCautelaOpen] = useState(false);

  // Formulário de material
  const [formOpen, setFormOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);

  const fetchMateriais = async () => {
    setLoading(true);
    try {
      const res = await api.get("/materiais/");
      setMateriais(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriais();
  }, []);

  const filtered = materiais.filter((m) => {
    const matchSearch =
      m.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      m.id_patrimonio?.toString().includes(search);
    const matchSituacao =
      filtroSituacao === "todos" || m.situacao?.toLowerCase() === filtroSituacao.toLowerCase();
    const matchTipo =
      filtroTipo === "todos" || m.tipo?.toLowerCase() === filtroTipo.toLowerCase();
    return matchSearch && matchSituacao && matchTipo;
  });

  // Apenas materiais disponíveis podem ser selecionados para cautela em lote
  const disponiveis = filtered.filter(
    (m) => m.situacao?.toLowerCase() === "disponível" || m.situacao?.toLowerCase() === "disponivel"
  );
  const allSelected =
    disponiveis.length > 0 && disponiveis.every((m) => selectedIds.has(m.id_patrimonio));
  const someSelected = disponiveis.some((m) => selectedIds.has(m.id_patrimonio));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(disponiveis.map((m) => m.id_patrimonio)));
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedMaterials = materiais.filter((m) => selectedIds.has(m.id_patrimonio));

  const handleOpenNew = () => {
    setEditMaterial(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (m: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditMaterial(m);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditMaterial(null);
    fetchMateriais();
  };

  const handleDelete = async (m: Material, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o material ${m.descricao}?`)) {
      try {
        await api.delete(`/materiais/${m.id_patrimonio}`);
        toast.success("Material excluído com sucesso!");
        fetchMateriais();
      } catch (error) {
        toast.error("Erro ao excluir o material.");
      }
    }
  };

  const isDisponivel = (m: Material) =>
    m.situacao?.toLowerCase() === "disponível" || m.situacao?.toLowerCase() === "disponivel";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Painel de Materiais
          </h1>
          <p className="text-muted-foreground text-sm">
            {materiais.length} itens cadastrados
          </p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Material
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou Nº patrimônio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="disponível">Disponível</SelectItem>
                <SelectItem value="em uso">Em Uso</SelectItem>
                <SelectItem value="manutenção">Manutenção</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="ferramental">Ferramental</SelectItem>
                <SelectItem value="carga">Carga</SelectItem>
                <SelectItem value="material de consumo">Material de Consumo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* Coluna de checkbox para seleção em lote */}
                    <TableHead className="w-[48px] pl-4">
                      <Checkbox
                        id="select-all"
                        checked={allSelected}
                        data-state={someSelected && !allSelected ? "indeterminate" : undefined}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Selecionar todos os disponíveis"
                        disabled={disponiveis.length === 0}
                        title={
                          disponiveis.length === 0
                            ? "Nenhum material disponível para seleção"
                            : allSelected
                            ? "Desmarcar todos"
                            : "Selecionar todos disponíveis"
                        }
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Nº Patrimônio</TableHead>
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Situação</TableHead>
                    <TableHead className="font-semibold">Responsável</TableHead>
                    <TableHead className="font-semibold w-[60px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum material encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((m) => {
                      const disponivel = isDisponivel(m);
                      const isChecked = selectedIds.has(m.id_patrimonio);
                      return (
                        <TableRow
                          key={m.id_patrimonio}
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                            isChecked ? "bg-primary/5 hover:bg-primary/10" : ""
                          }`}
                          onClick={() => setSelected(m)}
                        >
                          <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                            {disponivel ? (
                              <Checkbox
                                id={`select-${m.id_patrimonio}`}
                                checked={isChecked}
                                onCheckedChange={() => {
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(m.id_patrimonio)) {
                                      next.delete(m.id_patrimonio);
                                    } else {
                                      next.add(m.id_patrimonio);
                                    }
                                    return next;
                                  });
                                }}
                                aria-label={`Selecionar ${m.descricao}`}
                              />
                            ) : (
                              /* Espaço reservado para manter alinhamento */
                              <div className="w-4 h-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono font-medium">{m.id_patrimonio}</TableCell>
                          <TableCell>{m.descricao}</TableCell>
                          <TableCell>
                            {m.valor != null
                              ? m.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                              : "—"}
                          </TableCell>
                          <TableCell>{m.tipo}</TableCell>
                          <TableCell>{situacaoBadge(m.situacao)}</TableCell>
                          <TableCell>{m.responsavel || "Estoque"}</TableCell>
                          <TableCell className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => handleOpenEdit(m, e)}
                              title="Editar material"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => handleDelete(m, e)}
                              title="Excluir material"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== BARRA DE AÇÃO FLUTUANTE (aparece quando há seleção) ===== */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-primary-foreground px-5 py-3 rounded-full shadow-2xl border border-primary/20 animate-in slide-in-from-bottom-4 duration-300">
          <ClipboardList className="h-4 w-4 shrink-0" />
          <span className="font-semibold text-sm">
            {selectedIds.size} {selectedIds.size === 1 ? "item selecionado" : "itens selecionados"}
          </span>
          <div className="w-px h-4 bg-primary-foreground/30" />
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-3 text-xs font-semibold"
            onClick={() => setMultiCautelaOpen(true)}
          >
            Cautelar em Lote
          </Button>
          <button
            className="ml-1 hover:opacity-70 transition-opacity"
            onClick={() => setSelectedIds(new Set())}
            title="Limpar seleção"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Modal de cautela unitária (comportamento original inalterado) */}
      {selected && (
        <CautelaModal
          material={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onSuccess={() => {
            setSelected(null);
            fetchMateriais();
          }}
        />
      )}

      {/* Modal de cautela em lote (novo) */}
      <CautelaMultiplaModal
        materials={selectedMaterials}
        open={multiCautelaOpen}
        onClose={() => setMultiCautelaOpen(false)}
        onSuccess={() => {
          setMultiCautelaOpen(false);
          setSelectedIds(new Set());
          fetchMateriais();
        }}
      />

      <MaterialFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditMaterial(null); }}
        onSuccess={handleFormSuccess}
        material={editMaterial}
      />
    </div>
  );
};

export default Dashboard;
