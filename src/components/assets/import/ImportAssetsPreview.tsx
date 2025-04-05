
import { CSVPreview } from "@/components/CSVPreview";
import { useImportAssets } from "./useImportAssets";

interface ImportAssetsPreviewProps {
  headers: string[];
  data: string[][];
  fileType: 'csv' | 'excel';
  onCancel: () => void;
}

export const ImportAssetsPreview = ({ 
  headers, 
  data, 
  fileType,
  onCancel 
}: ImportAssetsPreviewProps) => {
  const { importAssets, isImporting } = useImportAssets();
  
  const handleImportConfirm = () => {
    const objectData = data.map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
      });
      return obj;
    });
    
    importAssets(objectData);
  };

  return (
    <CSVPreview
      headers={headers}
      data={data}
      onConfirm={handleImportConfirm}
      onCancel={onCancel}
      fileType={fileType}
      loading={isImporting}
    />
  );
};
