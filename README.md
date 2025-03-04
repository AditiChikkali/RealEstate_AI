# 🏡 RealEstateAI
RealEstateAI is a web application designed to streamline real estate data analysis using AI. Built with **React,  and Flask**, this project allows users to upload Excel files, visualize data through interactive charts, and chat with an AI assistant to gain insights.

## 🚀 **Features**
- 📊 Upload Excel files and generate dynamic charts.
- 🤖 AI-powered chat assistant for data insights.
- 🌐 RESTful API with Flask for backend operations.
- 🗄️ Integration with DynamoDB and S3 for data storage.


![login](https://github.com/user-attachments/assets/89155751-4c98-45b9-b15e-14354f236441)

---

![upload](https://github.com/user-attachments/assets/7a18fd9c-a853-4d20-9366-a6623e92a32b)

---

![charts](https://github.com/user-attachments/assets/a00328e0-f5a4-4d51-a8d2-50778146f843)

---

## System Architecture

![sysdesign drawio (3)](https://github.com/user-attachments/assets/e869b37d-6f64-4fce-8186-0098632851a2)

## 🛠 **Tech Stack**
- **Frontend:** React
- **Backend:** Flask, Python
- **Database:** DynamoDB, S3
- **APIs:** OpenAI api



## 📦 **Installation**


1.Clone the Repository
```bash
git clone https://github.com/AditiChikkali/RealEstate_AI.git
cd RealEstateAI

2.Install Dependencies

Frontend:
Navigate to the `client` directory (or the folder containing your React code) and run:

```bash
cd client
npm install
Backend:
```bash
cd Backend  # or the folder containing your FastAPI code
pip install -r requirements.txt

---

3.Create env files
Create a .env file in both client and server directories.

Frontend .env:

REACT_APP_BACKEND_URL=http://localhost:8000

Backend .env:
API_KEY = your_secret_key
ORGANIZATION = your_secret_key
PROJECT_ID= your_secret_key

AWS_S3_ACCESS_KEY=your_secret_key
AWS_S3_SECRET_KEY=your_secret_key

JWT_SECRET_KEY=your_secret_key

AWS_ACCESS_KEY = your_secret_key
AWS_SECRET_KEY = your_secret_key


#Local File PAth
Filestorage= filestorage

---

4.Run the Application
Start the Backend:
```bash
python app.py

Start the Frontend:
```bash
cd Frontend
npm run start
