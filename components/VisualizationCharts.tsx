import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

interface UnivariateData {
  [key: string]: {
    type: 'numeric' | 'categorical';
    data: Array<{ name: string; value: number; range?: [number, number] }>;
  };
}

interface BivariateData {
  [key: string]: {
    plot_type: 'scatter' | 'boxplot' | 'heatmap';
    x_name: string;
    y_name: string;
    cat_col?: string;
    num_col?: string;
    x_categories?: string[];
    y_categories?: string[];
    data: Array<any>;
  };
}

// Helper function to calculate box plot statistics
const calculateBoxPlotStats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q2Index = Math.floor(sorted.length * 0.5);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const median = sorted[q2Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const min = Math.max(sorted[0], q1 - 1.5 * iqr);
  const max = Math.min(sorted[sorted.length - 1], q3 + 1.5 * iqr);
  
  return { min, q1, median, q3, max };
};

// Helper function to get color for heatmap based on value
const getHeatmapColor = (value: number, maxValue: number) => {
  const intensity = value / maxValue;
  // Blue gradient from light to dark
  const r = Math.floor(121 + (255 - 121) * (1 - intensity));
  const g = Math.floor(165 + (255 - 165) * (1 - intensity));
  const b = Math.floor(219 + (255 - 219) * (1 - intensity));
  return `rgb(${r}, ${g}, ${b})`;
};

interface VisualizationChartsProps {
  univariate: string[];
  bivariate: [string, string][];
  univariateData: UnivariateData;
  bivariateData: BivariateData;
}

const COLORS = ['#79a5db', '#e0a580', '#6fab90', '#896ca8', '#ADD8E6', '#FFB6C1', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

export default function VisualizationCharts({ univariate, bivariate, univariateData, bivariateData }: VisualizationChartsProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Univariate Analysis */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Univariate Analysis
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {univariate.map((feature) => {
            const featureData = univariateData[feature];
            if (!featureData) return null;

            // Render different charts based on data type
            if (featureData.type === 'numeric') {
              // For numeric data: show histogram only
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                Numeric Analysis
              </h2>
              return (
                <div key={feature} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-4 text-center">{feature}</h3>
                  
                  <ResponsiveContainer width="100%" height={550}>
                    <BarChart data={featureData.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        tick={{ fontSize: 11 }}
                        label={{ value: 'Value Range', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                <p className="font-semibold">{payload[0].payload.name}</p>
                                <p className="text-indigo-600">Count: {payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="value" fill="#79a5db" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            } else {
              // For categorical data: show pie chart only
              return (
                <div key={feature} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-4 text-center">{feature}</h3>
                  
                  <ResponsiveContainer width="100%" height={550}>
                    <PieChart>
                      <Pie
                        data={featureData.data}
                        cx="50%"
                        cy="50%"
                        innerRadius={120}
                        outerRadius={210}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {featureData.data.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Bivariate Analysis */}
      {bivariate.length > 0 && Object.keys(bivariateData).length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <PieChartIcon className="w-6 h-6 text-indigo-600" />
            Bivariate Analysis
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {Object.entries(bivariateData).map(([key, pairData]) => {
              // Render scatter plot for numeric vs numeric
              if (pairData.plot_type === 'scatter') {
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-4 text-center">
                      {pairData.x_name} vs {pairData.y_name}
                    </h3>
                    
                    <ResponsiveContainer width="100%" height={550}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey="x" 
                          name={pairData.x_name}
                          label={{ value: pairData.x_name, position: 'insideBottom', offset: -10 }}
                        />
                        <YAxis 
                          type="number" 
                          dataKey="y" 
                          name={pairData.y_name}
                          label={{ value: pairData.y_name, angle: -90, position: 'insideLeft' }}
                        />
                        <ZAxis range={[60, 60]} />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                  <p className="font-semibold text-gray-700">{pairData.x_name}: {payload[0].value}</p>
                                  <p className="font-semibold text-gray-700">{pairData.y_name}: {payload[1].value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter 
                          name={`${pairData.x_name} vs ${pairData.y_name}`} 
                          data={pairData.data} 
                          fill="#79a5db"
                          fillOpacity={0.6}
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                );
              }
              
              // Render box plot for categorical vs numeric
              if (pairData.plot_type === 'boxplot') {
                // Transform data for box plot visualization
                const boxPlotData = pairData.data.map((item: any) => {
                  const stats = calculateBoxPlotStats(item.values);
                  return {
                    category: item.category,
                    ...stats
                  };
                });

                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-4 text-center">
                      {pairData.x_name} vs {pairData.y_name}
                    </h3>
                    
                    <ResponsiveContainer width="100%" height={550}>
                      <BarChart data={boxPlotData} margin={{ top: 20, right: 20, bottom: 80, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="category"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          label={{ value: pairData.cat_col, position: 'insideBottom', offset: -20 }}
                        />
                        <YAxis label={{ value: pairData.num_col, angle: -90, position: 'insideLeft' }} />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                                  <p className="font-semibold text-gray-700 mb-2">{data.category}</p>
                                  <p className="text-sm">Max: {data.max?.toFixed(2)}</p>
                                  <p className="text-sm">Q3: {data.q3?.toFixed(2)}</p>
                                  <p className="text-sm font-semibold">Median: {data.median?.toFixed(2)}</p>
                                  <p className="text-sm">Q1: {data.q1?.toFixed(2)}</p>
                                  <p className="text-sm">Min: {data.min?.toFixed(2)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        {/* Box plot using error bars */}
                        <Bar dataKey="median" fill="#79a5db" />
                        <Bar dataKey="q1" stackId="box" fill="transparent" />
                        <Bar dataKey="q3" stackId="box" fill="#79a5db" fillOpacity={0.3} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                );
              }

              // Render heatmap for categorical vs categorical
              if (pairData.plot_type === 'heatmap') {
                const maxValue = Math.max(...pairData.data.map((d: any) => d.value));
                
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-4 text-center">
                      {pairData.x_name} vs {pairData.y_name}
                    </h3>
                    
                    <div className="overflow-x-auto">
                      <table className="mx-auto border-collapse">
                        <thead>
                          <tr>
                            <th className="border border-gray-300 p-2 bg-gray-100 font-semibold text-sm"></th>
                            {pairData.x_categories?.map((xCat) => (
                              <th key={xCat} className="border border-gray-300 p-2 bg-gray-100 font-semibold text-sm min-w-[80px]">
                                {xCat}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {pairData.y_categories?.map((yCat) => (
                            <tr key={yCat}>
                              <td className="border border-gray-300 p-2 bg-gray-100 font-semibold text-sm">
                                {yCat}
                              </td>
                              {pairData.x_categories?.map((xCat) => {
                                const cell = pairData.data.find((d: any) => d.x === xCat && d.y === yCat);
                                const value = cell?.value || 0;
                                const bgColor = getHeatmapColor(value, maxValue);
                                
                                return (
                                  <td
                                    key={`${xCat}-${yCat}`}
                                    className="border border-gray-300 p-3 text-center font-semibold text-sm"
                                    style={{ backgroundColor: bgColor }}
                                    title={`${xCat} & ${yCat}: ${value}`}
                                  >
                                    {value}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
                        <span>Low</span>
                        <div className="flex gap-1">
                          {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                            <div
                              key={intensity}
                              className="w-8 h-4 border border-gray-300"
                              style={{ backgroundColor: getHeatmapColor(intensity * maxValue, maxValue) }}
                            />
                          ))}
                        </div>
                        <span>High</span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Default: return placeholder for other types
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-4 text-center">
                    {pairData.x_name} vs {pairData.y_name}
                  </h3>
                  <p className="text-sm text-gray-500 text-center">Visualization not available for this data type combination</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
