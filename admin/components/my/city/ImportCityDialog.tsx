"use client";

import { useState, useRef } from "react";
import { useToast } from "@/lib/toast";
import { importCitiesApi, CityImportResult, SkippedCityRow } from "@/lib/api";
import { X, Upload, FileText, CheckCircle2, AlertTriangle, Download } from "lucide-react";

type ImportCityDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const escapeCsvCell = (val: any): string => {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function ImportCityDialog({
  open,
  onClose,
  onSuccess,
}: ImportCityDialogProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedRowsCount, setDetectedRowsCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CityImportResult | null>(null);

  if (!open) return null;

  const handleReset = () => {
    setSelectedFile(null);
    setDetectedRowsCount(null);
    setError(null);
    setUploading(false);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (uploading) return;
    handleReset();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    const isCsvExt = file.name.toLowerCase().endsWith(".csv");
    if (!isCsvExt) {
      setError("Please upload a CSV file (.csv)");
      setSelectedFile(null);
      setDetectedRowsCount(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File size exceeds 10 MB limit.");
      setSelectedFile(null);
      setDetectedRowsCount(null);
      return;
    }

    setSelectedFile(file);

    try {
      const text = await file.text();
      const lines = text
        .split(/\r\n|\r|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const rows = lines.length > 1 ? lines.length - 1 : 0;
      setDetectedRowsCount(rows);
    } catch {
      setDetectedRowsCount(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Please select a CSV file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const res = await importCitiesApi(selectedFile);

      if (res.success && res.data) {
        setResult(res.data);
        toast("City import completed.");
        onSuccess();
      } else {
        setError(res.message || "Failed to import cities. Please try again.");
      }
    } catch (err: any) {
      console.error("CSV import error:", err);
      setError("Failed to import cities. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadSkippedCsv = (skippedRows: SkippedCityRow[]) => {
    const headers = [
      "rowNumber",
      "name",
      "state",
      "country",
      "isPopular",
      "isActive",
      "slug",
      "reason",
    ];
    const lines = [headers.join(",")];

    for (const row of skippedRows) {
      const line = [
        row.rowNumber,
        escapeCsvCell(row.name ?? ""),
        escapeCsvCell(row.state ?? ""),
        escapeCsvCell(row.country ?? "India"),
        escapeCsvCell(row.isPopular ?? ""),
        escapeCsvCell(row.isActive ?? ""),
        escapeCsvCell(row.slug ?? ""),
        escapeCsvCell(row.reason),
      ].join(",");
      lines.push(line);
    }

    const csvString = lines.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "cities-import-skipped.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !uploading) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-[520px] bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-5 text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Import Cities</h3>
            <p className="text-xs text-slate-500">
              Upload a CSV file containing multiple city entries.
            </p>
          </div>

          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={handleClose}
            disabled={uploading}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* State 1: Before Import Result */}
        {!result ? (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="city-csv-input"
            />

            <label
              htmlFor="city-csv-input"
              className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                selectedFile
                  ? "border-emerald-500/50 bg-emerald-50/30"
                  : "border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-100/50"
              }`}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3 text-emerald-700">
                  <FileText className="w-8 h-8 text-emerald-600" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[280px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      {detectedRowsCount !== null
                        ? `${detectedRowsCount} rows detected`
                        : `${(selectedFile.size / 1024).toFixed(1)} KB`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Upload className="w-8 h-8 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">
                    Click to select CSV File
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Accepted format: .csv (Max 10 MB)
                  </span>
                </div>
              )}
            </label>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-700 text-xs">
                <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-50"
                onClick={handleClose}
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="px-5 py-2 text-xs font-semibold rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                onClick={handleImport}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Importing Cities…
                  </>
                ) : (
                  "Import Cities"
                )}
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Result Summary View */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
              <CheckCircle2 size={18} />
              <span>Import Completed</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-medium">Total Rows</div>
                <div className="text-lg font-bold text-slate-800">{result.totalRows}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-xs text-emerald-700 font-medium">Imported</div>
                <div className="text-lg font-bold text-emerald-700">{result.imported}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-xs text-amber-700 font-medium">Skipped</div>
                <div className="text-lg font-bold text-amber-700">{result.skipped}</div>
              </div>
            </div>

            {/* List Preview of Skipped Rows if any */}
            {result.skipped > 0 && result.skippedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span>Skipped Entries Breakdown</span>
                  <span className="text-[11px] text-slate-400">
                    {result.skippedRows.length} entries
                  </span>
                </div>

                <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1.5 bg-slate-50/50">
                  {result.skippedRows.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white border border-slate-100 text-xs flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600 font-bold">
                          Row {item.rowNumber}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {item.name || item.slug || "(Unnamed)"}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {item.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {result.skipped > 0 && (
                <button
                  type="button"
                  className="px-4 py-2 text-xs font-semibold rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5"
                  onClick={() => handleDownloadSkippedCsv(result.skippedRows)}
                >
                  <Download size={13} />
                  Download Skipped Entries
                </button>
              )}

              <button
                type="button"
                className="px-5 py-2 text-xs font-semibold rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
