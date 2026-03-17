import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useWebsiteTrees } from "@/hooks/useWebsiteTrees";
import { ClientPortalEmptyState } from "@/components/client/ClientPortalEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Globe, ChevronRight, ChevronDown, ExternalLink, FolderTree,
  FileText, GitBranch, Loader2,
} from "lucide-react";
import { useState } from "react";

const ClientWebsiteStructurePage = () => {
  usePageTitle("Website Structure");
  const { clientId } = useAuth();
  const { clientTree, competitorTrees, loading } = useWebsiteTrees(undefined, clientId || undefined);
  const [activeTab, setActiveTab] = useState("client");

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading website structure...</span>
        </div>
      </div>
    );
  }

  const hasData = clientTree || competitorTrees.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <GitBranch className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Website Structure</h1>
      </div>

      {!hasData ? (
        <ClientPortalEmptyState
          icon={Globe}
          title="Your website structure is being analyzed"
          message="It will appear shortly once our team completes the analysis."
        />
      ) : (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Site Map</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                {clientTree && (
                  <TabsTrigger value="client" className="text-xs gap-1">
                    <Globe className="h-3 w-3" /> Your Website
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
                  <TreeMeta domain={clientTree.domain} totalPages={clientTree.total_pages} updatedAt={clientTree.updated_at} />
                  <div className="max-h-[600px] overflow-auto mt-2">
                    <ReadOnlyTree nodes={clientTree.tree_data || []} />
                  </div>
                </TabsContent>
              )}

              {competitorTrees.map((ct) => (
                <TabsContent key={ct.id} value={ct.id}>
                  <TreeMeta domain={ct.domain} totalPages={ct.total_pages} updatedAt={ct.updated_at} />
                  <div className="max-h-[600px] overflow-auto mt-2">
                    <ReadOnlyTree nodes={ct.tree_data || []} />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClientWebsiteStructurePage;

/* ── Helper Components ── */

const TreeMeta = ({ domain, totalPages, updatedAt }: { domain: string; totalPages: number; updatedAt: string }) => (
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

const ReadOnlyTree = ({ nodes }: { nodes: TreeNodeData[] }) => {
  if (!nodes || nodes.length === 0) return <p className="text-xs text-muted-foreground py-2">No pages found.</p>;
  return (
    <div>
      {nodes.map((node, i) => (
        <ReadOnlyNode key={node.url + i} node={node} />
      ))}
    </div>
  );
};

const ReadOnlyNode = ({ node }: { node: TreeNodeData }) => {
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
            <ReadOnlyNode key={child.url + i} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};
