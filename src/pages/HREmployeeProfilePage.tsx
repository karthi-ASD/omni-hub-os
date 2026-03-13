import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useHRDepartments } from "@/hooks/useHRDepartments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, GraduationCap, Landmark, Shield, Heart, FileText, Clock, Plus, Upload, Pencil, Briefcase } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { toast } from "sonner";

const HREmployeeProfilePage = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { profile, isSuperAdmin, isBusinessAdmin, isHRManager } = useAuth();
  const { departments } = useHRDepartments();
  const canManage = isSuperAdmin || isBusinessAdmin || isHRManager;

  const [employee, setEmployee] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [insurance, setInsurance] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    full_name: "", email: "", mobile_number: "", date_of_birth: "", gender: "",
    current_address: "", permanent_address: "", employee_code: "",
    department_id: "", designation: "", reporting_manager_id: "",
    joining_date: "", work_location: "", employment_type: "full_time",
    employment_status: "active",
  });

  const fetchAll = useCallback(async () => {
    if (!employeeId) {
      setEmployee(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [empR, eduR, bankR, insR, emgR, docR, attR, allEmpR] = await Promise.all([
        supabase.from("hr_employees").select("*, departments(name)").eq("id", employeeId).maybeSingle(),
        supabase.from("hr_employee_education").select("*").eq("employee_id", employeeId),
        supabase.from("hr_employee_bank_details").select("*").eq("employee_id", employeeId).maybeSingle(),
        supabase.from("hr_employee_insurance").select("*").eq("employee_id", employeeId),
        supabase.from("hr_employee_emergency_contacts").select("*").eq("employee_id", employeeId),
        supabase.from("hr_employee_documents").select("*").eq("employee_id", employeeId).order("uploaded_at", { ascending: false }),
        supabase.from("hr_employee_attendance").select("*").eq("employee_id", employeeId).order("date", { ascending: false }).limit(50),
        supabase.from("hr_employees").select("id, full_name").eq("employment_status", "active"),
      ]);
      if (empR.error) {
        console.error("Failed to load employee:", empR.error);
      }
      setEmployee(empR.data);
      setAllEmployees(allEmpR.data ?? []);
      setEducation(eduR.data ?? []);
      setBankDetails(bankR.data);
      setInsurance(insR.data ?? []);
      setEmergencyContacts(emgR.data ?? []);
      setDocuments(docR.data ?? []);
      setAttendance(attR.data ?? []);
    } catch (err) {
      console.error("Error fetching employee details:", err);
      setEmployee(null);
    }
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Populate edit form when employee loads
  useEffect(() => {
    if (employee) {
      setEditProfileForm({
        full_name: employee.full_name || "",
        email: employee.email || "",
        mobile_number: employee.mobile_number || "",
        date_of_birth: employee.date_of_birth || "",
        gender: employee.gender || "",
        current_address: employee.current_address || "",
        permanent_address: employee.permanent_address || "",
        employee_code: employee.employee_code || "",
        department_id: employee.department_id || "",
        designation: employee.designation || "",
        reporting_manager_id: employee.reporting_manager_id || "",
        joining_date: employee.joining_date || "",
        work_location: employee.work_location || "",
        employment_type: employee.employment_type || "full_time",
        employment_status: employee.employment_status || "active",
      });
    }
  }, [employee]);

  const saveProfileEdit = async () => {
    if (!employeeId || !editProfileForm.full_name.trim()) {
      toast.error("Name is required");
      return;
    }

    const changes: Record<string, any> = {};
    const oldValues: Record<string, any> = {};
    for (const key of Object.keys(editProfileForm) as (keyof typeof editProfileForm)[]) {
      if (editProfileForm[key] !== (employee?.[key] || "")) {
        changes[key] = editProfileForm[key];
        oldValues[key] = employee?.[key] || "";
      }
    }

    if (Object.keys(changes).length === 0) {
      toast.info("No changes made");
      setEditProfileOpen(false);
      return;
    }

    await supabase.from("hr_employees").update(changes as any).eq("id", employeeId);

    if (profile?.business_id) {
      await supabase.from("audit_logs").insert({
        business_id: employee?.business_id || profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "UPDATE_EMPLOYEE",
        entity_type: "hr_employee",
        entity_id: employeeId,
        old_value_json: oldValues,
        new_value_json: changes,
      });
    }

    toast.success("Employee profile updated");
    setEditProfileOpen(false);
    fetchAll();
  };

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
  if (!employee) return (
    <div className="space-y-4 py-12 text-center">
      <p className="text-lg font-medium text-muted-foreground">Unable to load employee details</p>
      <p className="text-sm text-muted-foreground">The employee record may not exist or you may not have permission to view it.</p>
      <Button variant="outline" onClick={() => navigate("/hr/employees")}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Employee Directory</Button>
    </div>
  );

  const docTypes = ["Aadhar Card", "PAN Card", "Passport Photo", "Bank Details", "Resume", "Certificates", "Agreement", "Insurance", "Offer Letter"];
  const manager = employee.reporting_manager_id ? allEmployees.find(m => m.id === employee.reporting_manager_id) : null;

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
              {manager && <p className="text-xs text-muted-foreground">Reports to: {manager.full_name}</p>}
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
            {canManage && (
              <Button onClick={() => setEditProfileOpen(true)} variant="outline">
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="flex-wrap">
          <TabsTrigger value="personal"><User className="h-4 w-4 mr-1" /> Personal</TabsTrigger>
          <TabsTrigger value="jobrole"><Briefcase className="h-4 w-4 mr-1" /> Job Role</TabsTrigger>
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

        {/* Job Role & Responsibilities */}
        <TabsContent value="jobrole">
          <JobRoleSection
            employee={employee}
            employeeId={employeeId!}
            canManage={canManage}
            businessId={profile?.business_id}
            userId={profile?.user_id}
            onRefresh={fetchAll}
          />
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

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Employee Profile</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Employee Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Employee ID</Label><Input value={editProfileForm.employee_code} onChange={e => setEditProfileForm({ ...editProfileForm, employee_code: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editProfileForm.employment_status} onValueChange={v => setEditProfileForm({ ...editProfileForm, employment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="resigned">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={editProfileForm.department_id} onValueChange={v => setEditProfileForm({ ...editProfileForm, department_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{departments.filter(d => d.status === "active").map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Designation</Label><Input value={editProfileForm.designation} onChange={e => setEditProfileForm({ ...editProfileForm, designation: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reporting Manager</Label>
                <Select value={editProfileForm.reporting_manager_id} onValueChange={v => setEditProfileForm({ ...editProfileForm, reporting_manager_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {allEmployees.filter(m => m.id !== employeeId).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={editProfileForm.joining_date} onChange={e => setEditProfileForm({ ...editProfileForm, joining_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Work Location</Label><Input value={editProfileForm.work_location} onChange={e => setEditProfileForm({ ...editProfileForm, work_location: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={editProfileForm.employment_type} onValueChange={v => setEditProfileForm({ ...editProfileForm, employment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide pt-2">Personal Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name *</Label><Input value={editProfileForm.full_name} onChange={e => setEditProfileForm({ ...editProfileForm, full_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={editProfileForm.email} onChange={e => setEditProfileForm({ ...editProfileForm, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Mobile Number</Label><Input value={editProfileForm.mobile_number} onChange={e => setEditProfileForm({ ...editProfileForm, mobile_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={editProfileForm.date_of_birth} onChange={e => setEditProfileForm({ ...editProfileForm, date_of_birth: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={editProfileForm.gender} onValueChange={v => setEditProfileForm({ ...editProfileForm, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div />
            </div>
            <div className="space-y-2"><Label>Current Address</Label><Input value={editProfileForm.current_address} onChange={e => setEditProfileForm({ ...editProfileForm, current_address: e.target.value })} /></div>
            <div className="space-y-2"><Label>Permanent Address</Label><Input value={editProfileForm.permanent_address} onChange={e => setEditProfileForm({ ...editProfileForm, permanent_address: e.target.value })} /></div>

            <Button onClick={saveProfileEdit} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ───── Job Role & Responsibilities Section ───── */
function JobRoleSection({
  employee, employeeId, canManage, businessId, userId, onRefresh,
}: {
  employee: any; employeeId: string; canManage: boolean;
  businessId: string | null | undefined; userId: string | undefined;
  onRefresh: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(employee?.job_role_description || "");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setDescription(employee?.job_role_description || "");
  }, [employee?.job_role_description]);

  const saveDescription = async () => {
    await supabase.from("hr_employees").update({ job_role_description: description } as any).eq("id", employeeId);
    if (businessId && userId) {
      await supabase.from("audit_logs").insert({
        business_id: businessId, actor_user_id: userId,
        action_type: "UPDATE_JOB_ROLE", entity_type: "hr_employee", entity_id: employeeId,
        new_value_json: { job_role_description: description.slice(0, 200) + "..." },
      });
    }
    toast.success("Job role updated");
    setEditing(false);
    onRefresh();
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, DOC, DOCX allowed"); return; }
    setUploading(true);
    const path = `${businessId}/${employeeId}/job-role/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("hr-documents").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("hr-documents").getPublicUrl(path);
    await supabase.from("hr_employees").update({
      job_role_document_url: urlData.publicUrl,
      job_role_document_name: file.name,
    } as any).eq("id", employeeId);
    toast.success("Job role document uploaded");
    setUploading(false);
    onRefresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" /> Job Role & Responsibilities
        </CardTitle>
        {canManage && !editing && (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Job Description & Responsibilities</Label>
              <p className="text-xs text-muted-foreground">Include role overview, daily responsibilities, KPIs, work timing, and reporting structure.</p>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={12}
                placeholder={`Role Overview:\n\nDaily Responsibilities:\n• \n• \n\nWeekly Tasks:\n• \n\nKPIs & Performance Expectations:\n• \n\nWork Timing:\n\nReporting Structure:\n\nDepartment Responsibilities:\n• `}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveDescription}>Save</Button>
              <Button variant="outline" onClick={() => { setEditing(false); setDescription(employee?.job_role_description || ""); }}>Cancel</Button>
            </div>
          </>
        ) : (
          <>
            {employee?.job_role_description ? (
              <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed">
                {employee.job_role_description}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm italic">No job role description assigned yet.</p>
            )}
          </>
        )}

        {/* Document section */}
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-2">Job Role Document</h4>
          {employee?.job_role_document_url ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="h-5 w-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{employee.job_role_document_name || "Document"}</p>
                <a href={employee.job_role_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                  View / Download
                </a>
              </div>
              {canManage && (
                <label className="cursor-pointer">
                  <Button size="sm" variant="outline" asChild><span><Upload className="h-3 w-3 mr-1" /> Replace</span></Button>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleDocUpload} disabled={uploading} />
                </label>
              )}
            </div>
          ) : (
            <>
              {canManage ? (
                <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" /> Upload Job Role Document (PDF, DOC, DOCX)
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleDocUpload} disabled={uploading} />
                </label>
              ) : (
                <p className="text-muted-foreground text-sm italic">No document uploaded.</p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default HREmployeeProfilePage;
