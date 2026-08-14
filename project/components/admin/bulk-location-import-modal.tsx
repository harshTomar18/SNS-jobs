'use client';

import { useState } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
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
import { masterDataApi } from '@/lib/scn-api';
import { toast } from 'sonner';

interface ParsedLocation {
  state: string;
  city: string;
  locality: string;
  isValid: boolean;
  error?: string;
}

interface BulkLocationImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BulkLocationImportModal({
  open,
  onOpenChange,
  onSuccess,
}: BulkLocationImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ParsedLocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseTextContent = (text: string): ParsedLocation[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: ParsedLocation[] = [];

    // Header check
    let startIdx = 0;
    if (lines.length > 0 && /state.*city.*locality/i.test(lines[0])) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      // Delimiters: comma, tab, pipe, hyphen or multiple spaces
      const parts = line.split(/,|\t|\||;/).map((p) => p.trim());
      const state = parts[0] || '';
      const city = parts[1] || '';
      const locality = parts[2] || '';

      const isValid = Boolean(state && city && locality);
      parsed.push({
        state,
        city,
        locality,
        isValid,
        error: !isValid ? 'State, City, and Locality are all required' : undefined,
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

          const parsed: ParsedLocation[] = rawJson.map((row: any) => {
            const state = String(row.State || row.state || row['State/UT'] || '').trim();
            const city = String(row.City || row.city || row.District || '').trim();
            const locality = String(row.Locality || row.locality || row.Area || '').trim();
            const isValid = Boolean(state && city && locality);
            return {
              state,
              city,
              locality,
              isValid,
              error: !isValid ? 'State, City, and Locality are required' : undefined,
            };
          });

          setItems(parsed);
          toast.success(`Parsed ${parsed.length} entries from Excel file`);
          return;
        } catch (e) {
          console.warn('XLSX parser fallback to text reader', e);
        }
      }

      // Plain text, CSV, Word text fallback
      const text = await uploadedFile.text();
      const parsed = parseTextContent(text);
      setItems(parsed);
      toast.success(`Parsed ${parsed.length} location records`);
    } catch (err) {
      toast.error('Failed to parse uploaded file. Please check format.');
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = 'State,City,Locality\nMaharashtra,Mumbai,Andheri East\nKarnataka,Bengaluru,Koramangala\nDelhi,New Delhi,Connaught Place\nTelangana,Hyderabad,Gachibowli';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bulk_locations_template.csv');
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
      toast.error('No valid location entries to import');
      return;
    }

    setIsSubmitting(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of validItems) {
      try {
        await masterDataApi.create('locations', {
          state: item.state,
          city: item.city,
          locality: item.locality,
        });
        successCount++;
      } catch (err) {
        failCount++;
      }
    }

    setIsSubmitting(false);
    toast.success(`Successfully imported ${successCount} locations${failCount > 0 ? ` (${failCount} failed)` : ''}`);
    onSuccess?.();
    onOpenChange(false);
    setFile(null);
    setItems([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Import State / City / Locality
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls, .csv) or Word / Text (.docx, .txt) file containing State, City, and Locality columns.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Select Excel / Word / Text File</p>
                <p className="text-xs text-muted-foreground">Supported: .xlsx, .csv, .docx, .txt</p>
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
              <span>File: <strong>{file.name}</strong> ({items.length} rows parsed)</span>
              <span className="text-success font-medium">{items.filter((i) => i.isValid).length} Valid entries</span>
            </div>
          )}

          {items.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-3 py-2 font-medium">State</th>
                    <th className="px-3 py-2 font-medium">City</th>
                    <th className="px-3 py-2 font-medium">Locality</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((row, idx) => (
                    <tr key={idx} className={row.isValid ? '' : 'bg-destructive/5'}>
                      <td className="px-3 py-2 font-medium">{row.state || '-'}</td>
                      <td className="px-3 py-2">{row.city || '-'}</td>
                      <td className="px-3 py-2">{row.locality || '-'}</td>
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <Badge variant="outline" className="border-success/20 bg-success/5 text-success gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/20 bg-destructive/5 text-destructive gap-1">
                            <AlertCircle className="h-3 w-3" /> Missing data
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
            {isSubmitting ? 'Importing...' : `Import ${items.filter((i) => i.isValid).length} Locations`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
