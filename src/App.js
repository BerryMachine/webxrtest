import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// Main App component
const App = () => {
  // Ref for the canvas element where the Three.js scene will be rendered
  const canvasRef = useRef(null);
  // State to hold the WebXR session object
  const [xrSession, setXrSession] = useState(null);
  // State to check if WebXR is available on the device
  const [isXRAvailable, setIsXRAvailable] = useState(false);
  // State to track if the Three.js scene has been initialized
  const [isSceneInitialized, setIsSceneInitialized] = useState(false);

  // Use refs for Three.js objects to persist across renders without causing re-renders
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cubeRef = useRef(null); // Ref for our placeholder cube

  // Effect to check WebXR availability when the component mounts
  useEffect(() => {
    if ('xr' in navigator) {
      // Check if an immersive AR session is supported
      navigator.xr.isSessionSupported('immersive-ar')
        .then((supported) => {
          setIsXRAvailable(supported);
        })
        .catch((error) => {
          console.error("WebXR not supported or error checking session:", error);
          setIsXRAvailable(false);
        });
    } else {
      console.warn("WebXR not available in this browser.");
      setIsXRAvailable(false);
    }
  }, []); // Empty dependency array means this runs once on mount

  // Effect for setting up and tearing down the Three.js scene and WebXR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // Exit if canvas is not available

    // Initialize scene, camera, and renderer only once
    if (!isSceneInitialized) {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true, // Enable transparency for AR
        antialias: true
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true; // Enable WebXR for the renderer
      rendererRef.current = renderer;

      // Add a simple cube as a placeholder for the GSplat model
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2); // Small cube
      const material = new THREE.MeshNormalMaterial(); // Material showing normals
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0, -0.5); // Position it slightly in front of the camera
      scene.add(cube);
      cubeRef.current = cube;

      // Add a light source for better visibility
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(0, 1, 1);
      scene.add(directionalLight);

      setIsSceneInitialized(true);
    }

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const cube = cubeRef.current;

    // Animation loop for rendering the scene
    const animate = (timestamp, frame) => {
      if (renderer && scene && camera) {
        // In an XR session, the camera's position and orientation are automatically updated
        // by the WebXRManager. We just need to render the scene.

        // You could add animations to your placeholder cube here, e.g., rotation
        if (cube) {
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
        }

        renderer.render(scene, camera);
      }
    };

    // Set the animation loop for the renderer
    if (renderer) {
      renderer.setAnimationLoop(animate);
    }

    // Handle window resize to keep the canvas responsive
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function when component unmounts or dependencies change
    return () => {
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.setAnimationLoop(null); // Stop the animation loop
        renderer.dispose(); // Dispose of the renderer
      }
      if (scene) {
        scene.clear(); // Clear the scene
      }
      // Clean up geometry and materials to prevent memory leaks
      if (cubeRef.current) {
        cubeRef.current.geometry.dispose();
        cubeRef.current.material.dispose();
      }
    };
  }, [isSceneInitialized]); // Re-run only when scene initialization state changes

  // Function to request an XR session
  const handleEnterXR = useCallback(async () => {
    if (!isXRAvailable || !rendererRef.current) {
      console.warn("WebXR not available or renderer not initialized.");
      return;
    }

    try {
      // Request an 'immersive-ar' session
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local', 'hit-test'], // 'local' for basic tracking, 'hit-test' for placing objects
        optionalFeatures: ['dom-overlay'], // Optional for UI overlay
      });

      // Set the session for the renderer
      rendererRef.current.xr.setSession(session);
      setXrSession(session);

      // Listen for session end
      session.addEventListener('end', () => {
        setXrSession(null);
        console.log("XR Session ended.");
      });

      console.log("XR Session started successfully!");

    } catch (error) {
      console.error("Failed to start XR session:", error);
      // You might want to display a user-friendly error message here
    }
  }, [isXRAvailable]);

  // Function to exit the XR session
  const handleExitXR = useCallback(() => {
    if (xrSession) {
      xrSession.end(); // Request to end the session
    }
  }, [xrSession]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 font-inter text-white relative overflow-hidden">
      {/* Canvas for Three.js rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        // REMOVED: style={{ backgroundColor: 'blue' }}
      ></canvas>

      <div className="absolute bottom-8 flex space-x-4 z-10">
        {!xrSession ? (
          <button
            onClick={handleEnterXR}
            disabled={!isXRAvailable}
            className={`px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300
              ${isXRAvailable ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-gray-500 cursor-not-allowed'}
              focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50
            `}
          >
            {isXRAvailable ? 'Enter AR' : 'AR Not Available'}
          </button>
        ) : (
          <button
            onClick={handleExitXR}
            className="px-6 py-3 rounded-full text-lg font-semibold bg-red-600 hover:bg-red-700 shadow-lg
              transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50
            "
          >
            Exit AR
          </button>
        )}
      </div>

      {/* Tailwind CSS CDN for styling */}
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>
        {`
          body { font-family: 'Inter', sans-serif; margin: 0; overflow: hidden; }
          #root { height: 100vh; width: 100vw; }
        `}
      </style>
    </div>
  );
};

export default App;
