# Docker TeslaCam Player

A Dockerized web application for viewing and exporting TeslaCam clips. This project is a modernized and enhanced version of the original, with support for all modern Tesla cameras, a simple login system, and clip export functionality.

## Features

-   **Modern Camera Support:** View clips from all modern Tesla cameras, including side repeaters, cabin, and pillar cameras.
-   **Simple Authentication:** Protect your clips with a simple username/password login system.
-   **Clip Export:** Select a time range and export a picture-in-picture MP4 file of your clips.
-   **Dockerized:** Easy to deploy and manage on Unraid or any other Docker host.
-   **Responsive UI:** The web interface is designed to work on both desktop and mobile devices.

## Prerequisites

-   Docker installed on your Unraid server.
-   Your TeslaCam clips accessible from your Unraid server (e.g., via a mounted USB drive or a network share).

## Installation on Unraid

**Manual Installation (Docker Run):**
    -   Open a terminal on your Unraid server or use the "Docker" tab in the web UI.
    -   Run the following command, replacing the placeholder values with your own:

        ```bash
        docker run -d \
          --name=teslacam-player \
          -p 3000:3000 \
          -v /mnt/user/appdata/teslacam:/clips \
          -e TESLA_USERNAME=your_username \
          -e TESLA_PASSWORD=your_password \
          lordvaderxiii/docker-teslacamplayer
        ```

    -   **Explanation of Parameters:**
        -   `--name=teslacam-player`: A name for the container.
        -   `-p 3000:3000`: Maps the container's port 3000 to the host's port 3000.
        -   `-v /mnt/user/appdata/teslacam:/clips`: Mounts your TeslaCam clips directory to the `/clips` directory in the container. **Replace `/mnt/user/appdata/teslacam` with the actual path to your clips.**
        -   `-e TESLA_USERNAME=your_username`: Sets the username for the login system.
        -   `-e TESLA_PASSWORD=your_password`: Sets the password for the login system.

## Usage

1.  Open your web browser and navigate to `http://<your-unraid-ip>:3000`.
2.  Log in with the username and password you configured.
3.  The application will automatically load the clips from your mounted `/clips` directory.
4.  Use the dropdown menu to select a clip to view.
5.  Use the playback controls to play, pause, and seek through the videos.
6.  To export a clip, use the sliders to select a start and end time, then click the "Export" button.

## Troubleshooting

-   **"No Videos Loaded" message:** Make sure you have selected the correct `TeslaCam` directory and that it contains valid clip files.
-   **Export fails:** Ensure that you have sufficient disk space and that the container has the necessary permissions to write to the output directory.
-   **Login fails:** Double-check that you have set the `TESLA_USERNAME` and `TESLA_PASSWORD` environment variables correctly.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
