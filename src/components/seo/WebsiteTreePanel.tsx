import { useState } from "react";
import { useWebsiteTrees } from "@/hooks/useWebsiteTrees";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe, Plus, Trash2, Loader2, RefreshCw,
  ChevronRight, ChevronDown, ExternalLink, FolderTree, FileText, GitBranch,
} from "lucide-react";
import { toast } from "sonner";

interface WebsiteTreePanelProps {
  projectId: string;
  clientId: string;
  businessId: string;
  websiteDomain?: string;
}

export const WebsiteTreePanel = ({ projectId, clientId, businessId, websiteDomain }: WebsiteTreePanelProps) => {
  const { clientTree, competitorTrees, loading, generating, generateTree, deleteTree, refetch } = useWebsiteTrees(projectId);
  const [clientUrl, setClientUrl] = useState(websiteDomain || "");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [activeTab, setActiveTab] = useState("client");

  const handleGenerateClient = async () => {
    if (!clientUrl.trim()) {
      toast.error("Enter a client website URL");
      return;
    }
    await generateTree(clientUrl.trim(), "client", businessId, clientId);
  };

  const handleAddCompetitor = async () => {
    if (!competitorUrl.trim()) {
      toast.error("Enter a competitor URL");
      return;
    }
    if (competitorTrees.length >= 10) {
      toast.error("Maximum 10 competitor URLs allowed");
      return;
    }
    await generateTree(competitorUrl.trim(), "competitor", businessId, clientId);
    setCompetitorUrl("");
  };

  if (loading) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading website trees...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Input Section */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> Website Tree Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Client Website</label>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={clientUrl}
                onChange={(e) => setClientUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleGenerateClient}
                disabled={generating || !clientUrl.trim()}
                size="sm"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Globe className="h-3.5 w-3.5 mr-1" />}
                {clientTree ? "Refresh" : "Generate"}
              </Button>
            </div>
          </div>

          {/* Competitor URLs */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Competitor Websites
              <span className="text-xs text-muted-foreground ml-1">({competitorTrees.length}/10)</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="https://competitor.com"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                className="flex-1"
                disabled={competitorTrees.length >= 10}
              />
              <Button
                onClick={handleAddCompetitor}
                disabled={generating || !competitorUrl.trim() || competitorTrees.length >= 10}
                size="sm"
                variant="outline"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>

            {/* List existing competitors */}
            {competitorTrees.length > 0 && (
              <div className="space-y-1 mt-2">
                {competitorTrees.map((ct) => (
                  <div key={ct.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1.5">
                    <span className="truncate flex-1">{ct.domain}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px]">{ct.total_pages} pages</Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => deleteTree(ct.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tree Display */}
      {(clientTree || competitorTrees.length > 0) && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Website Structure</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {clientTree && (
                  <TabsTrigger value="client" className="text-xs gap-1">
                    <Globe className="h-3 w-3" /> Client Site
                  </TabsTrigger>
                )}
                {competitorTrees.map((ct, i) => (
                  <TabsTrigger key={ct.id} value={ct.id} className="text-xs gap-1">
                    Competitor {i + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {clientTree && (
                <TabsContent value="client">
                  <TreeInfo domain={clientTree.domain} totalPages={clientTree.total_pages} updatedAt={clientTree.updated_at} />
                  <div className="max-h-[500px] overflow-auto mt-2">
                    <NestedTreeView nodes={clientTree.tree_data || []} />
                  </div>
                </TabsContent>
              )}

              {competitorTrees.map((ct) => (
                <TabsContent key={ct.id} value={ct.id}>
                  <TreeInfo domain={ct.domain} totalPages={ct.total_pages} updatedAt={ct.updated_at} />
                  <div className="max-h-[500px] overflow-auto mt-2">
                    <NestedTreeView nodes={ct.tree_data || []} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!clientTree && competitorTrees.length === 0 && (
        <Card className="rounded-xl">
          <CardContent className="text-center py-12">
            <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">No website trees generated yet</p>
            <p className="text-xs text-muted-foreground">
              Add a client or competitor URL above and click "Generate" to create the sitemap tree.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

/* ── Sub-Components ── */

const TreeInfo = ({ domain, totalPages, updatedAt }: { domain: string; totalPages: number; updatedAt: string }) => (
  <div className="flex items-center justify-between text-xs text-muted-foreground border-b pb-2 mb-2">
    <span className="font-medium">{domain}</span>
    <div className="flex items-center gap-3">
      <span>{totalPages} pages</span>
      <span>Updated: {new Date(updatedAt).toLocaleDateString()}</span>
    </div>
  </div>
);

interface TreeNodeData {
  url: string;
  title: string;
  level: number;
  children: TreeNodeData[];
}

const NestedTreeView = ({ nodes }: { nodes: TreeNodeData[] }) => {
  if (!nodes || nodes.length === 0) {
    return <p className="text-xs text-muted-foreground py-2">No pages found.</p>;
  }
  return (
    <div>
      {nodes.map((node, i) => (
        <TreeNodeRow key={node.url + i} node={node} />
      ))}
    </div>
  );
};

const TreeNodeRow = ({ node }: { node: TreeNodeData }) => {
  const [expanded, setExpanded] = useState(node.level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
        style={{ paddingLeft: `${(node.level || 0) * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <button className="p-0.5 rounded hover:bg-muted" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}

        {node.level === 0 ? (
          <Globe className="h-4 w-4 text-primary shrink-0" />
        ) : hasChildren ? (
          <FolderTree className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        <span className="text-sm font-medium truncate flex-1">{node.title || "Untitled"}</span>

        {hasChildren && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{node.children.length}</Badge>
        )}

        <a
          href={node.url}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
        </a>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeRow key={child.url + i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};
