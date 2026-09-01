'use client';

import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Trash2, Layers } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { MasterResource, masterDataApi } from '@/lib/scn-api';
import { toast } from 'sonner';

interface ParsedMasterItem {
  name: string;
  level?: string;
  state?: string;
  city?: string;
  locality?: string;
  isValid: boolean;
  error?: string;
}

interface BulkMasterDataImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: MasterResource;
  resourceLabel: string;
  functionsList?: { id: string | number; name: string }[];
  onSuccess?: () => void;
}

export function BulkMasterDataImportModal({
  open,
  onOpenChange,
  resource,
  resourceLabel,
  functionsList = [],
  onSuccess,
}: BulkMasterDataImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<ParsedMasterItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState<string>('GRADUATE');
  const [selectedFunctionId, setSelectedFunctionId] = useState<string>('');

  useEffect(() => {
    if (!open) {
      setFile(null);
      setItems([]);
      setIsSubmitting(false);
      setProgressCount(0);
      setSelectedLevel('GRADUATE');
      setSelectedFunctionId('');
    }
  }, [open, resource]);

  const parseTextContent = (text: string): ParsedMasterItem[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: ParsedMasterItem[] = [];

    let startIdx = 0;
    if (lines.length > 0) {
      const headerLine = lines[0].toLowerCase();
      if (
        headerLine.includes('name') ||
        headerLine.includes('state') ||
        headerLine.includes('title') ||
        headerLine.includes('qualification') ||
        headerLine.includes('post graduate') ||
        headerLine.includes('graduate') ||
        headerLine.includes('diploma')
      ) {
        startIdx = 1;
      }
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/,|\t|\||;/).map((p) => p.trim());

      if (resource === 'locations') {
        const state = parts[0] || '';
        const city = parts[1] || '';
        const locality = parts[2] || '';
        const isValid = Boolean(state && city && locality);
        parsed.push({
          name: `${city} - ${locality}`,
          state,
          city,
          locality,
          isValid,
          error: !isValid ? 'State, City, and Locality required' : undefined,
        });
      } else if (resource === 'qualifications') {
        const name = parts[0] || '';
        const level = parts[1] || selectedLevel || 'GRADUATE';
        const isValid = Boolean(name);
        parsed.push({
          name,
          level,
          isValid,
          error: !isValid ? 'Qualification Name required' : undefined,
        });
      } else {
        // Single column items: Industries, Skills, Job Roles, Languages, Benefits, Assets
        const name = parts[0] || '';
        const isValid = Boolean(name);
        parsed.push({
          name,
          isValid,
          error: !isValid ? 'Item Name required' : undefined,
        });
      }
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

          const parsed: ParsedMasterItem[] = rawJson
            .map((row: any): ParsedMasterItem | null => {
              if (resource === 'locations') {
                const state = String(row.State || row.state || row['State/UT'] || '').trim();
                const city = String(row.City || row.city || row.District || '').trim();
                const locality = String(row.Locality || row.locality || row.Area || '').trim();
                const isValid = Boolean(state && city && locality);
                return {
                  name: `${city} - ${locality}`,
                  state,
                  city,
                  locality,
                  isValid,
                  error: !isValid ? 'State, City, and Locality required' : undefined,
                };
              } else if (resource === 'qualifications') {
                const name = String(row.Name || row.name || row.Qualification || row['Qualification Name'] || Object.values(row)[0] || '').trim();
                const level = String(row.Level || row.level || selectedLevel || 'GRADUATE').trim();
                // Check if title row (e.g. "Post Graduate" title header)
                if (name.toLowerCase() === 'post graduate' || name.toLowerCase() === 'graduate' || name.toLowerCase() === 'diploma') {
                  return null;
                }
                const isValid = Boolean(name);
                return {
                  name,
                  level,
                  isValid,
                  error: !isValid ? 'Name required' : undefined,
                };
              } else {
                const keys = Object.keys(row);
                const nameKey = keys.find((k) => /name|title|industry|function|skill|role|language|benefit|asset/i.test(k)) || keys[0];
                const name = String(row[nameKey] || '').trim();
                const isValid = Boolean(name);
                return {
                  name,
                  isValid,
                  error: !isValid ? 'Name required' : undefined,
                };
              }
            })
            .filter((item): item is ParsedMasterItem => item !== null);

          setItems(parsed);
          toast.success(`Parsed ${parsed.length} entries for ${resourceLabel}`);
          return;
        } catch (e) {
          console.warn('XLSX parser fallback to text reader', e);
        }
      }

      const text = await uploadedFile.text();
      const parsed = parseTextContent(text);
      setItems(parsed);
      toast.success(`Parsed ${parsed.length} entries for ${resourceLabel}`);
    } catch (err) {
      toast.error(`Failed to parse file for ${resourceLabel}. Please check file format.`);
    }
  };

  const downloadSampleTemplate = () => {
    let csvContent = '';
    let filename = `bulk_${resource}_template.csv`;

    if (resource === 'locations') {
      csvContent = 'State,City,Locality\nMaharashtra,Mumbai,Andheri East\nKarnataka,Bengaluru,Koramangala\nDelhi,New Delhi,Connaught Place\nTelangana,Hyderabad,Gachibowli';
    } else if (resource === 'qualifications') {
      csvContent = 'Qualification Name\nBachelor of Technology\nMaster of Business Administration\nDiploma in Mechanical Engineering\n10th Standard\n12th Standard';
    } else if (resource === 'industries') {
      csvContent = 'Name\nInformation Technology & Services\nHealthcare & Pharmaceuticals\nBanking & Financial Services\nManufacturing & Industrial\nRetail & E-commerce';
    } else if (resource === 'functions') {
      csvContent = 'Name\nMarketing & Communication\nBFSI, Investments & Trading\nSoftware Engineering\nHuman Resources\nSales & Business Development';
    } else if (resource === 'skills') {
      csvContent = 'Name\nReact.js\nNode.js\nPython\nProject Management\nData Analysis\nCustomer Service';
    } else if (resource === 'job-roles') {
      csvContent = 'Name\nFull Stack Developer\nSales Manager\nAccountant\nStore Manager\nQuality Analyst';
    } else if (resource === 'languages') {
      csvContent = 'Name\nHindi\nEnglish\nMarathi\nTamil\nTelugu\nKannada\nBengali\nGujarati';
    } else if (resource === 'benefits') {
      csvContent = 'Name\nHealth Insurance\nFlexible Hours\nPerformance Bonus\nPaid Time Off\nTransport Allowance';
    } else if (resource === 'assets') {
      csvContent = 'Name\nCompany Laptop\nMobile Phone\nUniform\nTool Kit\nSIM Card';
    } else {
      csvContent = 'Name\nItem 1\nItem 2\nItem 3';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!file && items.length === 0) {
      toast.error('Please select a file to import');
      return;
    }

    setIsSubmitting(true);

    // Primary path: Direct backend API file upload
    if (file) {
      try {
        await masterDataApi.importBulk(resource, file, {
          functionId: selectedFunctionId || undefined,
          level: selectedLevel || undefined,
        });
        toast.success(`Bulk import completed successfully for ${resourceLabel}!`);
        setIsSubmitting(false);
        onSuccess?.();
        onOpenChange(false);
        return;
      } catch (apiErr) {
        console.warn('Direct API import returned error, executing fallback batch creation...', apiErr);
      }
    }

    // Fallback path: client-side row-by-row batch creation
    const validItems = items.filter((i) => i.isValid);
    if (validItems.length === 0) {
      setIsSubmitting(false);
      toast.error('No valid items to import');
      return;
    }

    setProgressCount(0);
    let successCount = 0;
    let failCount = 0;

    const chunkSize = 10;
    for (let i = 0; i < validItems.length; i += chunkSize) {
      const chunk = validItems.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (item) => {
          try {
            if (resource === 'locations') {
              await masterDataApi.create('locations', {
                state: item.state,
                city: item.city,
                locality: item.locality,
              });
            } else if (resource === 'qualifications') {
              await masterDataApi.create('qualifications', {
                name: item.name,
                level: selectedLevel || item.level || 'GRADUATE',
              });
            } else {
              await masterDataApi.create(resource, { name: item.name });
            }
            successCount++;
          } catch (err) {
            failCount++;
          }
        })
      );
      setProgressCount(Math.min(i + chunkSize, validItems.length));
    }

    setIsSubmitting(false);
    toast.success(`Bulk import completed: ${successCount} ${resourceLabel} added${failCount > 0 ? ` (${failCount} duplicates/failed)` : ''}`);
    onSuccess?.();
    onOpenChange(false);
  };

  const validCount = items.filter((i) => i.isValid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Bulk Import {resourceLabel}
          </DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx, .xls) or text/CSV file containing {resourceLabel} records to import them in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* Resource Specific Extra Parameter Form Fields */}
          {resource === 'qualifications' && (
            <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Qualification Level (Required)
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="GRADUATE">GRADUATE</option>
                <option value="POST_GRADUATE">POST_GRADUATE</option>
                <option value="DIPLOMA">DIPLOMA</option>
                <option value="TEN">TEN (10th Pass)</option>
                <option value="TWELVE">TWELVE (12th Pass)</option>
                <option value="ANY">ANY</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Level header required for qualification imports.
              </p>
            </div>
          )}

          {resource === 'job-roles' && (
            <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Scope under Job Function (Optional)
              </label>
              {functionsList && functionsList.length > 0 ? (
                <select
                  value={selectedFunctionId}
                  onChange={(e) => setSelectedFunctionId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Unscoped (No Job Function)</option>
                  {functionsList.map((fn) => (
                    <option key={fn.id} value={String(fn.id)}>
                      {fn.name} (ID: {fn.id})
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Enter Numeric Job Function ID (e.g. 5)"
                  value={selectedFunctionId}
                  onChange={(e) => setSelectedFunctionId(e.target.value)}
                  type="number"
                />
              )}
              <p className="text-xs text-muted-foreground">
                If set, every imported role is scoped under that one Job Function.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-dashed border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Select File for {resourceLabel}</p>
                <p className="text-xs text-muted-foreground">Supported formats: .xlsx, .xls, .csv, .txt</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
              <span className="text-success font-medium">{validCount} Valid {resourceLabel} entries</span>
            </div>
          )}

          {isSubmitting && (
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Importing {resourceLabel}...</span>
                <span>{progressCount} / {validCount || items.length || 1}</span>
              </div>
              <Progress value={validCount ? (progressCount / validCount) * 100 : 50} className="h-2" />
            </div>
          )}

          {items.length > 0 && !isSubmitting && (
            <div className="border border-border rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground sticky top-0">
                  <tr>
                    {resource === 'locations' ? (
                      <>
                        <th className="px-3 py-2 font-medium">State</th>
                        <th className="px-3 py-2 font-medium">City</th>
                        <th className="px-3 py-2 font-medium">Locality</th>
                      </>
                    ) : resource === 'qualifications' ? (
                      <>
                        <th className="px-3 py-2 font-medium">Qualification Name</th>
                        <th className="px-3 py-2 font-medium">Level</th>
                      </>
                    ) : (
                      <th className="px-3 py-2 font-medium">{resourceLabel} Item Name</th>
                    )}
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.slice(0, 100).map((row, idx) => (
                    <tr key={idx} className={row.isValid ? '' : 'bg-destructive/5'}>
                      {resource === 'locations' ? (
                        <>
                          <td className="px-3 py-2 font-medium">{row.state || '-'}</td>
                          <td className="px-3 py-2">{row.city || '-'}</td>
                          <td className="px-3 py-2">{row.locality || '-'}</td>
                        </>
                      ) : resource === 'qualifications' ? (
                        <>
                          <td className="px-3 py-2 font-medium">{row.name || '-'}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{selectedLevel || row.level || 'GRADUATE'}</Badge></td>
                        </>
                      ) : (
                        <td className="px-3 py-2 font-medium">{row.name || '-'}</td>
                      )}
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <Badge variant="outline" className="border-success/20 bg-success/5 text-success gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-destructive/20 bg-destructive/5 text-destructive gap-1 text-xs">
                            <AlertCircle className="h-3 w-3" /> {row.error || 'Missing name'}
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
              {items.length > 100 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted/20 border-t border-border">
                  Showing first 100 preview rows of {items.length} total parsed entries.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (!file && validCount === 0)}
          >
            {isSubmitting ? `Importing...` : `Bulk Import ${file ? resourceLabel : `${validCount} ${resourceLabel}`}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
