
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
import { X, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { validateAssetCSV } from "@/lib/csv-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CSVPreviewProps {
  headers: string[];
  data: string[][];
  onConfirm: () => void;
  onCancel: () => void;
  fileType?: 'csv' | 'excel';
}

export const CSVPreview = ({ 
  headers, 
  data, 
  onConfirm, 
  onCancel,
  fileType = 'csv'
}: CSVPreviewProps) => {
  const [validationResult, setValidationResult] = useState(() => validateAssetCSV(headers, data));
  const [validationVisible, setValidationVisible] = useState(true);
  
  // Ensure all headers are strings
  const safeHeaders = headers.map(header => 
    header !== null && header !== undefined ? String(header) : '');
  
  // Ensure all data cells are strings
  const safeData = data.map(row => 
    row.map(cell => cell !== null && cell !== undefined ? String(cell) : ''));
  
  return (
    <div className="rounded-lg border bg-white shadow-lg p-6 max-w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          Preview Import Data 
          {fileType === 'excel' && <span className="text-sm text-blue-600 ml-2">(Excel)</span>}
          {fileType === 'csv' && <span className="text-sm text-green-600 ml-2">(CSV)</span>}
        </h3>
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
                <TableHead key={index} className="whitespace-nowrap">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {safeData.slice(0, 10).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell}</TableCell>
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
          disabled={!validationResult.valid || data.length === 0}
        >
          Import {data.length} Records
        </Button>
      </div>
    </div>
  );
};
