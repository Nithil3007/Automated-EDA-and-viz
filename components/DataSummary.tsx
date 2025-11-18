import { FileText, Info } from 'lucide-react';

interface DataSummaryProps {
  analysis: {
    summary: string;
    [key: string]: any;
  };
}

export default function DataSummary({ analysis }: DataSummaryProps) {
  const { summary, ...features } = analysis;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Info className="w-6 h-6 text-indigo-600" />
          Data Summary
        </h2>
        <p className="text-gray-700 leading-relaxed">{summary}</p>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Column Information
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Column Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Data Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(features).map(([key, value]: [string, any]) => {
                if (Array.isArray(value) && value.length === 2) {
                  return (
                    <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{key}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          value[0] === 'numeric' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {value[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{value[1]}</td>
                    </tr>
                  );
                }
                return null;
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
