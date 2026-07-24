<div align="center">
  <img src="docs/screenshots/hero.jpg" alt="GridMap Studio Hero" width="100%" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" />
  <br />
  <br />

  <h1 style="border-bottom: none;">✨ AI-GIRL-FRIEND: 3D Studio & WebGL Companion ✨</h1>
  <p><strong>A futuristic, immersive 3D AI companion running directly in your browser. Powered by React, Three.js, and Vite.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/ThreeJs-black?style=for-the-badge&logo=three.js&logoColor=white" alt="Three.js" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  </p>
</div>

---

## 🌟 Immersive 3D Experience

Step into a beautifully rendered, interactive 3D world with your own AI companion. The application leverages advanced WebGL techniques to deliver an experience that bridges the gap between web development and next-gen gaming engines.

<br/>

## 📸 Comprehensive Features & Gallery

### 🎮 1. Free Camera & Dynamic Hero View
> Explore the 3D space freely with intuitive orbit controls, or let the camera dynamically track the character.
<div align="center">
  <img src="docs/screenshots/hero.jpg" alt="Hero View" width="90%" style="border-radius: 12px; border: 2px solid #333;" />
</div>

- **Interactive Eye Tracking**: The AI companion dynamically tracks your cursor, maintaining eye contact and adjusting her head rotation naturally.
- **Physics-Based Rendering**: High-quality PBR materials for realistic clothing and skin textures.

---

### 🎥 2. Cinematic Over-The-Shoulder Perspective
> Instantly switch to an immersive, RPG-style camera angle that follows the character's every move.
<div align="center">
  <img src="docs/screenshots/shoulder.jpg" alt="Over The Shoulder View" width="90%" style="border-radius: 12px; border: 2px solid #333;" />
</div>

- **Seamless Transitions**: The camera elegantly interpolates between the Free View and Over-The-Shoulder view without any jarring cuts.
- **Depth of Field**: Enjoy dynamic camera focusing algorithms that keep the character in sharp relief against the background.

---

### 💬 3. Intelligent AI Chat & Animated Tutorials
> Engage in deep, contextual conversations with a highly capable AI, complete with an elegant, glassmorphic UI.
<div align="center">
  <img src="docs/screenshots/chat.jpg" alt="AI Chat Interface" width="90%" style="border-radius: 12px; border: 2px solid #333;" />
</div>

- **Slash Commands**: Type `/help` to see a magical command autocomplete menu hover above the chat input, offering instant access to powerful features.
- **Embedded Tutorials**: Ask the AI questions and receive responses with **Inline Animated Tutorials** (such as simulated terminal windows) that play directly inside the Chat History panel!
- **Contextual Memory**: The AI remembers conversation history, providing a seamless and continuous interaction.

---

### 💃 4. Advanced Pose & Animation Laboratory
> Take full creative control over the 3D character model using a sleek, organized Animation Library drawer.
<div align="center">
  <img src="docs/screenshots/library.jpg" alt="Animation Library" width="90%" style="border-radius: 12px; border: 2px solid #333;" />
</div>

- **Hundreds of Presets**: Smoothly interpolate between hundreds of curated animations and idle states.
- **Real-time Previews**: Select animations from the UI grid to instantly preview them on the character model in the 3D world.
- **Custom IK Controls**: Granular Inverse Kinematics (IK) controls allow you to craft and save entirely custom bone rotations and poses.
- **Global Synchronization**: Your custom animations and poses are automatically saved and synchronized globally!

---

### 🎛️ 5. Comprehensive Scene & Lighting Settings
> Craft the perfect mood and aesthetic with robust environmental controls.
<div align="center">
  <img src="docs/screenshots/settings.jpg" alt="Scene Settings" width="90%" style="border-radius: 12px; border: 2px solid #333;" />
</div>

- **Volumetric Lighting**: Toggle dramatic moonlight, streetlamps, and ambient occlusion settings.
- **Cinematic Post-Processing**: Add intense film grain, bloom effects, and dynamic vignettes on the fly to simulate a real camera lens.
- **Environmental Controls**: Adjust starry sky density, procedural butterfly particle speeds, and color saturation in real time.

---

## 🚀 Installation & Getting Started

Launch the experience locally on your machine in just a few steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/freecandy-dev/AI-GIRL-FRIEND.git

# 2. Enter the project directory
cd AI-GIRL-FRIEND

# 3. Install dependencies
npm install

# 4. Start the Vite development server
npm run dev
```

Visit `http://localhost:5173` (or the port shown in your terminal) to experience the app!

## 🛠️ Architecture & Technologies

- **Core Framework**: React 18
- **3D Rendering**: `@react-three/fiber` & `@react-three/drei`
- **Physics**: `@react-three/rapier` for rigid bodies and colliders
- **Styling**: TailwindCSS (v3) + PostCSS
- **Build Tool**: Vite (Lightning fast HMR)

---

<div align="center">
  <p>Built with ❤️ by the freecandy-dev team.</p>
</div>
