from dotenv import load_dotenv
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain_community.utilities import SQLDatabase
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import AIMessage, HumanMessage
import streamlit as st
import os
import sqlite3
import datetime
import pandas as pd

from os import path
from pathlib import Path

import gtfs_kit as gk

from db_builder import create_db

# create_db()

def init_database() -> SQLDatabase:
    db = SQLDatabase.from_uri(database_uri="sqlite:///nyc_gtfs.db")
    # print(db.get_table_info())
    return db

def get_sql_chain(db, max_retries=3):
    template = """
    You are a sophisticated AI agent designed to interact with a SQL database. 
    Your goal is to accurately retrieve information by crafting SQL queries based on user questions 
    Your task is to generate SQL queries based on the table schema provided and the conversation history.
    without any additional explanation or formatting.

    Instructions:
    1. Make sure to consider the table schema provided. Identify the relevant tables and columns 
    that will help you construct the correct SQL query.

    2. Write queries that are optimized for performance. Consider the use of joins, indexes, and filters appropriately.

    5. Review the conversation history carefully to understand the user's intent and 
    any specific requirements they may have mentioned.

    <SCHEMA>{schema}</SCHEMA>
    
    Conversation History:
    {chat_history}
    
    Example:
    User Question: what are the different routes from stop College Places to Skytop office?
    SQL Query: 
    SELECT DISTINCT T1.route_short_name 
    FROM RouteStats AS T1 JOIN StopTimes AS T2 
    ON T1.route_id = T2.trip_id JOIN Stops AS T3 ON T2.stop_id = T3.stop_id 
    WHERE T3.stop_name = 'College Places' 
    INTERSECT SELECT DISTINCT T1.route_short_name FROM RouteStats AS T1 
    JOIN StopTimes AS T2 ON T1.route_id = T2.trip_id JOIN Stops AS T3 ON T2.stop_id = T3.stop_id 
    WHERE T3.stop_name = 'Skytop Office';

    Your Turn:
    
    User Question: {question}
    SQL Query: 
    """

    prompt = ChatPromptTemplate.from_template(template=template)

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0,
    )

    def get_db_schema(_):
        return db.get_table_info()

    return (
        RunnablePassthrough.assign(schema=get_db_schema)
        | prompt
        | llm
        | StrOutputParser()
    )


def get_sql_response(user_query: str, db: SQLDatabase, chat_history: list, max_retries=3):
    sql_chain = get_sql_chain(db, max_retries=max_retries)

    template = """
    You are a sophisticated AI agent designed to interact with a SQL database.
    Your primary goal is to accurately retrieve information by crafting SQL queries based on user questions. 
    Additionally, you should provide a detailed natural human like explanation of the results retrieved from the database.
    
    Database Schema: 
    <SCHEMA>{schema}</SCHEMA>
    
    Conversation History:
    {chat_history}
    
    SQL Query: <SQL>{query}</SQL>
    User Question: {question}
    SQL Response: {response}
    """

    prompt = ChatPromptTemplate.from_template(template=template)

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0,
    )

    def run_query(query):
        if "`" in query:
            query = query.replace("`", "")
            if "sql" in query:
                query = query.replace("sql", "")
        query = query.strip()
        return db.run(query)

    chain = (
        RunnablePassthrough.assign(query=sql_chain).assign(
            schema=lambda _: db.get_table_info(),
            response=lambda variables: run_query(variables["query"]),
        )
        | prompt
        | llm
        | StrOutputParser()
    )

    retires = 0
    while retires < max_retries:
        try:
            return chain.invoke({
                "question": user_query,
                "chat_history": chat_history
            })
        except Exception as e:
            retires += 1
            if retires >= max_retries:
                raise Exception(f"Failed to generate a correct SQL query after {max_retries} attempts. Last error: {e}")
