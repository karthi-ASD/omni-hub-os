import { useGeoEngine } from "@/hooks/useGeoEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Globe, Layers, FileJson, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";

const ENTITY_TYPES = ["BUSINESS", "SERVICE", "LOCATION", "PERSON", "BRAND"];
const SCHEMA_TYPES = ["LocalBusiness", "Service", "FAQPage", "Organization", "WebSite", "Review"];

const GeoEnginePage = () => {
  const { entities, schemaItems, answerBlocks, loading, geoScore, addEntity, addSchemaItem, addAnswerBlock } = useGeoEngine();
  const [newEntity, setNewEntity] = useState({ type: "BUSINESS", name: "" });
  const [newSchema, setNewSchema] = useState({ type: "LocalBusiness", jsonLd: "" });
  const [newAnswer, setNewAnswer] = useState({ intent: "", text: "" });

  if (loading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">GEO Engine</h1>
        <p className="text-muted-foreground">Generative Engine Optimization — entity graph, schema, answer blocks</p>
      </div>

      {/* Readiness Score */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" /> GEO Readiness Score</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={geoScore.readiness} className="flex-1" />
            <span className="text-2xl font-bold">{geoScore.readiness}%</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Entities</span><p className="font-medium">{geoScore.entityCount}</p></div>
            <div><span className="text-muted-foreground">Published Schemas</span><p className="font-medium">{geoScore.schemaCount}</p></div>
            <div><span className="text-muted-foreground">Answer Blocks</span><p className="font-medium">{geoScore.answerBlockCount}</p></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="entities">
        <TabsList>
          <TabsTrigger value="entities"><Layers className="h-4 w-4 mr-1" /> Entity Graph</TabsTrigger>
          <TabsTrigger value="schema"><FileJson className="h-4 w-4 mr-1" /> Schema Manager</TabsTrigger>
          <TabsTrigger value="answers"><MessageSquare className="h-4 w-4 mr-1" /> Answer Blocks</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Entity</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Select value={newEntity.type} onValueChange={(v) => setNewEntity({ ...newEntity, type: v })}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Entity name" value={newEntity.name} onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })} />
              <Button onClick={() => { if (newEntity.name) { addEntity(newEntity.type, newEntity.name); setNewEntity({ ...newEntity, name: "" }); } }}><Plus className="h-4 w-4" /></Button>
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-3">
            {entities.map(e => (
              <Card key={e.id}>
                <CardContent className="pt-4 flex items-center gap-3">
                  <Badge variant="outline">{e.entity_type}</Badge>
                  <span className="font-medium">{e.name}</span>
                </CardContent>
              </Card>
            ))}
            {entities.length === 0 && <p className="text-sm text-muted-foreground col-span-2">No entities yet. Add your business, services, and locations.</p>}
          </div>
        </TabsContent>

        <TabsContent value="schema" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Schema Item (JSON-LD)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Select value={newSchema.type} onValueChange={(v) => setNewSchema({ ...newSchema, type: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>{SCHEMA_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder='{"@context":"https://schema.org",...}' value={newSchema.jsonLd} onChange={(e) => setNewSchema({ ...newSchema, jsonLd: e.target.value })} rows={4} />
              <Button onClick={() => { try { const j = JSON.parse(newSchema.jsonLd); addSchemaItem(newSchema.type, j); setNewSchema({ ...newSchema, jsonLd: "" }); } catch { } }}>Add Schema</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {schemaItems.map(s => (
              <Card key={s.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge>{s.schema_type}</Badge>
                    <Badge variant={s.status === "PUBLISHED" ? "default" : "secondary"}>{s.status}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="answers" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Add Answer Block</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Query intent (e.g. 'What services do you offer?')" value={newAnswer.intent} onChange={(e) => setNewAnswer({ ...newAnswer, intent: e.target.value })} />
              <Textarea placeholder="Answer text..." value={newAnswer.text} onChange={(e) => setNewAnswer({ ...newAnswer, text: e.target.value })} rows={3} />
              <Button onClick={() => { if (newAnswer.intent && newAnswer.text) { addAnswerBlock(newAnswer.intent, newAnswer.text); setNewAnswer({ intent: "", text: "" }); } }}>Add Answer Block</Button>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {answerBlocks.map(a => (
              <Card key={a.id}>
                <CardContent className="pt-4">
                  <p className="font-medium text-sm">{a.query_intent}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.answer_text}</p>
                  <Badge variant="secondary" className="mt-2">{a.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeoEnginePage;
