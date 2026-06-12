import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Users, MapPin, FileDown, Search } from "lucide-react";
import { toast } from "sonner";

interface MaterialDevedor {
  id_patrimonio: string;
  descricao: string;
  tipo: string;
}

interface DevedorPorMilitar {
  militar: string;
  total_itens: number;
  materiais: MaterialDevedor[];
}

interface MaterialLocal {
  id_patrimonio: string;
  descricao: string;
  situacao: string;
  responsavel: string;
  tipo: string;
}

interface MaterialPorLocal {
  local: string;
  total_itens: number;
  materiais: MaterialLocal[];
}

interface Militar {
  id?: number;
  id_militar?: string;
  posto_graduacao: string;
  nome_de_guerra: string;
  nome_completo: string;
  status?: string;
}

const Relatorios = () => {
  const [devedores, setDevedores] = useState<DevedorPorMilitar[]>([]);
  const [locais, setLocais] = useState<MaterialPorLocal[]>([]);
  const [loadingDev, setLoadingDev] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingLocPdf, setExportingLocPdf] = useState(false);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [searchMilitar, setSearchMilitar] = useState("");
  const [selectedMilitar, setSelectedMilitar] = useState("");
  const [exportingMilitarPdf, setExportingMilitarPdf] = useState(false);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res = await api.get("/relatorios/devedores_por_militar/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "devedores_por_militar.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao exportar PDF.");
    }
    setExportingPdf(false);
  };

  const handleExportLocPdf = async () => {
    setExportingLocPdf(true);
    try {
      const res = await api.get("/relatorios/materiais_por_local/pdf", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "inventario_por_local.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Erro ao exportar PDF.");
    }
    setExportingLocPdf(false);
  };

  const handleExportMilitarPdf = async () => {
    if (!selectedMilitar) return;
    setExportingMilitarPdf(true);
    try {
      const res = await api.get(`/relatorios/termo_cautela/${selectedMilitar}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      
      const m = militares.find(x => String(x.id || x.id_militar) === selectedMilitar);
      const name = m ? m.nome_de_guerra : selectedMilitar;

      link.download = `termo_cautela_${name}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF do militar gerado com sucesso.");
    } catch {
      toast.error("Erro ao exportar PDF do militar.");
    }
    setExportingMilitarPdf(false);
  };

  const fetchMilitares = async () => {
    try {
      const res = await api.get("/militares/");
      setMilitares(res.data);
    } catch { /* silently fail */ }
  };

  const fetchDevedores = async () => {
    setLoadingDev(true);
    try {
      const res = await api.get("/relatorios/devedores_por_militar");
      setDevedores(res.data);
    } catch { /* silently fail */ }
    setLoadingDev(false);
  };

  const fetchLocais = async () => {
    setLoadingLoc(true);
    try {
      const res = await api.get("/relatorios/materiais_por_local");
      setLocais(res.data);
    } catch { /* silently fail */ }
    setLoadingLoc(false);
  };

  useEffect(() => {
    fetchDevedores();
    fetchLocais();
    fetchMilitares();
  }, []);

  const filteredMilitares = militares.filter(
    (m) =>
      m.status !== "Suspenso" &&
      (m.nome_de_guerra?.toLowerCase().includes(searchMilitar.toLowerCase()) ||
      m.nome_completo?.toLowerCase().includes(searchMilitar.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">Visões analíticas agrupadas do sistema.</p>
      </div>

      <Tabs defaultValue="devedores" className="w-full">
        <TabsList>
          <TabsTrigger value="devedores" className="gap-2">
            <Users className="h-4 w-4" /> Devedores por Militar
          </TabsTrigger>
          <TabsTrigger value="locais" className="gap-2">
            <MapPin className="h-4 w-4" /> Inventário por Local
          </TabsTrigger>
        </TabsList>

        <TabsContent value="devedores">
          <div className="flex flex-col md:flex-row justify-between gap-4 mt-4 mb-6 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col gap-2 w-full md:w-1/2">
              <span className="font-semibold text-sm">Gerar Termo de Cautela Individual</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-1/2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar militar..."
                    value={searchMilitar}
                    onChange={(e) => setSearchMilitar(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <Select value={selectedMilitar} onValueChange={setSelectedMilitar}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o militar" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMilitares.length === 0 ? (
                        <div className="py-2 px-3 text-sm text-muted-foreground">Nenhum encontrado</div>
                      ) : (
                        filteredMilitares.map((m) => {
                          const uniqueId = String(m.id || m.id_militar);
                          return (
                            <SelectItem key={uniqueId} value={uniqueId}>
                              {m.posto_graduacao} {m.nome_de_guerra}
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleExportMilitarPdf} 
                  disabled={!selectedMilitar || exportingMilitarPdf} 
                  className="gap-2 shrink-0 h-10"
                >
                  {exportingMilitarPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                  Baixar PDF
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-auto md:items-end justify-end">
              <span className="font-semibold text-sm">Relatório Geral</span>
              <Button onClick={handleExportPdf} disabled={exportingPdf} variant="outline" className="gap-2 h-10">
                {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                Exportar Todos os Devedores
              </Button>
            </div>
          </div>
          {loadingDev ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : devedores.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum devedor encontrado.</p>
          ) : (
            <Accordion type="multiple" className="mt-4 space-y-2">
              {devedores.map((d) => (
                <AccordionItem key={d.militar} value={d.militar} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{d.militar}</span>
                      <Badge variant="destructive">{d.total_itens} {d.total_itens === 1 ? "item" : "itens"}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patrimônio</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Tipo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {d.materiais.map((m) => (
                          <TableRow key={m.id_patrimonio}>
                            <TableCell className="font-mono">{m.id_patrimonio}</TableCell>
                            <TableCell>{m.descricao}</TableCell>
                            <TableCell>{m.tipo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>

        <TabsContent value="locais">
          <div className="flex justify-end mt-4 mb-2">
            <Button onClick={handleExportLocPdf} disabled={exportingLocPdf} className="gap-2">
              {exportingLocPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Exportar Relatório PDF
            </Button>
          </div>
          {loadingLoc ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : locais.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum local encontrado.</p>
          ) : (
            <Accordion type="multiple" className="mt-4 space-y-2">
              {locais.map((l) => (
                <AccordionItem key={l.local} value={l.local} className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{l.local}</span>
                      <Badge>{l.total_itens} {l.total_itens === 1 ? "item" : "itens"}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patrimônio</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Situação</TableHead>
                          <TableHead>Responsável</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {l.materiais.map((m) => (
                          <TableRow key={m.id_patrimonio} className={m.situacao === "Em Uso" ? "bg-destructive/5" : ""}>
                            <TableCell className="font-mono">{m.id_patrimonio}</TableCell>
                            <TableCell>{m.descricao}</TableCell>
                            <TableCell>{m.tipo}</TableCell>
                            <TableCell>
                              <Badge variant={m.situacao === "Em Uso" ? "destructive" : "secondary"}>
                                {m.situacao}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {m.situacao === "Em Uso" && m.responsavel ? (
                                <Badge variant="destructive">{m.responsavel}</Badge>
                              ) : (
                                m.responsavel || "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
