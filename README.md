# Data Analytics & Visualization with AI Insights

## 1. Project Overview

- A full-stack web application that performs intelligent data analysis and visualization on CSV files using AI-powered insights. 
- The app leverages OpenAI's LLM to automatically identify important features, determine data types, and recommend univariate and bivariate analyses. 
- Users upload CSV files and receive comprehensive visualizations including histograms, pie charts, scatter plots, box plots, and heatmaps, along with detailed statistical summaries and column-level insights.

---

## 2. Backend Features

### Technology Stack
- **FastAPI** - High-performance web framework
- **Pandas** - Data processing and analysis
- **OpenAI API** - LLM-powered feature analysis
- **Python 3.11+**

### API Endpoints

#### `POST /data_analysis`
Analyzes uploaded CSV file and returns comprehensive data insights.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: CSV file upload

**Response:**
```json
{
  "analysis": {
    "summary": "AI-generated dataset summary describing key patterns and insights",
    "COLUMN_NAME": ["data_type", "Column description"],
    ...
  },
  "univariate": ["feature1", "feature2", ...],
  "bivariate": [["feature1", "feature2"], ["feature3", "feature4"], ...],
  "univariate_data": {
    "feature_name": {
      "type": "numeric" | "categorical",
      "data": [
        {"name": "bin_label", "value": count, "range": [min, max]}
      ]
    }
  },
  "bivariate_data": {
    "pair_1": {
      "plot_type": "scatter" | "boxplot" | "heatmap",
      "x_name": "feature1",
      "y_name": "feature2",
      "data": [...],
      // Additional fields based on plot_type
    }
  }
}
```

**Data Processing Flow:**
1. **CSV Upload** - Receives and validates CSV file
2. **LLM Analysis** - Samples data (10 rows) and sends to OpenAI for intelligent feature analysis
3. **Feature Identification** - LLM identifies data types, generates summary, and recommends univariate/bivariate features
4. **Data Preparation**:
   - **Univariate Numeric**: Creates histogram bins using `pd.cut()`
   - **Univariate Categorical**: Generates value counts
   - **Bivariate Numeric-Numeric**: Prepares scatter plot data (sampled to 500 points)
   - **Bivariate Categorical-Numeric**: Calculates box plot statistics (min, Q1, median, Q3, max)
   - **Bivariate Categorical-Categorical**: Creates contingency tables using `pd.crosstab()`
5. **Response** - Returns structured JSON with all analysis results

---

## 3. Frontend Features

### Technology Stack
- **React 18** - UI framework
- **Recharts** - Data visualization library

### UI Components

**`DataSummary.tsx`**
- Displays AI-generated summary text
- Renders column information in a styled table
- Shows data types and descriptions for each column

**`VisualizationCharts.tsx`**
- Main visualization component
- Conditionally renders charts based on data type
- Implements custom box plot using Recharts BarChart
- Creates heatmap using HTML table with dynamic styling
- Responsive design with proper spacing and labels

---

## 4. Project Setup

### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher
- OpenAI API key

### Environment Configuration

Create a `.env` file in the project root:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

---

### Backend Setup

#### 1. Create Virtual Environment
```bash
python3 -m venv myenv
```

#### 2. Activate Virtual Environment
```bash
source myenv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Start Backend Server
```bash
cd src
python -m uvicorn main:app --reload
```

The backend will run on **http://localhost:8000**

---

### Frontend Setup

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Start Development Server
```bash
npm run dev
```
The frontend will run on **http://localhost:3000**
