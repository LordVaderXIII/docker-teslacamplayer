# Contributing to Docker TeslaCam Player

We welcome contributions from the community! Whether you're a developer, a designer, or just an enthusiastic user, there are many ways to get involved.

## How to Contribute

-   **Report bugs:** If you find a bug, please open an issue on GitHub and provide as much detail as possible.
-   **Suggest enhancements:** If you have an idea for a new feature or an improvement to an existing one, please open an issue on GitHub to discuss it.
-   **Submit pull requests:** If you'd like to contribute code, please fork the repository and submit a pull request with your changes.

## Development Setup

1.  **Prerequisites:**
    -   Node.js and npm
    -   Docker

2.  **Clone the repository:**
    ```bash
    git clone https://github.com/LordVaderXIII/docker-teslacamplayer.git
    cd docker-teslacamplayer
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Run the application:**
    ```bash
    node server.js
    ```

5.  **Build the Docker image:**
    ```bash
    docker build -t teslacam-player .
    ```

## Project Structure

-   `server.js`: The main Express server file.
-   `index.html`: The main HTML file for the video player.
-   `login.html`: The HTML file for the login page.
-   `Dockerfile`: The Dockerfile for building the application image.
-   `package.json`: The Node.js project file.

## Contribution Guidelines

-   Please follow the existing code style.
-   Please make sure your code is well-tested.
-   Please write clear and concise commit messages.
-   Please be respectful of other contributors.

We look forward to your contributions!
