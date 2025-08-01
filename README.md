<p align = "center" draggable=”false” ><img src="https://github.com/AI-Maker-Space/LLM-Dev-101/assets/37101144/d1343317-fa2f-41e1-8af1-1dbb18399719" 
     width="200px"
     height="auto"/>
</p>


## <h1 align="center" id="heading"> 👋 Welcome to the AI Engineer Challenge</h1>

## 🤖 Your First Vibe Coding LLM Application

> **🎮 NEW: We've built you a sick retro-future terminal interface!** Check out the "Running the Retro Terminal Frontend" section below to experience the cyberpunk vibes! ✨

### 🚀 Quick Start (For the Impatient!)

Want to see the magic right now? Here's the fastest path:

1. **Start the backend (Terminal 1):**
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn app:app --host 127.0.0.1 --port 8000
   ```

2. **Start the frontend (Terminal 2 - open a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open your browser to `http://localhost:3000` and start vibing!** 🎮

4. **Configure your OpenAI API key:**
   - Type `/settings` in the terminal interface
   - Enter your OpenAI API key
   - Start chatting with the AI!

### 🔧 Local Development Quick Fixes

**Backend not starting?**
```bash
# Make sure you're in the right directory
cd api
# Try with reload for development
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend not starting?**
```bash
# Make sure you're in the frontend directory
cd frontend
# Clear node modules and reinstall if needed
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Backend health check:**
```bash
curl http://localhost:8000/api/health
# Should return: {"status":"ok"}
```

> If you are a novice, and need a bit more help to get your dev environment off the ground, check out this [Setup Guide](docs/GIT_SETUP.md). This guide will walk you through the 'git' setup you need to get started.

> For additional context on LLM development environments and API key setup, you can also check out our [Interactive Dev Environment for LLM Development](https://github.com/AI-Maker-Space/Interactive-Dev-Environment-for-AI-Engineers).

In this repository, we'll walk you through the steps to create a LLM (Large Language Model) powered application with a vibe-coded frontend!

Are you ready? Let's get started!

<details>
  <summary>🖥️ Accessing "gpt-4.1-mini" (ChatGPT) like a developer</summary>

1. Head to [this notebook](https://colab.research.google.com/drive/1sT7rzY_Lb1_wS0ELI1JJfff0NUEcSD72?usp=sharing) and follow along with the instructions!

2. Complete the notebook and try out your own system/assistant messages!

That's it! Head to the next step and start building your application!

</details>


<details>
  <summary>🏗️ Forking & Cloning This Repository</summary>

Before you begin, make sure you have:

1. 👤 A GitHub account (you'll need to replace `YOUR_GITHUB_USERNAME` with your actual username)
2. 🔧 Git installed on your local machine
3. 💻 A code editor (like Cursor, VS Code, etc.)
4. ⌨️ Terminal access (Mac/Linux) or Command Prompt/PowerShell (Windows)
5. 🔑 A GitHub Personal Access Token (for authentication)

Got everything in place? Let's move on!

1. Fork [this](https://github.com/AI-Maker-Space/The-AI-Engineer-Challenge) repo!

     ![image](https://i.imgur.com/bhjySNh.png)

1. Clone your newly created repo.

     ``` bash
     # First, navigate to where you want the project folder to be created
     cd PATH_TO_DESIRED_PARENT_DIRECTORY

     # Then clone (this will create a new folder called The-AI-Engineer-Challenge)
     git clone git@github.com:<YOUR GITHUB USERNAME>/The-AI-Engineer-Challenge.git
     ```

     > Note: This command uses SSH. If you haven't set up SSH with GitHub, the command will fail. In that case, use HTTPS by replacing `git@github.com:` with `https://github.com/` - you'll then be prompted for your GitHub username and personal access token.

2. Verify your git setup:

     ```bash
     # Check that your remote is set up correctly
     git remote -v

     # Check the status of your repository
     git status

     # See which branch you're on
     git branch
     ```

     <!-- > Need more help with git? Check out our [Detailed Git Setup Guide](docs/GIT_SETUP.md) for a comprehensive walkthrough of git configuration and best practices. -->

3. Open the freshly cloned repository inside Cursor!

     ```bash
     cd The-AI-Engineering-Challenge
     cursor .
     ```

4. Check out the existing backend code found in `/api/app.py`

</details>

<details>
  <summary>🔥Setting Up for Vibe Coding Success </summary>

While it is a bit counter-intuitive to set things up before jumping into vibe-coding - it's important to remember that there exists a gradient betweeen AI-Assisted Development and Vibe-Coding. We're only reaching *slightly* into AI-Assisted Development for this challenge, but it's worth it!

1. Check out the rules in `.cursor/rules/` and add theme-ing information like colour schemes in `frontend-rule.mdc`! You can be as expressive as you'd like in these rules!
2. We're going to index some docs to make our application more likely to succeed. To do this - we're going to start with `CTRL+SHIFT+P` (or `CMD+SHIFT+P` on Mac) and we're going to type "custom doc" into the search bar. 

     ![image](https://i.imgur.com/ILx3hZu.png)
3. We're then going to copy and paste `https://nextjs.org/docs` into the prompt.

     ![image](https://i.imgur.com/psBjpQd.png)

4. We're then going to use the default configs to add these docs to our available and indexed documents.

     ![image](https://i.imgur.com/LULLeaF.png)

5. After that - you will do the same with Vercel's documentation. After which you should see:

     ![image](https://i.imgur.com/hjyXhhC.png) 

</details>

<details>
  <summary>😎 Vibe Coding a Front End for the FastAPI Backend</summary>

1. Use `Command-L` or `CTRL-L` to open the Cursor chat console. 

2. Set the chat settings to the following:

     ![image](https://i.imgur.com/LSgRSgF.png)

3. Ask Cursor to create a frontend for your application. Iterate as much as you like!

4. Run the frontend using the instructions Cursor provided. 

> NOTE: If you run into any errors, copy and paste them back into the Cursor chat window - and ask Cursor to fix them!

> NOTE: You have been provided with a backend in the `/api` folder - please ensure your Front End integrates with it!

</details>

<details>
  <summary>🎮 Running the Retro Terminal Frontend</summary>

Great news! We've already created a **sick retro-future terminal interface** for you! Here's how to get it running:

### Prerequisites
- Make sure you have Node.js 18+ installed
- The backend API should be running on `http://localhost:8000`

### Quick Start

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if you haven't already):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser and go to:**
   ```
   http://localhost:3000
   ```

### 🎯 What You'll See

- A **cyberpunk-style terminal** with glowing green text and CRT effects
- **Real-time streaming chat** with AI models (text appears character by character!)
- **Built-in terminal commands** like `/help`, `/clear`, `/settings`, `/status`
- **Retro animations** including scan lines and pulsing effects
- **Secure password input** for your OpenAI API key
- **Responsive design** that works on all devices

### 🔧 Configuration

1. Type `/settings` in the terminal to open the config panel
2. Enter your OpenAI API key (required for chat functionality)
3. Select your preferred AI model (GPT-4, GPT-4.1-mini, GPT-3.5-turbo)
4. Customize the system prompt/developer message
5. Start chatting! 🤖

### 🚨 Troubleshooting

- **"npm run dev" not working?** Make sure you're in the `frontend` directory, not the root!
- **API connection issues?** Ensure the backend is running on port 8000 (see backend setup below)
- **Styling looks weird?** Run `npm install` to ensure all dependencies are installed
- **TypeScript errors?** The app should still work, but run `npm install` to fix type definitions

The terminal is fully functional and ready to rock! 🚀

</details>

<details>
  <summary>🐍 Setting Up the Backend API</summary>

Before your frontend can work its magic, you need to get the backend running! Here's how:

### Prerequisites
- Python 3.8+ installed
- pip package manager

### Quick Setup

1. **Navigate to the API directory:**
   ```bash
   cd api
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the backend server:**
   ```bash
   uvicorn app:app --host 127.0.0.1 --port 8000
   ```

4. **Verify it's working:**
   ```bash
   curl http://localhost:8000/api/health
   ```
   You should see: `{"status": "ok"}`

### 🎯 What the Backend Does

- **FastAPI-powered** REST API
- **Streaming responses** from OpenAI's API
- **CORS enabled** for frontend communication
- **Health check endpoint** for monitoring
- **Error handling** with proper HTTP status codes

### 🚨 Backend Troubleshooting

- **"No module named uvicorn"?** Run `pip install -r requirements.txt` again
- **Port 8000 already in use?** Kill existing processes: `pkill -f uvicorn`
- **Import errors?** Make sure you're in the `api` directory when running commands
- **Connection refused?** Check that the server is running on the correct host/port

### 🔧 Alternative Startup Methods

If the above doesn't work, try:
```bash
# Method 1: Direct Python execution
python app.py

# Method 2: Different host binding
uvicorn app:app --host 0.0.0.0 --port 8000

# Method 3: With reload for development
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

Once both frontend and backend are running, you're ready to experience the full retro terminal magic! ✨

</details>

<details>
  <summary>🚀 Deploying Your First LLM-powered Application with Vercel</summary>

1. Ensure you have signed into [Vercel](https://vercel.com/) with your GitHub account.

2. Ensure you have `npm` (this may have been installed in the previous vibe-coding step!) - if you need help with that, ask Cursor!

3. Run the command:

     ```bash
     npm install -g vercel
     ```

4. Run the command:

     ```bash
     vercel
     ```

5. Follow the in-terminal instructions. (Below is an example of what you will see!)

     ![image](https://i.imgur.com/D1iKGCq.png)

6. Once the build is completed - head to the provided link and try out your app!

> NOTE: Remember, if you run into any errors - ask Cursor to help you fix them!

</details>

### Vercel Link to Share

You'll want to make sure you share you *domains* hyperlink to ensure people can access your app!

![image](https://i.imgur.com/mpXIgIz.png)

> NOTE: Test this is the public link by trying to open your newly deployed site in an Incognito browser tab!

### 🎉 Congratulations! 

You just deployed your first LLM-powered application! 🚀🚀🚀 Get on linkedin and post your results and experience! Make sure to tag us at @AIMakerspace!

Here's a template to get your post started!

```
🚀🎉 Exciting News! 🎉🚀

🏗️ Today, I'm thrilled to announce that I've successfully built and shipped my first-ever LLM using the powerful combination of , and the OpenAI API! 🖥️

Check it out 👇
[LINK TO APP]

A big shoutout to the @AI Makerspace for all making this possible. Couldn't have done it without the incredible community there. 🤗🙏

Looking forward to building with the community! 🙌✨ Here's to many more creations ahead! 🥂🎉

Who else is diving into the world of AI? Let's connect! 🌐💡

#FirstLLMApp 
```
