import { useDemoMode } from "@/hooks/useDemoMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Play, RotateCcw, Plus, Phone, Mail, MessageSquare, Briefcase } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

const DemoModePage = () => {
  const {
    config, simulations, analytics, demoJobs, loading,
    upsertConfig, toggleDemo, runDemoInquiry,
    createDemoJob, updateDemoJobStatus, resetDemoData,
  } = useDemoMode();

  const [simName, setSimName] = useState("John Smith");
  const [simEmail, setSimEmail] = useState("demo@example.com");
  const [simPhone, setSimPhone] = useState("0400000000");
  const [simService, setSimService] = useState("SEO");
  const [jobCustomer, setJobCustomer] = useState("Demo Customer");
  const [jobTitle, setJobTitle] = useState("Demo Service Job");
  const [demoPhone, setDemoPhone] = useState(config?.demo_phone ?? "");
  const [demoWhatsapp, setDemoWhatsapp] = useState(config?.demo_whatsapp ?? "");
  const [profileType, setProfileType] = useState(config?.demo_profile_type ?? "GENERAL");
  const [configOpen, setConfigOpen] = useState(false);

  const chartData = analytics.map(a => ({
    date: format(new Date(a.date), "dd MMM"),
    total: a.total_inquiries,
    demo: a.demo_inquiries,
    responded: a.responded_count,
    converted: a.converted_count,
  }));

  const handleSaveConfig = async () => {
    await upsertConfig({
      demo_phone: demoPhone,
      demo_whatsapp: demoWhatsapp,
      demo_profile_type: profileType,
    });
    setConfigOpen(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Demo Mode Engine</h1>
          <p className="text-muted-foreground">Sales simulation & controlled demo environment</p>
        </div>
        <div className="flex items-center gap-3">
          {config?.demo_enabled && (
            <Badge variant="destructive" className="animate-pulse">DEMO MODE ACTIVE</Badge>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="demo-toggle" className="text-sm">Demo Mode</Label>
            <Switch
              id="demo-toggle"
              checked={config?.demo_enabled ?? false}
              onCheckedChange={toggleDemo}
            />
          </div>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Configure</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Demo Configuration</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Profile Type</Label>
                  <Select value={profileType} onValueChange={setProfileType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="BUILDER">Builder</SelectItem>
                      <SelectItem value="TRADIE">Tradie</SelectItem>
                      <SelectItem value="CLINIC">Clinic</SelectItem>
                      <SelectItem value="ECOMMERCE">E-Commerce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Demo Phone</Label><Input value={demoPhone} onChange={e => setDemoPhone(e.target.value)} placeholder="+61400000000" /></div>
                <div><Label>Demo WhatsApp</Label><Input value={demoWhatsapp} onChange={e => setDemoWhatsapp(e.target.value)} placeholder="+61400000000" /></div>
                <Button onClick={handleSaveConfig} className="w-full">Save Configuration</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="destructive" size="sm" onClick={resetDemoData}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset Demo Data
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Simulated Inquiries</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{simulations.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Demo Jobs</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{demoJobs.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Analytics Days</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{analytics.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Profile Type</CardTitle></CardHeader>
          <CardContent><Badge variant="secondary">{config?.demo_profile_type ?? "GENERAL"}</Badge></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inquiries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inquiries">Inquiry Simulator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Graph</TabsTrigger>
          <TabsTrigger value="jobs">Job CRM Demo</TabsTrigger>
          <TabsTrigger value="history">Simulation History</TabsTrigger>
        </TabsList>

        {/* Inquiry Simulator */}
        <TabsContent value="inquiries">
          <Card>
            <CardHeader><CardTitle>Run Demo Inquiry</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><Label>Name</Label><Input value={simName} onChange={e => setSimName(e.target.value)} /></div>
                <div><Label>Email</Label><Input value={simEmail} onChange={e => setSimEmail(e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={simPhone} onChange={e => setSimPhone(e.target.value)} /></div>
                <div><Label>Service Interest</Label>
                  <Select value={simService} onValueChange={setSimService}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEO">SEO</SelectItem>
                      <SelectItem value="Google Ads">Google Ads</SelectItem>
                      <SelectItem value="Web Design">Web Design</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Hosting">Hosting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => runDemoInquiry(simName, simEmail, simPhone, simService)}>
                  <Play className="h-4 w-4 mr-1" /> Run Demo Inquiry
                </Button>
                <Button variant="outline" disabled>
                  <Mail className="h-4 w-4 mr-1" /> Send Demo Email
                </Button>
                <Button variant="outline" disabled>
                  <MessageSquare className="h-4 w-4 mr-1" /> Send Demo WhatsApp
                </Button>
                <Button variant="outline" disabled>
                  <Phone className="h-4 w-4 mr-1" /> Send Demo SMS
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                SMS/WhatsApp/Email sending requires provider keys to be configured in Dependencies settings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Graph */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Daily Inquiries (Bar)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" />
                    <Bar dataKey="demo" fill="hsl(var(--muted-foreground))" name="Demo" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Response & Conversion (Line)</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="responded" stroke="hsl(var(--primary))" name="Responded" />
                    <Line type="monotone" dataKey="converted" stroke="hsl(var(--destructive))" name="Converted" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Job CRM Demo */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Demo Jobs</CardTitle>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Demo Job</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Demo Job</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Customer Name</Label><Input value={jobCustomer} onChange={e => setJobCustomer(e.target.value)} /></div>
                    <div><Label>Job Title</Label><Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} /></div>
                    <Button onClick={() => createDemoJob(jobCustomer, jobTitle)} className="w-full">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demoJobs.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No demo jobs yet</TableCell></TableRow>
                  ) : demoJobs.map(j => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{j.simulated_customer}</TableCell>
                      <TableCell>{j.job_title}</TableCell>
                      <TableCell><Badge variant={j.status === "COMPLETED" ? "default" : "secondary"}>{j.status}</Badge></TableCell>
                      <TableCell>
                        <Select value={j.status} onValueChange={s => updateDemoJobStatus(j.id, s)}>
                          <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="ASSIGNED">Assigned</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation History */}
        <TabsContent value="history">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulations.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No simulations yet</TableCell></TableRow>
                  ) : simulations.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.simulated_name}</TableCell>
                      <TableCell>{s.simulated_email ?? "—"}</TableCell>
                      <TableCell>{s.simulated_phone ?? "—"}</TableCell>
                      <TableCell>{s.simulated_service ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DemoModePage;
