import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, MapPin, FileDown } from "lucide-react";
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

const Relatorios = () => {
  const [devedores, setDevedores] = useState<DevedorPorMilitar[]>([]);
  const [locais, setLocais] = useState<MaterialPorLocal[]>([]);
  const [loadingDev, setLoadingDev] = useState(false);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingLocPdf, setExportingLocPdf] = useState(false);

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
  }, []);

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
          <div className="flex justify-end mt-4 mb-2">
            <Button onClick={handleExportPdf} disabled={exportingPdf} className="gap-2">
              {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Exportar Relatório PDF
            </Button>
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
