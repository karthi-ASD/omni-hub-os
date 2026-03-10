import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User, GraduationCap, Landmark, Shield, Heart, FileText, Clock, Plus, Upload } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const HREmployeeProfilePage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const canManage = isSuperAdmin || isBusinessAdmin;

  const [employee, setEmployee] = useState<any>(null);
  const [education, setEducation] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const [empR, eduR, bankR, insR, emgR, docR, attR] = await Promise.all([
      supabase.from("hr_employees").select("*, departments(name)").eq("id", employeeId).single(),
      supabase.from("hr_employee_education").select("*").eq("employee_id", employeeId),
      supabase.from("hr_employee_bank_details").select("*").eq("employee_id", employeeId).maybeSingle(),
      supabase.from("hr_employee_insurance").select("*").eq("employee_id", employeeId),
      supabase.from("hr_employee_emergency_contacts").select("*").eq("employee_id", employeeId),
      supabase.from("hr_employee_documents").select("*").eq("employee_id", employeeId).order("uploaded_at", { ascending: false }),
      supabase.from("hr_employee_attendance").select("*").eq("employee_id", employeeId).order("date", { ascending: false }).limit(50),
    ]);
    setEmployee(empR.data);
    setEducation(eduR.data ?? []);
    setBankDetails(bankR.data);
    setInsurance(insR.data ?? []);
    setEmergencyContacts(emgR.data ?? []);
    setDocuments(docR.data ?? []);
    setAttendance(attR.data ?? []);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Education add
  const [eduForm, setEduForm] = useState({ qualification: "", college_name: "", year_of_passing: "", specialization: "" });
  const [eduOpen, setEduOpen] = useState(false);
  const addEducation = async () => {
    if (!eduForm.qualification) { toast.error("Qualification required"); return; }
    await supabase.from("hr_employee_education").insert([{ ...eduForm, employee_id: employeeId } as any]);
    toast.success("Education added");
    setEduOpen(false);
    setEduForm({ qualification: "", college_name: "", year_of_passing: "", specialization: "" });
    fetchAll();
  };

  // Bank details
  const [bankForm, setBankForm] = useState({ bank_name: "", account_number: "", ifsc_code: "", branch_name: "", upi_id: "" });
  const [bankOpen, setBankOpen] = useState(false);
  useEffect(() => {
    if (bankDetails) setBankForm({ bank_name: bankDetails.bank_name || "", account_number: bankDetails.account_number || "", ifsc_code: bankDetails.ifsc_code || "", branch_name: bankDetails.branch_name || "", upi_id: bankDetails.upi_id || "" });
  }, [bankDetails]);
  const saveBankDetails = async () => {
    if (bankDetails?.id) {
      await supabase.from("hr_employee_bank_details").update(bankForm as any).eq("id", bankDetails.id);
    } else {
      await supabase.from("hr_employee_bank_details").insert([{ ...bankForm, employee_id: employeeId } as any]);
    }
    toast.success("Bank details saved");
    setBankOpen(false);
    fetchAll();
  };

  // Emergency contact
  const [emgForm, setEmgForm] = useState({ contact_name: "", phone_number: "", relationship: "" });
  const [emgOpen, setEmgOpen] = useState(false);
  const addEmergencyContact = async () => {
    if (!emgForm.contact_name || !emgForm.phone_number) { toast.error("Name and phone required"); return; }
    await supabase.from("hr_employee_emergency_contacts").insert([{ ...emgForm, employee_id: employeeId } as any]);
    toast.success("Emergency contact added");
    setEmgOpen(false);
    setEmgForm({ contact_name: "", phone_number: "", relationship: "" });
    fetchAll();
  };

  // Insurance
  const [insForm, setInsForm] = useState({ provider: "", policy_number: "", coverage_amount: "", policy_start: "", policy_expiry: "" });
  const [insOpen, setInsOpen] = useState(false);
  const addInsurance = async () => {
    await supabase.from("hr_employee_insurance").insert([{ ...insForm, employee_id: employeeId, coverage_amount: Number(insForm.coverage_amount) || 0 } as any]);
    toast.success("Insurance added");
    setInsOpen(false);
    setInsForm({ provider: "", policy_number: "", coverage_amount: "", policy_start: "", policy_expiry: "" });
    fetchAll();
  };

  // Document upload
  const [docUploading, setDocUploading] = useState(false);
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file || !employeeId || !profile?.business_id) return;
    setDocUploading(true);
    const path = `${profile.business_id}/${employeeId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("hr-documents").upload(path, file);
    if (uploadErr) { toast.error("Upload failed"); setDocUploading(false); return; }
    const { data: urlData } = supabase.storage.from("hr-documents").getPublicUrl(path);
    await supabase.from("hr_employee_documents").insert([{
      employee_id: employeeId, business_id: profile.business_id,
      document_type: docType, file_name: file.name, file_url: urlData.publicUrl, file_type: file.type,
    } as any]);
    toast.success("Document uploaded");
    setDocUploading(false);
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!employee) return <div className="text-center py-12 text-muted-foreground">Employee not found</div>;

  const docTypes = ["Aadhar Card", "PAN Card", "Passport Photo", "Bank Details", "Resume", "Certificates", "Agreement", "Insurance", "Offer Letter"];

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/hr/employees")} className="mb-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{employee.full_name}</h1>
              <p className="text-muted-foreground">{employee.designation || "No designation"} · {employee.departments?.name || "No department"}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant={employee.employment_status === "active" ? "default" : "destructive"}>{employee.employment_status}</Badge>
                <Badge variant="outline">{employee.employee_code}</Badge>
                <Badge variant="secondary">{employee.employment_type?.replace("_", " ")}</Badge>
              </div>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>📧 {employee.email}</p>
              <p>📱 {employee.mobile_number || "—"}</p>
              <p>📍 {employee.work_location || "—"}</p>
              {employee.joining_date && <p>📅 Joined {format(new Date(employee.joining_date), "dd MMM yyyy")}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personal"><User className="h-4 w-4 mr-1" /> Personal</TabsTrigger>
          <TabsTrigger value="education"><GraduationCap className="h-4 w-4 mr-1" /> Education</TabsTrigger>
          <TabsTrigger value="bank"><Landmark className="h-4 w-4 mr-1" /> Bank</TabsTrigger>
          <TabsTrigger value="emergency"><Shield className="h-4 w-4 mr-1" /> Emergency</TabsTrigger>
          <TabsTrigger value="insurance"><Heart className="h-4 w-4 mr-1" /> Insurance</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="h-4 w-4 mr-1" /> Documents</TabsTrigger>
          <TabsTrigger value="attendance"><Clock className="h-4 w-4 mr-1" /> Attendance</TabsTrigger>
        </TabsList>

        {/* Personal */}
        <TabsContent value="personal">
          <Card>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["Full Name", employee.full_name],
                ["Email", employee.email],
                ["Mobile", employee.mobile_number],
                ["Date of Birth", employee.date_of_birth ? format(new Date(employee.date_of_birth), "dd MMM yyyy") : "—"],
                ["Gender", employee.gender || "—"],
                ["Current Address", employee.current_address || "—"],
                ["Permanent Address", employee.permanent_address || "—"],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{val || "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Education</CardTitle>
              {canManage && (
                <Dialog open={eduOpen} onOpenChange={setEduOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Education</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Qualification *</Label><Input value={eduForm.qualification} onChange={e => setEduForm({ ...eduForm, qualification: e.target.value })} /></div>
                      <div><Label>College</Label><Input value={eduForm.college_name} onChange={e => setEduForm({ ...eduForm, college_name: e.target.value })} /></div>
                      <div><Label>Year</Label><Input value={eduForm.year_of_passing} onChange={e => setEduForm({ ...eduForm, year_of_passing: e.target.value })} /></div>
                      <div><Label>Specialization</Label><Input value={eduForm.specialization} onChange={e => setEduForm({ ...eduForm, specialization: e.target.value })} /></div>
                      <Button onClick={addEducation} className="w-full">Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {education.length === 0 ? <p className="text-muted-foreground text-sm">No education records</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Qualification</TableHead><TableHead>College</TableHead><TableHead>Year</TableHead><TableHead>Specialization</TableHead></TableRow></TableHeader>
                  <TableBody>{education.map(ed => (
                    <TableRow key={ed.id}><TableCell>{ed.qualification}</TableCell><TableCell>{ed.college_name || "—"}</TableCell><TableCell>{ed.year_of_passing || "—"}</TableCell><TableCell>{ed.specialization || "—"}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank */}
        <TabsContent value="bank">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Details</CardTitle>
              {canManage && (
                <Dialog open={bankOpen} onOpenChange={setBankOpen}>
                  <DialogTrigger asChild><Button size="sm">{bankDetails ? "Edit" : "Add"}</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Bank Details</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Bank Name</Label><Input value={bankForm.bank_name} onChange={e => setBankForm({ ...bankForm, bank_name: e.target.value })} /></div>
                      <div><Label>Account Number</Label><Input value={bankForm.account_number} onChange={e => setBankForm({ ...bankForm, account_number: e.target.value })} /></div>
                      <div><Label>IFSC Code</Label><Input value={bankForm.ifsc_code} onChange={e => setBankForm({ ...bankForm, ifsc_code: e.target.value })} /></div>
                      <div><Label>Branch</Label><Input value={bankForm.branch_name} onChange={e => setBankForm({ ...bankForm, branch_name: e.target.value })} /></div>
                      <div><Label>UPI ID</Label><Input value={bankForm.upi_id} onChange={e => setBankForm({ ...bankForm, upi_id: e.target.value })} /></div>
                      <Button onClick={saveBankDetails} className="w-full">Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {!bankDetails ? <p className="text-muted-foreground text-sm">No bank details</p> : (
                <div className="grid grid-cols-2 gap-4">
                  {[["Bank", bankDetails.bank_name], ["Account", bankDetails.account_number], ["IFSC", bankDetails.ifsc_code], ["Branch", bankDetails.branch_name], ["UPI", bankDetails.upi_id]].map(([l, v]) => (
                    <div key={l}><p className="text-xs text-muted-foreground">{l}</p><p className="font-medium">{v || "—"}</p></div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Emergency Contacts</CardTitle>
              {canManage && (
                <Dialog open={emgOpen} onOpenChange={setEmgOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Emergency Contact</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Name *</Label><Input value={emgForm.contact_name} onChange={e => setEmgForm({ ...emgForm, contact_name: e.target.value })} /></div>
                      <div><Label>Phone *</Label><Input value={emgForm.phone_number} onChange={e => setEmgForm({ ...emgForm, phone_number: e.target.value })} /></div>
                      <div><Label>Relationship</Label><Input value={emgForm.relationship} onChange={e => setEmgForm({ ...emgForm, relationship: e.target.value })} /></div>
                      <Button onClick={addEmergencyContact} className="w-full">Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {emergencyContacts.length === 0 ? <p className="text-muted-foreground text-sm">No contacts</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Relationship</TableHead></TableRow></TableHeader>
                  <TableBody>{emergencyContacts.map(c => (
                    <TableRow key={c.id}><TableCell>{c.contact_name}</TableCell><TableCell>{c.phone_number}</TableCell><TableCell>{c.relationship || "—"}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insurance */}
        <TabsContent value="insurance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Insurance & Benefits</CardTitle>
              {canManage && (
                <Dialog open={insOpen} onOpenChange={setInsOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Insurance</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div><Label>Provider</Label><Input value={insForm.provider} onChange={e => setInsForm({ ...insForm, provider: e.target.value })} /></div>
                      <div><Label>Policy Number</Label><Input value={insForm.policy_number} onChange={e => setInsForm({ ...insForm, policy_number: e.target.value })} /></div>
                      <div><Label>Coverage Amount</Label><Input type="number" value={insForm.coverage_amount} onChange={e => setInsForm({ ...insForm, coverage_amount: e.target.value })} /></div>
                      <div><Label>Start Date</Label><Input type="date" value={insForm.policy_start} onChange={e => setInsForm({ ...insForm, policy_start: e.target.value })} /></div>
                      <div><Label>Expiry Date</Label><Input type="date" value={insForm.policy_expiry} onChange={e => setInsForm({ ...insForm, policy_expiry: e.target.value })} /></div>
                      <Button onClick={addInsurance} className="w-full">Add</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              {insurance.length === 0 ? <p className="text-muted-foreground text-sm">No insurance records</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Provider</TableHead><TableHead>Policy #</TableHead><TableHead>Coverage</TableHead><TableHead>Start</TableHead><TableHead>Expiry</TableHead></TableRow></TableHeader>
                  <TableBody>{insurance.map(ins => (
                    <TableRow key={ins.id}><TableCell>{ins.provider || "—"}</TableCell><TableCell>{ins.policy_number || "—"}</TableCell><TableCell>{ins.coverage_amount || 0}</TableCell><TableCell>{ins.policy_start || "—"}</TableCell><TableCell>{ins.policy_expiry || "—"}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {canManage && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {docTypes.map(dt => (
                    <div key={dt} className="border rounded-lg p-3 text-center">
                      <p className="text-xs font-medium mb-2">{dt}</p>
                      <label className="cursor-pointer">
                        <div className="flex items-center justify-center gap-1 text-xs text-primary hover:underline">
                          <Upload className="h-3 w-3" /> Upload
                        </div>
                        <input type="file" className="hidden" onChange={e => handleDocUpload(e, dt)} disabled={docUploading} />
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {documents.length === 0 ? <p className="text-muted-foreground text-sm">No documents uploaded</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>File</TableHead><TableHead>Uploaded</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>{documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell><Badge variant="outline">{doc.document_type}</Badge></TableCell>
                      <TableCell className="text-sm">{doc.file_name}</TableCell>
                      <TableCell className="text-sm">{format(new Date(doc.uploaded_at), "dd MMM yyyy")}</TableCell>
                      <TableCell><a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">Download</a></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
            <CardContent>
              {attendance.length === 0 ? <p className="text-muted-foreground text-sm">No attendance records</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Hours</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                  <TableBody>{attendance.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>{a.date}</TableCell>
                      <TableCell>{a.check_in_time ? format(new Date(a.check_in_time), "HH:mm") : "—"}</TableCell>
                      <TableCell>{a.check_out_time ? format(new Date(a.check_out_time), "HH:mm") : "—"}</TableCell>
                      <TableCell>{a.total_hours ?? "—"}</TableCell>
                      <TableCell><Badge variant={a.status === "present" ? "default" : "secondary"}>{a.status}</Badge></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HREmployeeProfilePage;
