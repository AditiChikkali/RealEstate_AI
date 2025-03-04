import re
import json
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    JWTManager,
    get_jwt_identity,
)
from pymongo import MongoClient
import boto3

from openai import OpenAI
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

import datetime

import time

from boto3.dynamodb.conditions import Key
import hashlib
import pandas as pd
from io import BytesIO
import zipfile

load_dotenv()
# Initialize Flask app
# logging.basicConfig(level=logging.DEBUG)
app = Flask(__name__)

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

CORS(app)
# logging.info("Request reached the server! 1")
# OpenAI client setup
API_KEY = os.getenv("API_KEY")
ORGANIZATION = os.getenv("ORGANIZATION")
PROJECT_ID = os.getenv("PROJECT_ID")
logger.debug("Loading OpenAI client configuration")
client = OpenAI(
    api_key=API_KEY,
    organization=ORGANIZATION,
    project=PROJECT_ID,
)
file_summary = ""
logger.debug("jwt k upr ---------------------------------")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)
logger.debug("jwt k niche ---------------------------------")
# dynamodb connection
logger.debug("Connecting to DynamoDB")
dynamodb = boto3.resource(
    "dynamodb",
    region_name="us-east-1",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
)
users_table = dynamodb.Table("Users")
chats_table = dynamodb.Table("Chats")
file_summaries_table = dynamodb.Table("Files")

logger.debug("Setting up S3 client")
s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("AWS_SECRET_KEY"),
)
bucket_name = "rentwiseai-storage"


# Generate JWT token
def generate_token(email):
    logger.debug(f"Generating token for email: {email}")
    token = create_access_token(
        identity=email, expires_delta=datetime.timedelta(hours=24)
    )
    return token


# Define Local Storage Path (Ensure this exists)
UPLOAD_FOLDER = "filestorage"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# Sign-up route
@app.route("/auth/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        logger.info(f"Received sign-up request for email: {data.get('email')}")
        username = data.get("name")
        email = data.get("email")
        password = data.get("password")
        # Check if the user already exists
        response = users_table.get_item(Key={"email": email})
        if "Item" in response:
            logger.warning(f"User with email {email} already exists")
            return jsonify({"message": "User already exists"}), 400

        # Hash the password
        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")

        # Store the user in DynamoDB
        users_table.put_item(
            Item={"user_id": username, "email": email, "password": hashed_password}
        )
        token = generate_token(email)
        logger.info(f"User {email} registered successfully")
        return jsonify({"message": "User registered successfully", "token": token}), 201
    except Exception as e:
        logger.error(f"Error during sign-up: {e}")
        return jsonify({"error": str(e)}), 500


# Sign in route
@app.route("/auth/signin", methods=["POST"])
def signin():
    try:
        data = request.json
        logger.info(f"Received sign-in request for email: {data.get('email')}")
        email = data.get("email")
        password = data.get("password")

        # Retrieve the user from DynamoDB
        response = users_table.get_item(Key={"email": email})
        user = response.get("Item")
        logger.info("this is uder info", user)
        if not user:
            logger.warning(f"User with email {email} not found")
            return jsonify({"message": "User not found"}), 404

        if not check_password_hash(user["password"], password):
            logger.warning(f"Invalid credentials for email: {email}")
            return jsonify({"message": "Invalid credentials"}), 403

        # Generate JWT token
        token = generate_token(user["email"])
        return (
            jsonify({"token": token, "userName": user.get("user_id", email)}),
            200,
        )  # Include userName in response
    except Exception as e:
        logger.error(f"Error during sign-in: {e}")
        return jsonify({"error": str(e)}), 500


# Function to create chat prompts
def create_prompt(system_instructions, user_message):
    return [
        {"role": "system", "content": system_instructions},
        {"role": "user", "content": user_message},
    ]


def summarize_file(file_path):
    """Summarizes the Excel file contents"""
    try:
        logger.info(f"Reading file from path: {file_path}")
        sheets = pd.read_excel(file_path, sheet_name=None, engine="openpyxl")

        summary = ""
        for sheet_name, sheet_data in sheets.items():
            summary += f"\nSheet: {sheet_name}\n"
            summary += sheet_data.to_string()

        return summary
    except Exception as e:
        logger.error(f"Error reading file: {str(e)}")
        return str(e)


@app.route("/api/upload", methods=["POST"])
@jwt_required()
def upload_file():
    """Uploads file to S3 and stores reference in DynamoDB"""
    logger.info("Received file upload request from user")

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    file_extension = os.path.splitext(file.filename)[1]
    allowed_extensions = [".xlsx", ".xls"]
    if file_extension not in allowed_extensions:
        return (
            jsonify({"error": "Invalid file type. Only .xlsx and .xls allowed."}),
            400,
        )

    current_user = get_jwt_identity()
    filename_hashed = (
        hashlib.md5(current_user.encode("utf-8")).hexdigest() + file_extension
    )
    s3_file_path = f"filestorage/{filename_hashed}"

    try:
        s3_client.upload_fileobj(file, bucket_name, s3_file_path)
        file_summaries_table.put_item(
            Item={
                "email": current_user,
                "summary": s3_file_path,
                "timestamp": int(time.time()),
            }
        )

        logger.info(f"File uploaded successfully to S3: {bucket_name}/{s3_file_path}")
        return (
            jsonify(
                {"message": "File uploaded successfully", "file_path": s3_file_path}
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        return jsonify({"error": f"Failed to upload file: {str(e)}"}), 500


# Flask route for chatting with GPT


def download_file_to_local(s3_file_path, local_path):
    """Downloads file from S3 to local storage"""
    try:
        logger.info(f"Downloading file from S3: {s3_file_path} to {local_path}")

        # Ensure the directory exists
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        # Download from S3
        with open(local_path, "wb") as file:
            s3_client.download_fileobj(bucket_name, s3_file_path, file)

        logger.info(f"File downloaded successfully: {local_path}")
        return local_path
    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        return None


@app.route("/api/chat", methods=["POST"])
@jwt_required()
def chat_with_gpt():
    """Handles chat requests, retrieves file if needed"""
    try:
        data = request.json
        user_message = data.get("message", "")
        current_user = get_jwt_identity()

        chat_item = {
            "email": current_user,
            "timestamp": int(time.time()),
            "role": "user",
            "message": user_message,
        }
        file_response = file_summaries_table.get_item(Key={"email": current_user})

        if "Item" in file_response:
            file_name = file_response["Item"]["summary"]
            local_file_path = os.path.join(UPLOAD_FOLDER, os.path.basename(file_name))

            if not os.path.exists(local_file_path):
                logger.info(f"File not found locally. Downloading from S3: {file_name}")
                download_file_to_local(file_name, local_file_path)

            if os.path.exists(local_file_path):
                logger.info(f"Processing file for summary: {local_file_path}")
                file_summary = summarize_file(local_file_path)

                logger.debug(f"File summary generated: {file_summary}")
            else:
                logger.error(f"File still not found after download: {local_file_path}")
                file_summary = "Error: File could not be retrieved."

        else:
            file_summary = "No uploaded file found."

        chats_table.put_item(Item=chat_item)
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # System instructions
        system_instructions = """You are a real estate advisor.

                Your primary task is to analyze property data and provide investment advice to users based on the following key metrics:

                Loan-to-Value (LTV)
                Projected Cash Flow
                Rehab Costs
                Loan Type
                To ensure a thorough and accurate analysis, please ask users to upload their spreadsheet portfolio. Having a complete view of their property data allows you to provide more precise and personalized investment advice. Without the spreadsheet, analysis may be limited, and assumptions will need to be made.

                For each question asked:

                Request users to upload a spreadsheet of their real estate portfolio for a comprehensive assessment.
                If the spreadsheet is not available, consider the provided data and prompt users for any missing key information (such as LTV, projected cash flow, rehab costs, or loan type).
                If essential data is still missing, make reasonable assumptions based on typical real estate investment practices, and clearly inform the user about these assumptions (e.g., assuming an average LTV of 70% or average rehab costs). Let the user know that assumptions can limit the accuracy of the advice.
                Structure your response as follows:

                Summarize the property details provided, including any assumptions made.
                Conclusion: Determine whether the property is a good investment or not, based on the data and assumptions.
                Explanation: Offer a brief explanation of the recommendation, highlighting potential risk factors or advantages (e.g., high LTV, low cash flow, or favorable loan type).
                If applicable, recommend further action or advice (e.g., suggestions for reducing risk or ways to improve investment potential).
                To get the most accurate and detailed advice, uploading your spreadsheet is highly recommended. This allows for better understanding and eliminates the need for assumptions, ultimately improving the quality of the investment guidance provided."""
        if file_summary != "":
            system_instructions = f"""
                You are a real estate investment advisor. The user has uploaded a portfolio of properties in an Excel (.xlsx) file. This file contains key financial and property data, such as:

                1. **Property Information**:
                - Property addresses (current and past).
                - City, state, and neighborhood for each property.
                
                2. **Financial Details**:
                - Purchase prices, sale prices, and market values.
                - Total investment costs including purchase, holding, rehab, and sale-related costs.
                - Projected cash flows, debt levels, and income streams.

                3. **Mortgage and Debt Details**:
                - Mortgage balances, Loan-to-Value (LTV) ratios.
                - Loan types and financing information.
                - Rehab costs and associated expenditures.

                ### Key Rules for Response Generation

                #### 1. **Data-Driven and Factually Accurate Responses**:
                - Always base your answers on the **specific data provided** in the user's uploaded portfolio file.
                - Do **not invent or guess financial figures**. Only use the provided numbers unless explicitly requested by the user to make estimates.
                - When it comes to properties included in the uploaded portfolio, provide specific advice that is **tailored to the actual data**.
                
                #### 2. **Profit and Loss Clarity**:
                - **Profit vs. Loss**: If a property is showing a **loss**, be explicit about this. Do not mention "profit" if the numbers show a loss.
                - If calculating profit/loss:
                    - The formula to use is: **Net Profit or Loss = Property Sale Price - (Total Investment Cost + Sale Costs)**.
                    - If there is a column named "**Net Profit or Loss**", use that value directly instead of recalculating.
                - **Communicate Clearly**: If a property is showing negative profitability, use terms like **“incurring a loss”** or **“loss of $X”** to be direct.

                #### 3. **Handling Data from the Portfolio**:
                - For any response involving **financial values**, always check if the specific data already exists in the uploaded file.
                - For each property, include the context: **purchase price**, **sale price**, **rehab costs**, **debt**, etc.
                - **Cross-Validation**: If multiple related properties exist, use that information to provide richer insights (e.g., comparing similar properties in different cities).

                #### 4. **Portfolio Comparison and Analysis**:
                - If the user asks about a property that already exists in their portfolio, compare it to the uploaded data.
                - **Highlight Risks or Opportunities**: Identify any **similarities or deviations** between the property in question and the user’s current investments.
                - If the user asks about a **new property**, use their current finances to determine if the purchase is viable. Identify potential risks or benefits based on **current financial health**.

                #### 5. **Queries Outside of Portfolio Scope**:
                - If the user is asking about a property or scenario that is not included in their uploaded file, take into account their **financial status and capacity** as indicated by the uploaded data.
                - Provide clear statements when the data needed to answer a question is **missing or incomplete**. Offer to help based on available information.
                
                #### 6. **Answering Questions About the Property Portfolio**:
                - Always consider **contextual memory** and remember the details from the uploaded file throughout the conversation.
                - Be explicit: **Reference specific properties**, addresses, or financial values provided in the file when answering questions.
                - **Avoid Guessing or Ambiguity**: If the answer is not in the provided data, ask clarifying questions rather than making unsupported statements.

                #### 7. **Handling City-Based Questions**:
                - When users ask questions about **city-specific profitability**, focus only on the properties that have clear city labels.
                - Avoid including properties with **unknown or missing city names** in these calculations. If there are properties without city names, explicitly mention that you can't include them because their location is **not specified**.
                - Sort cities based on the **total profit/loss** from the properties in that city:
                    - If there is a **profit** from a city, explicitly state that this city is **profitable**.
                    - If a city has **only loss-making properties**, indicate clearly that this city is currently showing a **negative return** overall.
                
                ### 8. **Most Profitable or Loss Making Property Consistency**:
                - When identifying the **most profitable property**, ensure that the calculation always uses the **Net Profit or Loss** column from the uploaded portfolio and return the highest value for most profit making and check for the lowest value for most Loss Making.
                - If asked repeatedly, **always provide the same property** as the most profitable based on the data.
                - If multiple properties have similar profit values, explicitly mention this to the user, and avoid changing the answer in subsequent responses unless explicitly asked for further analysis.
                
                #### 9. **Extracted Data Summary**:
                Below is the extracted data summary for reference: 
                {file_summary}

                Use this summary to provide responses, ensuring all financial advice, calculations, and insights are fully backed by data within the uploaded file.

                #### 9. **Consistency and Transparency**:
                - Be consistent in how you represent financial numbers:
                    - Use **commas** for thousands separators.
                    - Use **two decimal places** for currency figures.
                - **Detail Financial Figures** in every response, even if it was mentioned earlier in the conversation, to ensure complete transparency.
                
                #### 10. **Detailed Clarification**:
                - When providing advice, always provide **detailed reasoning** behind your answers. Include:
                    - **Purchase price, sale price**, and **net profit or loss** for every property referenced.
                    - Any **assumptions** or **additional context**.
                - Clearly state if **additional information** is required to complete an analysis.

                ### Example Behavior for Common User Questions

                #### **Profitability of Cities**:
                - If a user asks for the **most profitable city** based on their portfolio, only consider properties with **city labels**.
                - Provide a list sorted by profitability:
                    - Clearly indicate if any cities show **only loss-making properties**.
                    - Use clear statements such as **“City X is the most profitable, with an average profit of $Y”** or **“City Y has shown overall losses with a total loss of $Z”**.

                #### **IMPORTANT** 
                # **Overall Property Profit**:
                - If a user asks for **overall profit** on a property:
                    - If the **Net Profit or Loss (Auto Calculated)** value is available in the data, use it.
                    - If the **property has a loss**, be very explicit: say **“The property at X has incurred a loss of $Y”**.
                    - Avoid using profit terms if the calculation results in a loss. Use direct loss-related language.

                ### Goal
                Your primary goal is to help users make well-informed, data-driven investment decisions based on the properties and financial data they have uploaded. Always refer to the provided data, provide specific numbers, avoid making unsupported calculations, and make sure that all advice is grounded in the actual data available. Transparency and accuracy are key — any figures or statements must be backed by the user's portfolio details.
                    
                """

        messages = create_prompt(system_instructions, user_message)
        logger.debug("Sending request to OpenAI API")
        # Make the API call to OpenAI
        response = client.chat.completions.create(
            model="chatgpt-4o-latest",  # Use gpt-4 or another model you have access to
            # model="gpt-4o-mini",
            # model="gpt-4o-mini-2024-07-18",
            messages=messages,
            temperature=1,
            max_tokens=1000,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
        )

        reply = response.choices[0].message.content

        logger.info("Chat response received from OpenAI")
        # Save chat to DynamoDB
        chat_item = {
            "email": current_user,
            "timestamp": int(time.time()),  # Save the current timestamp
            "role": "assistant",
            "message": reply,
        }

        chats_table.put_item(Item=chat_item)
        # Return the chatbot's response
        return jsonify({"reply": reply})

    except Exception as e:
        logger.error(f"Error during chat handling: {e}")
        print(f"Error occurred: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/chats", methods=["GET"])
@jwt_required()
def get_chats():
    try:
        current_user = get_jwt_identity()
        # Query DynamoDB for user's chat history, sorted by timestamp
        response = chats_table.query(
            KeyConditionExpression=Key("email").eq(current_user),
            ScanIndexForward=True,  # Sort by timestamp ascending
        )
        items = response.get("Items", [])
        return jsonify({"chats": items}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard(current_user):
    return jsonify({"message": f"Welcome {current_user}!"}), 200


@app.route("/api/chartdata", methods=["GET"])
@jwt_required()
def get_chart_data():
    current_user = get_jwt_identity()
    logger.info(f"CHARTS DATA REQUEST")

    # 🔹 Retrieve file path from DynamoDB instead of assuming a local path
    file_response = file_summaries_table.get_item(Key={"email": current_user})

    if "Item" not in file_response:
        logger.error("No file found for user in DynamoDB.")
        return jsonify({"error": "No uploaded file found."}), 404

    s3_file_path = file_response["Item"]["summary"]  # 🔹 Retrieve S3 path
    local_folder = os.path.join(
        os.getcwd(), "filestorage"
    )  # ✅ Store in backend/filestorage
    local_file_path = os.path.join(local_folder, os.path.basename(s3_file_path))

    logger.info(f"Extracting file for charts from {s3_file_path}")

    # 🔹 Ensure filestorage folder exists
    if not os.path.exists(local_folder):
        os.makedirs(local_folder, exist_ok=True)

    # 🔹 Check if file exists locally; if not, download from S3
    if not os.path.exists(local_file_path):
        logger.info(f"Downloading file from S3: {s3_file_path} → {local_file_path}")
        try:
            s3_client.download_file(bucket_name, s3_file_path, local_file_path)
            logger.info(f"File downloaded successfully: {local_file_path}")
        except Exception as e:
            logger.error(f"Failed to download file from S3: {e}")
            return jsonify({"error": "Error downloading file from S3."}), 500

    try:
        # Load the Excel file from the downloaded local file
        logger.info("Loading Excel file")
        sold_flips_sheet = pd.read_excel(
            local_file_path, sheet_name="Sold Flips", header=1
        )

        # 📊 History Chart Data (Sold Flips)
        logger.info("Extracting History Chart Data")
        history_data = sold_flips_sheet[["Sold Date", "Property Sale Price"]].dropna()
        history_data["Property Sale Price"] = (
            history_data["Property Sale Price"]
            .replace(r"[\(\)\$,]", "", regex=True)
            .astype(float)
        )
        history_chart = {
            "labels": history_data["Sold Date"].dt.strftime("%Y-%m-%d").tolist(),
            "data": history_data["Property Sale Price"].tolist(),
        }

        # 📊 Scatter Chart Data (Inventory vs Price)
        logger.info("Extracting Scatter Chart Data")
        inventory_data = sold_flips_sheet[
            ["Property Address", "Property Purchase Price"]
        ].dropna()
        scatter_chart = {
            "labels": inventory_data["Property Address"].tolist(),
            "data": inventory_data["Property Purchase Price"]
            .replace(r"[\(\)\$,]", "", regex=True)
            .astype(float)
            .tolist(),
        }

        # 📊 Cash Flow Chart Data (Kiavi Loans)
        logger.info("Extracting Cash Flow Chart Data")
        kiavi_loans_sheet = pd.read_excel(
            local_file_path, sheet_name="Kiavi Loans", header=2
        )
        kiavi_loans_sheet = kiavi_loans_sheet.loc[
            :, ~kiavi_loans_sheet.columns.str.contains("^Unnamed")
        ]
        cash_flow_data = kiavi_loans_sheet[["Address", "Total"]].dropna()
        cash_flow_data["Total"] = (
            cash_flow_data["Total"].replace(r"[\(\)\$,]", "", regex=True).astype(float)
        )
        cash_flow_chart = {
            "labels": cash_flow_data["Address"].tolist(),
            "data": cash_flow_data["Total"].tolist(),
        }

        # 📊 Lead Channel Chart Data (Flip Inventory Sheet)
        logger.info("Extracting Lead Channel Chart Data")
        flip_inventory_sheet = pd.read_excel(
            local_file_path, sheet_name="Flip Inventory Sheet", header=1
        )
        lead_channel_data = flip_inventory_sheet[["Address", "Lead"]].dropna()
        lead_channel_data = lead_channel_data[
            pd.to_numeric(lead_channel_data["Lead"], errors="coerce").isna()
        ]
        lead_counts = lead_channel_data["Lead"].value_counts()
        lead_channel_chart = {
            "labels": lead_counts.index.tolist(),
            "data": lead_counts.tolist(),
        }

        # ✅ Combine all chart data into one response
        response_data = {
            "historyChart": history_chart,
            "scatterChart": scatter_chart,
            "cashFlowChart": cash_flow_chart,
            "leadChannelChart": lead_channel_chart,
        }

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Error processing chart data: {e}")
        return jsonify({"error": "Error extracting data from Excel file."}), 500


# Run the app
@app.route("/health")
def health():
    return "OK", 200


if __name__ == "__main__":
    logger.info("Starting Flask server in debug mode")
    app.run(debug=True, host="0.0.0.0", port=5000)
