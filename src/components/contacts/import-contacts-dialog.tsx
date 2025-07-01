import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useContactStore } from '@/lib/stores/contact';

interface ImportContactsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export function ImportContactsDialog({ isOpen, onClose }: ImportContactsDialogProps) {
  const { importContacts, isLoading } = useContactStore();
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV or Excel file');
      return;
    }
    
    setFile(selectedFile);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      // In a real implementation, you would send the file to the API
      // For now, we'll simulate the import process
      const mockResult: ImportResult = {
        total: 150,
        successful: 142,
        failed: 8,
        errors: [
          { row: 5, error: 'Invalid phone number format' },
          { row: 12, error: 'Missing required field: name' },
          { row: 23, error: 'Duplicate phone number' },
          { row: 45, error: 'Invalid email format' },
          { row: 67, error: 'Missing required field: name' },
          { row: 89, error: 'Invalid phone number format' },
          { row: 101, error: 'Duplicate phone number' },
          { row: 134, error: 'Invalid email format' },
        ]
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setImportResult(mockResult);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,phone,email,notes\nJohn Doe,+1234567890,john@example.com,Sample contact\nJane Smith,+1234567891,jane@example.com,Another sample';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetDialog = () => {
    setFile(null);
    setImportResult(null);
    setDragActive(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!importResult ? (
            <>
              {/* Template Download */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">Need a template?</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      Download our CSV template with the correct format
                    </p>
                    <Button variant="outline" size="sm" onClick={downloadTemplate}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                
                {file ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="font-medium">Drop your file here, or click to browse</p>
                      <p className="text-sm text-gray-500">
                        Supports CSV and Excel files
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                )}
              </div>

              {/* Format Requirements */}
              <div className="text-sm text-gray-600">
                <h4 className="font-medium mb-2">Required format:</h4>
                <ul className="space-y-1">
                  <li>• <strong>name</strong>: Contact name (required)</li>
                  <li>• <strong>phone</strong>: Phone number with country code (required)</li>
                  <li>• <strong>email</strong>: Email address (optional)</li>
                  <li>• <strong>notes</strong>: Additional notes (optional)</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Import Results */}
              <div className="space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">Import Complete</h3>
                </div>

                {/* Results Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{importResult.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResult.successful}</div>
                    <div className="text-sm text-green-700">Successful</div>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                </div>

                {/* Errors */}
                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Import Errors
                    </h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.slice(0, 5).map((error, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Row {error.row}:</span>
                          <Badge variant="destructive" className="text-xs">
                            {error.error}
                          </Badge>
                        </div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <div className="text-sm text-gray-500 text-center">
                          ... and {importResult.errors.length - 5} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {importResult ? 'Close' : 'Cancel'}
          </Button>
          {!importResult && (
            <Button 
              onClick={handleImport} 
              disabled={!file || isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Contacts'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 