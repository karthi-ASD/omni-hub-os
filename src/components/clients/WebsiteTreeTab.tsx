import { useState } from "react";
import { useWebsiteStructure, TreeNode } from "@/hooks/useWebsiteStructure";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw, ChevronRight, ChevronDown, Globe, FileText,
  ExternalLink, FolderTree, GitBranch, Loader2,
} from "lucide-react";

interface TreeNodeViewProps {
  node: TreeNode;
  defaultExpanded?: boolean;
}

const TreeNodeView = ({ node, defaultExpanded = false }: TreeNodeViewProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded || node.page.level < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1.5 px-2 rounded-lg hover:bg-muted/50 cursor-pointer group transition-colors"
        style={{ paddingLeft: `${node.page.level * 20 + 8}px` }}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <button className="p-0.5 rounded hover:bg-muted" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}

        {node.page.level === 0 ? (
          <Globe className="h-4 w-4 text-primary shrink-0" />
        ) : hasChildren ? (
          <FolderTree className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}

        <span className="text-sm font-medium truncate flex-1">
          {node.page.page_title || "Untitled"}
        </span>

        {hasChildren && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {node.children.length}
          </Badge>
        )}

        <a
          href={node.page.url}
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
          {node.children.map((child) => (
            <TreeNodeView key={child.page.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

// Simple flowchart-style view
const FlowchartView = ({ nodes }: { nodes: TreeNode[] }) => {
  return (
    <div className="overflow-auto p-4">
      {nodes.map((root) => (
        <FlowchartNode key={root.page.id} node={root} isRoot />
      ))}
    </div>
  );
};

const FlowchartNode = ({ node, isRoot = false }: { node: TreeNode; isRoot?: boolean }) => {
  return (
    <div className="flex flex-col items-center">
      <a
        href={node.page.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`
          px-4 py-2 rounded-xl border text-center min-w-[120px] max-w-[200px] truncate
          transition-all hover:shadow-md hover:border-primary/50
          ${isRoot
            ? "bg-primary text-primary-foreground border-primary font-semibold"
            : "bg-card text-card-foreground border-border hover:bg-muted/50"
          }
        `}
      >
        <span className="text-xs block truncate">{node.page.page_title || "Page"}</span>
      </a>

      {node.children.length > 0 && (
        <>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-2 flex-wrap justify-center relative">
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/4 right-1/4 h-px bg-border" />
            )}
            {node.children.map((child) => (
              <div key={child.page.id} className="flex flex-col items-center">
                <div className="w-px h-4 bg-border" />
                <FlowchartNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface WebsiteTreeTabProps {
  clientId: string;
  websiteUrl?: string;
}

export const WebsiteTreeTab = ({ clientId, websiteUrl }: WebsiteTreeTabProps) => {
  const { pages, tree, loading, crawling, crawlSitemap } = useWebsiteStructure(clientId);
  const [view, setView] = useState<"tree" | "flowchart">("tree");

  if (loading) {
    return (
      <Card className="rounded-xl">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" /> Website Structure
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                className={`px-3 py-1 text-xs transition-colors ${view === "tree" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                onClick={() => setView("tree")}
              >
                Tree
              </button>
              <button
                className={`px-3 py-1 text-xs transition-colors ${view === "flowchart" ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"}`}
                onClick={() => setView("flowchart")}
              >
                Flowchart
              </button>
            </div>
            {websiteUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => crawlSitemap(websiteUrl)}
                disabled={crawling}
              >
                {crawling ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                )}
                {crawling ? "Crawling…" : pages.length > 0 ? "Refresh" : "Scan Website"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No website structure mapped yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                {websiteUrl ? "Click 'Scan Website' to discover pages" : "Add a website URL to the client first"}
              </p>
              {websiteUrl && (
                <Button
                  size="sm"
                  onClick={() => crawlSitemap(websiteUrl)}
                  disabled={crawling}
                >
                  {crawling ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Globe className="h-3.5 w-3.5 mr-1" />}
                  {crawling ? "Scanning…" : "Scan Website"}
                </Button>
              )}
            </div>
          ) : view === "tree" ? (
            <div className="max-h-[500px] overflow-auto">
              {tree.map((node) => (
                <TreeNodeView key={node.page.id} node={node} defaultExpanded />
              ))}
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto">
              <FlowchartView nodes={tree} />
            </div>
          )}

          {pages.length > 0 && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {pages.length} pages discovered
              </p>
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(pages[0]?.updated_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
