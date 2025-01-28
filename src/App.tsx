// components/CameraCapture.tsx
import React, { useRef, useState, useEffect } from 'react';
import * as fabric from 'fabric';

const CameraCapture: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recordedMedia, setRecordedMedia] = useState<Blob[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  async function init(){
      // Initialize Fabric.js canvas lazily
      if (canvasRef.current && !fabricCanvas) {
        const canvas = new fabric.Canvas(canvasRef.current, {
          selection: true, // Enable object selection
        });
        setFabricCanvas(canvas);
      }
  }
  
  useEffect(() => {
    init()
  }, []);

  // Clean up Fabric.js on unmount
  useEffect(() => {
    return () => {
      fabricCanvas?.dispose();
    };
  }, [fabricCanvas]);

  // Start the camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Configure MediaRecorder for video recording
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedMedia((prev) => [...prev, event.data]);
          }
        };
      }
    } catch (err) {
      console.error('Error accessing the camera:', err);
    }
  };

  // Recording controls
  const startRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.start();
      console.log('Recording started');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      console.log('Recording stopped');
    }
  };

  // Handle image click for editing on Fabric.js
  const handleImageClick = (index: number) => {
    setSelectedImage(index);
    const url = URL.createObjectURL(recordedMedia[index]);

    fabric.FabricImage.fromURL(url, (img) => {
      img.set({
        left: 50,
        top: 50,
        scaleX: 0.5,
        scaleY: 0.5,
      });

      fabricCanvas?.clear(); // Clear previous canvas objects
      fabricCanvas?.add(img);
    });
  };

  // Download selected recording
  const handleDownload = () => {
    if (selectedImage !== null) {
      const url = URL.createObjectURL(recordedMedia[selectedImage]);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `recording-${selectedImage}.webm`;
      anchor.click();
      URL.revokeObjectURL(url);
    }
  };

  // Fabric.js utility functions
  const addText = () => fabricCanvas?.add(new fabric.Textbox('Text', { left: 100, top: 100 }));
  const addRectangle = () => fabricCanvas?.add(new fabric.Rect({ left: 100, top: 100, width: 100, height: 50, fill: 'red' }));
  const addCircle = () => fabricCanvas?.add(new fabric.Circle({ left: 100, top: 100, radius: 50, fill: 'blue' }));
  const deleteSelected = () => {
    const activeObject = fabricCanvas?.getActiveObject();
    activeObject && fabricCanvas?.remove(activeObject);
  };
  const clearCanvas = () => fabricCanvas?.clear();

  return (
    <div>
      {/* Camera and recording controls */}
      <button onClick={startCamera}>Start Camera</button>
      <button onClick={startRecording}>Start Recording</button>
      <button onClick={stopRecording}>Stop Recording</button>

      {/* Camera view and Fabric.js canvas */}
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <video ref={videoRef} autoPlay playsInline style={{ width: 320, height: 240 }} />
        <canvas ref={canvasRef} width={640} height={480} style={{ border: '1px solid black' }} />
      </div>

      {/* Recording thumbnails */}
      <h3>Recordings:</h3>
      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {recordedMedia.map((media, index) => (
          <video
            key={index}
            src={URL.createObjectURL(media)}
            controls
            width={160}
            height={120}
            onClick={() => handleImageClick(index)}
            style={{
              margin: 5,
              cursor: 'pointer',
              border: selectedImage === index ? '2px solid blue' : 'none',
            }}
          />
        ))}
      </div>

      {/* Editing tools */}
      {selectedImage !== null && (
        <div>
          <button onClick={handleDownload}>Download Recording</button>
          <h3>Edit Canvas:</h3>
          <button onClick={addText}>Add Text</button>
          <button onClick={addRectangle}>Add Rectangle</button>
          <button onClick={addCircle}>Add Circle</button>
          <button onClick={deleteSelected}>Delete Selected</button>
          <button onClick={clearCanvas}>Clear Canvas</button>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
