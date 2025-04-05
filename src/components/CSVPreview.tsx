
import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, CheckCircle, AlertCircle, FileSpreadsheet, FileText, Info } from "lucide-react";
import { validateAssetCSV } from "@/lib/csv/csv-validation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AssetStatusBadge } from "@/components/AssetStatusBadge";
import { StatusColorIndicator } from "@/components/StatusColorIndicator";
import { VALID_ASSET_STATUSES, AssetStatus } from "@/lib/api/assets";
import { StatusColor } from "@/lib/data";

interface CSVPreviewProps {
  headers: string[];
  data: string[][];
  onConfirm: () => void;
  onCancel: () => void;
  fileType?: 'csv' | 'excel';
  loading?: boolean;
}

export const CSVPreview = ({ 
  headers, 
  data, 
  onConfirm, 
  onCancel,
  fileType = 'csv',
  loading = false
}: CSVPreviewProps) => {
  const [validationResult, setValidationResult] = useState(() => validateAssetCSV(headers, data));
  const [validationVisible, setValidationVisible] = useState(true);
  
  const safeHeaders = headers.map(header => 
    header !== null && header !== undefined ? String(header) : '');
  
  const safeData = data.map(row => 
    row.map(cell => cell !== null && cell !== undefined ? String(cell) : ''));

  const statusColumnIndex = safeHeaders
    .findIndex(header => header.toLowerCase() === 'status');
    
  const statusColorIndex = safeHeaders
    .findIndex(header => header.toLowerCase() === 'status_color');

  const hasStatusCaseWarnings = statusColumnIndex !== -1 && 
    safeData.some(row => {
      const statusValue = row[statusColumnIndex];
      return statusValue && 
        statusValue.toLowerCase() !== statusValue && 
        VALID_ASSET_STATUSES.includes(statusValue.toLowerCase() as AssetStatus);
    });
    
  const hasStatusColorCaseWarnings = statusColorIndex !== -1 &&
    safeData.some(row => {
      const colorValue = row[statusColorIndex];
      if (!colorValue) return false;
      
      const normalizedColor = colorValue.toLowerCase();
      return colorValue !== normalizedColor && ['green', 'yellow', 'red'].includes(normalizedColor);
    });
  
  const FileIcon = fileType === 'excel' ? FileSpreadsheet : FileText;
  const fileTypeColor = fileType === 'excel' ? 'text-blue-600' : 'text-green-600';
  
  return (
    <div className="rounded-lg border bg-white shadow-lg p-6 max-w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileIcon className={`h-5 w-5 ${fileTypeColor}`} />
          <h3 className="text-lg font-medium">
            Preview Import Data 
            {fileType === 'excel' && <span className="text-sm text-blue-600 ml-2">(Excel)</span>}
            {fileType === 'csv' && <span className="text-sm text-green-600 ml-2">(CSV)</span>}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {validationVisible && (
        <div className="mb-4">
          {!validationResult.valid ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertTitle>Validation Issues Detected</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 mt-2">
                  {validationResult.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <AlertTitle className="text-green-700">Data Validated Successfully</AlertTitle>
              <AlertDescription className="text-green-600">
                Found {data.length} valid records ready to import
              </AlertDescription>
            </Alert>
          )}
          
          {(hasStatusCaseWarnings || hasStatusColorCaseWarnings) && (
            <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 mr-2 text-amber-500" />
              <AlertTitle className="text-amber-700">Case Sensitivity Warning</AlertTitle>
              <AlertDescription className="text-amber-600">
                {hasStatusCaseWarnings && (
                  <p>Some status values have incorrect capitalization and will be converted to lowercase during import 
                  (e.g., "Ready" will become "ready").</p>
                )}
                {hasStatusColorCaseWarnings && (
                  <p>Some status color values have incorrect capitalization and will be normalized during import 
                  (e.g., "Green" will become "green").</p>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {data.length === 0 && (
            <Alert variant="default" className="mb-4 bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
              <AlertTitle className="text-amber-700">No Data Found</AlertTitle>
              <AlertDescription className="text-amber-600">
                The file appears to be empty or has no valid data rows.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {safeHeaders.map((header, index) => (
                <TableHead 
                  key={index} 
                  className={`whitespace-nowrap ${
                    header.toLowerCase() === 'status' || header.toLowerCase() === 'status_color' ? 'bg-amber-50' : ''
                  }`}
                >
                  {header}
                  {header.toLowerCase() === 'status' && (
                    <span className="ml-1 text-xs text-amber-600">
                      (will be normalized)
                    </span>
                  )}
                  {header.toLowerCase() === 'status_color' && (
                    <span className="ml-1 text-xs text-amber-600">
                      (will be normalized)
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeData.slice(0, 10).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell 
                    key={cellIndex}
                    className={cellIndex === statusColumnIndex || cellIndex === statusColorIndex ? 'bg-amber-50' : ''}
                  >
                    {cellIndex === statusColumnIndex && cell ? (
                      <div className="flex items-center gap-1.5">
                        <span>{cell}</span>
                        {cell.toLowerCase() !== cell && (
                          <span className="text-xs text-amber-600">
                            → {cell.toLowerCase()}
                          </span>
                        )}
                      </div>
                    ) : cellIndex === statusColorIndex && cell ? (
                      <div className="flex items-center gap-1.5">
                        <span>{cell}</span>
                        {cell.toLowerCase() !== cell && (
                          <span className="text-xs text-amber-600">
                            → {cell.toLowerCase()}
                          </span>
                        )}
                      </div>
                    ) : (
                      cell
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {data.length > 10 && (
        <p className="text-sm text-muted-foreground mt-2">
          Showing 10 of {data.length} rows
        </p>
      )}
      
      <div className="flex justify-end mt-4 gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={!validationResult.valid || data.length === 0 || loading}
          className={loading ? "cursor-not-allowed" : ""}
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
              Importing...
            </>
          ) : (
            `Import ${data.length} Records`
          )}
        </Button>
      </div>
    </div>
  );
};
