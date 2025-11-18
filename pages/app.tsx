import React, { useState } from 'react';
import { Upload, FileText, BarChart3, Loader2 } from 'lucide-react';
import { uploadAndAnalyze, AnalysisResponse } from '../lib/api-service';
import DataSummary from '../components/DataSummary';
import VisualizationCharts from '../components/VisualizationCharts';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await uploadAndAnalyze(file);
      setAnalysisData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <BarChart3 className="w-10 h-10 text-indigo-600" />
            Data Analytics & Visualization
          </h1>
          <p className="text-gray-600">Upload your CSV file for instant AI-powered analysis</p>
        </header>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  Choose a CSV file
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-gray-700">
                  <FileText className="w-5 h-5" />
                  <span>{file.name}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full mt-6 bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Analyze Data'
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {analysisData && (
          <div className="space-y-8">
            <DataSummary analysis={analysisData.analysis} />
            <VisualizationCharts 
              univariate={analysisData.univariate}
              bivariate={analysisData.bivariate}
              univariateData={analysisData.univariate_data}
              bivariateData={analysisData.bivariate_data}
            />
          </div>
        )}
      </div>
    </div>
  );
}
