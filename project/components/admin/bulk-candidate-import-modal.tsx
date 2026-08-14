'use client';

import { useState } from 'react';
import { Upload, Users, Download, CheckCircle2, AlertCircle, Trash2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/scn-api';
import { toast } from 'sonner';

interface ParsedCandidate {
  name: string;
  email: string;
  phone: string;
  experienceYears?: number;
  city?: string;
  state?: string;
  skills?: string[];
  resumeUrl?: string;
  isValid: boolean;
  error?: string;
}

interface BulkCandidateImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkCandidateImportModal({
  open,
  onOpenChange,
  onSuccess,
}: BulkCandidateImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ParsedCandidate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseTextContent = (text: string): ParsedCandidate[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: ParsedCandidate[] = [];

    let startIdx = 0;
    if (lines.length > 0 && /name.*email/i.test(lines[0])) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/,|\t|\||;/).map((p) => p.trim());
      const name = parts[0] || '';
      const email = parts[1] || '';
      const phone = parts[2] || '';
      const expStr = parts[3] || '0';
      const city = parts[4] || '';
      const state = parts[5] || '';
      const skillsStr = parts[6] || '';
      const resumeUrl = parts[7] || '';

      const isValid = Boolean(name && email);
      parsed.push({
        name,
        email,
        phone,
        experienceYears: Number(expStr) || 0,
        city,
        state,
        skills: skillsStr ? skillsStr.split(';').map((s) => s.trim()) : [],
        resumeUrl,
        isValid,
        error: !isValid ? 'Candidate Name and Email are required' : undefined,
      });
    }

    return parsed;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    const filename = uploadedFile.name.toLowerCase();

    try {
      if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
        try {
          const XLSX = await import('xlsx');
          const buffer = await uploadedFile.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

          const parsed: ParsedCandidate[] = rawJson.map((row: any) => {
            const name = String(row.Name || row.name || row['Candidate Name'] || row['Full Name'] || '').trim();
            const email = String(row.Email || row.email || row['Email Address'] || '').trim();
            const phone = String(row.Phone || row.phone || row.Mobile || '').trim();
            const exp = Number(row.Experience || row.experience || row['Experience (Years)'] || 0);
            const city = String(row.City || row.city || row.Location || '').trim();
            const state = String(row.State || row.state || '').trim();
            const skillsStr = String(row.Skills || row.skills || '').trim();
            const resumeUrl = String(row.Resume || row.resume || row['Resume Link'] || '').trim();

            const isValid = Boolean(name && email);
            return {
              name,
              email,
              phone,
              experienceYears: exp,
              city,
              state,
              skills: skillsStr ? skillsStr.split(/;|\||,/).map((s) => s.trim()) : [],
              resumeUrl,
              isValid,
              error: !isValid ? 'Name and Email are required' : undefined,
            };
          });

          setItems(parsed);
          toast.success(`Parsed ${parsed.length} candidate profiles from Excel file`);
          return;
        } catch (e) {
          console.warn('XLSX parser fallback to text reader', e);
        }
      }

      const text = await uploadedFile.text();
      const parsed = parseTextContent(text);
      setItems(parsed);
      toast.success(`Parsed ${parsed.length} candidate records`);
    } catch (err) {
      toast.error('Failed to parse uploaded candidate file.');
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = 'Candidate Name,Email,Phone,Experience (Years),City,State,Skills,Resume Link\nRahul Sharma,rahul@example.com,9876543210,3,Mumbai,Maharashtra,React;Node.js,https://example.com/resume.pdf\nPriya Patel,priya@example.com,9876543211,5,Bengaluru,Karnataka,Python;Django,https://example.com/resume2.pdf';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bulk_candidates_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validItems = items.filter((i) => i.isValid);
    if (validItems.length === 0) {
      toast.error('No valid candidate entries to submit');
      return;
    }

    setIsSubmitting(true);
    try {
      const results = await adminApi.bulkCreateCandidates(validItems);
      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      toast.success(`Bulk candidate import complete: ${successCount} added${failCount > 0 ? `, ${failCount} failed/exists` : ''}`);
      onSuccess?.();
      onOpenChange(false);
      setFile(null);
      setItems([]);
    } catch (err) {
      toast.error('Failed to submit bulk candidate data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Bulk Candidate Data & Resume Upload
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls, .csv) or Word / Text (.docx, .txt) file containing Candidate Name, Email, Phone, Experience, Location, Skills, and Resume Links.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Select Excel / Word / Text Candidate File</p>
                <p className="text-xs text-muted-foreground">Formats: .xlsx, .xls, .csv, .docx, .txt</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={downloadSampleTemplate}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Template
              </Button>
              <label>
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button size="sm" className="cursor-pointer" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>File: <strong>{file.name}</strong> ({items.length} records parsed)</span>
              <span className="text-success font-medium">{items.filter((i) => i.isValid).length} Valid Candidate Records</span>
            </div>
          )}

          {items.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">Candidate Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                    <th className="px-3 py-2 font-medium">Location</th>
                    <th className="px-3 py-2 font-medium">Skills</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((row, idx) => (
                    <tr key={idx} className={row.isValid ? '' : 'bg-destructive/5'}>
                      <td className="px-3 py-2 font-medium">{row.name || '-'}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{row.email || '-'}</td>
                      <td className="px-3 py-2 text-xs">{row.phone || '-'}</td>
                      <td className="px-3 py-2 text-xs">{row.city ? `${row.city}${row.state ? `, ${row.state}` : ''}` : '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {(row.skills || []).slice(0, 2).map((s, sIdx) => (
                            <Badge key={sIdx} variant="outline" className="text-[10px] px-1 py-0">{s}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <Badge variant="outline" className="border-success/20 bg-success/5 text-success gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/20 bg-destructive/5 text-destructive gap-1 text-xs">
                            <AlertCircle className="h-3 w-3" /> Missing Name/Email
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || items.filter((i) => i.isValid).length === 0}
          >
            {isSubmitting ? 'Submitting...' : `Submit ${items.filter((i) => i.isValid).length} Candidates`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
