import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface UnivariateData {
  [key: string]: {
    type: 'numeric' | 'categorical';
    data: Array<{ name: string; value: number; range?: [number, number] }>;
  };
}

export interface BivariateData {
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

export interface AnalysisResponse {
  analysis: {
    summary: string;
    [key: string]: any;
  };
  univariate: string[];
  bivariate: [string, string][];
  univariate_data: UnivariateData;
  bivariate_data: BivariateData;
}

export const uploadAndAnalyze = async (file: File): Promise<AnalysisResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post<AnalysisResponse>(
      `${API_BASE_URL}/data_analysis`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Server error occurred');
    } else if (error.request) {
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      throw new Error('Failed to upload file');
    }
  }
};
