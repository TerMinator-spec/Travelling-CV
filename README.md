# Travelling CV

A full-stack web application designed for travelers to document their journeys, share experiences, and collaborate on future trips. Built with a modern tech stack to provide a rich, interactive user experience.

## Tech Stack

*   **Frontend:** Next.js (React), CSS Modules
*   **Backend:** Node.js, Express.js
*   **Database:** SQLite (via \`better-sqlite3\`)
*   **Containerization:** Docker & Docker Compose

## Getting Started (Local Development)

The easiest way to run the application locally is using Docker. This ensures that the frontend, backend, and database all run consistently regardless of your operating system.

### Prerequisites

*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Installation

1.  Clone the repository:
    \`\`\`bash
    git clone <your-repository-url>
    cd travelling-cv
    \`\`\`

2.  Start the application using Docker Compose:
    \`\`\`bash
    docker-compose up -d --build
    \`\`\`

3.  Access the application:
    *   **Frontend UI:** [http://localhost:3000](http://localhost:3000)
    *   **Backend API:** [http://localhost:5000](http://localhost:5000)

### Stopping the Application

To stop the running containers, run:
\`\`\`bash
docker-compose down
\`\`\`

## Architecture Notes

*   **Data Persistence:** The SQLite database is stored in \`server/data/travelling-cv.db\`. Uploaded images are stored in \`server/uploads/\`. In a production environment, you may want to migrate to an external database (like PostgreSQL) and external object storage (like AWS S3) for better scalability.
*   **Docker Volumes:** This repository uses Docker volumes to ensure that your database and user uploads are not lost when the containers are stopped or rebuilt.

## Deployment to AWS EC2

This application is ready to be deployed to an AWS EC2 instance. Follow the guide provided in documentation/conversation to set up an Ubuntu server with Docker and Nginx.
