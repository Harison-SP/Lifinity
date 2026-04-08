# Lifinity 🌱

Lifinity is a full-stack personal productivity and habit-tracking application designed to help you build better routines and optimize your life. It features a modern, "warm natural" premium design with an intuitive user interface, built with Angular and a FastAPI backend connected to MongoDB.

## Features ✨

*   **Daily & Monthly Habit Tracker**: Track your daily habits seamlessly with a beautiful calendar view.
*   **System Optimization Dashboard**: Get a comprehensive overview of your habit statistics and system metrics.
*   **Integrated Note-Taking**: Attach contextual notes directly to specific habits to record insights, progress, or reflections.
*   **System Manager**: Advanced multi-view architecture with a Table View for bulk editing system tasks, phases, and workflows.
*   **Premium "Warm Natural" Design**: High-quality visual aesthetic featuring rounded corners, gentle shadows, soothing color palettes (taupe, charcoal, orange, sage), and glassmorphic UI elements.
*   **Intuitive Pickers**: Make use of standard Angular Material date and time pickers for effortless form submissions.

## Tech Stack 🛠️

**Frontend:**
*   Angular
*   Angular Material
*   TailwindCSS (Custom "Warm Natural" Theme)

**Backend:**
*   Python
*   FastAPI
*   Uvicorn

**Database:**
*   MongoDB (with PyMongo)

## Prerequisites 📋

*   [Node.js](https://nodejs.org/) & npm
*   [Angular CLI](https://angular.io/cli) (`npm install -g @angular/cli`)
*   [Python 3.8+](https://www.python.org/)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas)

## Getting Started 🚀

### 1. Clone the repository
```bash
git clone <your-repository-url>
cd Lifinity
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, configure your environment variables, and start the FastAPI server.

```bash
cd Backend
pip install -r requirements.txt
# Create a .env file locally with your MongoDB connection string if needed.
uvicorn app.main:app --reload
```
The backend will run on `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the frontend directory, install dependencies, and start the Angular development server.

```bash
cd ../frontend
npm install
ng serve
```
The frontend will be accessible at `http://localhost:4200`.

## Architecture 🏗️

The project is structured with a distinct separation between client and server logic:
*   `frontend/`: Contains all Angular components, styling, and client-side logic for features like the Dashboard, Habit Details, System Manager, and Daily/Monthly Views.
*   `Backend/`: The FastAPI server containing API routes, database connections, schemas, and core Python logic.

## Contributing 🤝

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📜

Distributed under the MIT License. See `LICENSE` for more information.
