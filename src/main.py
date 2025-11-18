from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from feature_analysis import llm_analysis
import pandas as pd
from openai import OpenAI
import os
import json
import logging

app = FastAPI()

# Configure logging (container-friendly - no file logging)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger(__name__)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def read_text_file(file_path):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    full_path = os.path.join(project_root, file_path)
    with open(full_path, 'r', encoding="utf8") as file:
        file_content = file.read()
    return file_content

def clean_resp(resp_str):
    resp_str = resp_str.strip()
    if resp_str.startswith("```json"):
        resp_str = resp_str[7:]  # Remove ```json
    if resp_str.startswith("```"):
        resp_str = resp_str[3:]  # Remove ```
    if resp_str.endswith("```"):
        resp_str = resp_str[:-3]  # Remove trailing ```
    resp_str = resp_str.strip()
    return resp_str

def return_quantities_univariate(df, univariate_variables):
    """
    Returns value counts for each univariate variable.
    For categorical: returns category counts
    For numeric: returns histogram bins
    """
    univariate_data = {}
    
    for col in univariate_variables:
        if col not in df.columns:
            continue
            
        # Check if column is numeric or categorical
        if df[col].dtype in ['int64', 'float64']:
            # For numeric columns, create histogram bins
            # Remove NaN values
            clean_data = df[col].dropna()
            
            # Create bins (10-15 bins depending on data range)
            num_bins = min(15, max(10, int(len(clean_data) / 20)))
            counts, bin_edges = pd.cut(clean_data, bins=num_bins, retbins=True, include_lowest=True)
            
            # Get frequency for each bin
            bin_counts = counts.value_counts().sort_index()
            
            # Format bin labels and create histogram data
            histogram_data = []
            for interval, count in bin_counts.items():
                # Format bin label (e.g., "100-200")
                bin_label = f"{interval.left:.1f}-{interval.right:.1f}"
                histogram_data.append({
                    "name": bin_label,
                    "value": int(count),
                    "range": [float(interval.left), float(interval.right)]
                })
            
            univariate_data[col] = {
                "type": "numeric",
                "data": histogram_data
            }
        else:
            # For categorical columns, get value counts
            value_counts = df[col].value_counts().head(10)
            univariate_data[col] = {
                "type": "categorical",
                "data": [{"name": str(k), "value": int(v)} for k, v in value_counts.items()]
            }
    
    return univariate_data

def return_quantities_bivariate(df, bivariate_variables):
    """
    Returns visualization data for each bivariate pair.
    - Numeric vs Numeric: scatter plot data
    - Categorical vs Numeric: box plot data
    Samples data if too large (max 500 points per plot).
    """
    bivariate_data = {}
    
    for idx, (x_col, y_col) in enumerate(bivariate_variables, 1):
        if x_col not in df.columns or y_col not in df.columns:
            continue
        
        # Determine data types
        x_is_numeric = pd.api.types.is_numeric_dtype(df[x_col])
        y_is_numeric = pd.api.types.is_numeric_dtype(df[y_col])
        
        # Get data and remove rows with NaN in either column
        plot_df = df[[x_col, y_col]].dropna()
        
        pair_key = f"pair_{idx}"
        
        # Both numeric: scatter plot
        if x_is_numeric and y_is_numeric:
            # Sample if too many points (for performance)
            if len(plot_df) > 500:
                plot_df = plot_df.sample(n=500, random_state=42)
            
            scatter_data = [
                {"x": float(row[x_col]), "y": float(row[y_col])}
                for _, row in plot_df.iterrows()
            ]
            
            bivariate_data[pair_key] = {
                "plot_type": "scatter",
                "x_name": x_col,
                "y_name": y_col,
                "data": scatter_data
            }
        
        # One categorical, one numeric: box plot
        elif (not x_is_numeric and y_is_numeric) or (x_is_numeric and not y_is_numeric):
            # Determine which is categorical and which is numeric
            if not x_is_numeric and y_is_numeric:
                cat_col, num_col = x_col, y_col
            else:
                cat_col, num_col = y_col, x_col
            
            # Get top categories (max 10)
            top_categories = plot_df[cat_col].value_counts().head(10).index.tolist()
            filtered_df = plot_df[plot_df[cat_col].isin(top_categories)]
            
            # Create box plot data: group numeric values by category
            box_data = []
            for category in top_categories:
                cat_values = filtered_df[filtered_df[cat_col] == category][num_col].tolist()
                if cat_values:
                    box_data.append({
                        "category": str(category),
                        "values": [float(v) for v in cat_values]
                    })
            
            bivariate_data[pair_key] = {
                "plot_type": "boxplot",
                "x_name": x_col,
                "y_name": y_col,
                "cat_col": cat_col,
                "num_col": num_col,
                "data": box_data
            }
        
        # Both categorical: contingency table (heatmap)
        else:
            # Get top categories for both columns (max 10 each)
            top_x_categories = plot_df[x_col].value_counts().head(10).index.tolist()
            top_y_categories = plot_df[y_col].value_counts().head(10).index.tolist()
            
            # Filter to top categories
            filtered_df = plot_df[
                (plot_df[x_col].isin(top_x_categories)) & 
                (plot_df[y_col].isin(top_y_categories))
            ]
            
            # Create contingency table (crosstab)
            contingency_table = pd.crosstab(
                filtered_df[y_col], 
                filtered_df[x_col]
            )
            
            # Convert to heatmap format: list of {x, y, value}
            heatmap_data = []
            for y_cat in contingency_table.index:
                for x_cat in contingency_table.columns:
                    heatmap_data.append({
                        "x": str(x_cat),
                        "y": str(y_cat),
                        "value": int(contingency_table.loc[y_cat, x_cat])
                    })
            
            bivariate_data[pair_key] = {
                "plot_type": "heatmap",
                "x_name": x_col,
                "y_name": y_col,
                "x_categories": [str(c) for c in contingency_table.columns.tolist()],
                "y_categories": [str(c) for c in contingency_table.index.tolist()],
                "data": heatmap_data
            }
    
    return bivariate_data

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
model = "gpt-4o-mini"
prompt = read_text_file("prompts/feature_analysis_prompt.txt")

@app.get("/")
def health_check():
    return {"status": "ok"}
    
@app.post("/data_analysis")
async def data_analysis(file: UploadFile = File(...)):
    df = pd.read_csv(file.file)
    resp_str = llm_analysis(client, model, prompt, df)
    resp_str = clean_resp(resp_str)
    logger.info(f"Cleaned LLM response: {resp_str[:200]}...")
    
    try:
        resp = json.loads(resp_str)
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {e}")
        logger.error(f"Response string: {resp_str}")
        raise
    
    univariate_variables = resp.get("univariate", [])
    logger.info(f"Univariate variables: {univariate_variables}")
    bivariate_variables = resp.get("bivariate", [])
    logger.info(f"Bivariate variables: {bivariate_variables}")

    #dictionary to store data for the variables in the univariate_variables list  
    univariate_data = return_quantities_univariate(df, univariate_variables)
    bivariate_data = return_quantities_bivariate(df, bivariate_variables)
    
    return {
        "analysis": resp,
        "univariate": univariate_variables,
        "bivariate": bivariate_variables,
        "univariate_data": univariate_data,
        "bivariate_data": bivariate_data
        # Use this data to display distribution charts (bar charts and pie charts)
    }

def __main__():
    uvicorn.run(app, host="0.0.0.0", port=8000)
