The "externally-managed-environment" error you're seeing when using `pip` is a safety measure to prevent you from accidentally breaking your system's core Python installation. This error is common on certain Linux distributions, particularly Debian-based ones like Ubuntu, that use a **system-wide Python** managed by the operating system's package manager (`apt`).

### Why It Happens

Your operating system relies on specific Python packages to function correctly. If you were to use `pip` to install, update, or remove these packages, it could create conflicts or dependencies that your OS isn't aware of, potentially causing system tools to stop working. The `externally-managed-environment` error is a warning that prevents this from happening.

-----

### How to Fix It

The best and safest way to fix this issue is to use a **virtual environment**. A virtual environment is an isolated, self-contained Python installation that you can use for your project without affecting the system's core Python. 🧪

Here are the steps to create and use a virtual environment:

1.  **Create a virtual environment:**

    ```bash
    python3 -m venv venv
    ```

    This command creates a new directory named `venv` (you can name it whatever you want) in your current project folder. This directory will contain the virtual environment's Python interpreter and its own `pip` tool.

2.  **Activate the virtual environment:**

      * **On Linux/macOS:**
        ```bash
        source venv/bin/activate
        ```
      * **On Windows:**
        ```bash
        venv\Scripts\activate
        ```

    After running this command, your command prompt will change to show the name of the virtual environment (e.g., `(venv) your-username@your-computer`). This indicates that you are now working inside the isolated environment.

3.  **Install your packages:**
    Now that you're in the virtual environment, you can safely use `pip` to install the packages from your `requirements.txt` file.

    ```bash
    pip install -r requirements.txt
    ```

    All the packages will be installed within the `venv` directory, so they won't interfere with your system's Python installation.

4.  **Deactivate the environment:**
    Once you're done working on your project, you can exit the virtual environment by simply typing:

    ```bash
    deactivate
    ```

    This will return you to your system's regular command prompt.

By using a virtual environment, you ensure that your project's dependencies are separate from your system's, preventing potential conflicts and keeping your system stable.
