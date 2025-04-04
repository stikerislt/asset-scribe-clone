
import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
      
      <div className="overflow-x-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className="whitespace-nowrap">{header ? String(header) : ''}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>{cell !== null && cell !== undefined ? String(cell) : ''}</TableCell>
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
        <Button onClick={onConfirm}>
          Import {data.length} Records
        </Button>
      </div>
    </div>
  );
};
