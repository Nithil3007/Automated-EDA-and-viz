import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
import os
load_dotenv()

#flow (feature analysis)
#- user inputs csv file
#- get random 15 rows and columns
#- pass rows and col info to lightweight LLMs, analyse the features, give data types and data summary
from collections import defaultdict

def sample_data_extraction(df,sample_size=5):  
    df_sample_dict = defaultdict(list)
    for col in df.columns:
        df_sample_dict[col] = (list(df[col].sample(n=sample_size,ignore_index=True)))
    cols, rows = list(df.columns), dict(df_sample_dict)
    prompt_input = "Rows = {rows}\nColumns = {cols}"
    return prompt_input.format(rows=rows, cols=cols)

def descriptive_analysis(df):
    numeric_analysis = df.select_dtypes(include = ['int64', 'float64']).describe().round(2).T
    numeric_analysis = numeric_analysis[['mean','std','min','25%','50%','75%','max']]
    categorical_analysis = df.select_dtypes(include = ['object']).describe().T
    categorical_analysis = categorical_analysis[['unique','top','freq']]
    prompt_input = "Numeric Analysis = {numeric_analysis}\nCategorical Analysis = {categorical_analysis}".format(numeric_analysis=numeric_analysis.to_dict(orient='dict'), categorical_analysis=categorical_analysis.to_dict(orient='dict'))
    return prompt_input

def llm_analysis(client, model, prompt, df, sample_size=10, temperature=0.15, max_tokens=15000):
    prompt_input = sample_data_extraction(df,sample_size)
    prompt_input += "\n" + descriptive_analysis(df)
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": prompt_input}
        ],
        temperature=temperature,
        max_tokens=max_tokens
    )
    return response.choices[0].message.content

#df = pd.read_csv("sample_data/Auto Sales data.csv")
#print(descriptive_analysis(df))