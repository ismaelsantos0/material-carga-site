import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Loader2, Search, Trash2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Militar {
  id?: number;
  id_militar: string;
  cpf: string;
  posto_graduacao: string;
  nome_completo: string;
  nome_de_guerra: string;
  om_origem: string;
  secao: string;
  telefone: string;
  status: string;
}

const emptyForm = {
  cpf: "", posto_graduacao: "", nome_completo: "", nome_de_guerra: "", om_origem: "", secao: "", telefone: "",
};

const Militares = () => {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchMilitares = async () => {
    setLoading(true);
    try {
      const res = await api.get("/militares/");
      setMilitares(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMilitares(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/militares/", form);
      toast({ title: "Militar cadastrado com sucesso!" });
      setForm(emptyForm);
      setDialogOpen(false);
      fetchMilitares();
    } catch {
      toast({ title: "Erro ao cadastrar militar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja reativar o militar ${nome}?`)) {
      try {
        await api.put(`/militares/${id}/reativar`);
        toast({ title: "Militar reativado com sucesso!" });
        fetchMilitares();
      } catch {
        toast({ title: "Erro ao reativar militar", variant: "destructive" });
      }
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o militar ${nome}? Esta ação removerá ele da lista.`)) {
      try {
        await api.delete(`/militares/${id}`);
        toast({ title: "Militar excluído com sucesso!" });
        fetchMilitares();
      } catch {
        toast({ title: "Erro ao excluir militar", variant: "destructive" });
      }
    }
  };

  const filtered = militares.filter((m) =>
    m.nome_completo?.toLowerCase().includes(search.toLowerCase()) ||
    m.nome_de_guerra?.toLowerCase().includes(search.toLowerCase()) ||
    m.cpf?.includes(search)
  );

  const fields: { key: keyof typeof emptyForm; label: string }[] = [
    { key: "cpf", label: "CPF" },
    { key: "posto_graduacao", label: "Posto/Graduação" },
    { key: "nome_completo", label: "Nome Completo" },
    { key: "nome_de_guerra", label: "Nome de Guerra" },
    { key: "om_origem", label: "OM de Origem" },
    { key: "secao", label: "Seção" },
    { key: "telefone", label: "Telefone" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestão de Militares
          </h1>
          <p className="text-muted-foreground text-sm">{militares.length} militares cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Novo Militar</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Militar</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-3">
              {fields.map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input
                    value={form[f.key]}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    required
                  />
                </div>
              ))}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cadastrar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar militar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Posto/Grad.</TableHead>
                    <TableHead>Nome de Guerra</TableHead>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>OM Origem</TableHead>
                    <TableHead>Seção</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum militar encontrado.</TableCell></TableRow>
                  ) : filtered.map((m) => (
                    <TableRow key={m.id_militar}>
                      <TableCell className="font-medium">{m.posto_graduacao}</TableCell>
                      <TableCell className="font-semibold">{m.nome_de_guerra}</TableCell>
                      <TableCell>{m.nome_completo}</TableCell>
                      <TableCell className="font-mono text-sm">{m.cpf}</TableCell>
                      <TableCell>{m.om_origem}</TableCell>
                      <TableCell>{m.secao}</TableCell>
                      <TableCell>{m.telefone}</TableCell>
                      <TableCell>
                        {m.status === "Suspenso" ? (
                          <Badge variant="destructive">Suspenso</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground hover:bg-success/80">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        {m.status === "Suspenso" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                            onClick={() => handleReactivate(m.id_militar || String(m.id), m.nome_de_guerra)}
                            title="Reativar militar"
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(m.id_militar || String(m.id), m.nome_de_guerra)}
                          title="Excluir militar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Militares;
