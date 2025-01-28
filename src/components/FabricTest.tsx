import React, { useState, useEffect, useRef } from 'react';
import fabric from 'fabric';
import styled from 'styled-components';

// Styled Components
const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  border: 5px solid green;
  border-radius: 10px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const ControlsContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
`;

const ControlButton = styled.button`
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #3e8e41;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const FabricCameraComponent: React.FC = () => {
  const canvasRef = useRef<string | HTMLCanvasElement | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    // Inicializar o canvas do Fabric.js
    fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#000', // Cor de fundo do canvas
      width: 800,
      height: 600,
    });

    // Capturar stream da câmera
    async function getCameraStream() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 800 },
            height: { ideal: 600 },
            facingMode: 'user',
          },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }

        // Renderizar vídeo no canvas a cada frame
        const renderVideoOnCanvas = () => {
          if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
            return;
          }

          const video = new fabric.Image(videoRef.current, {
            left: 0,
            top: 0,
            width: fabricCanvasRef.current?.width,
            height: fabricCanvasRef.current?.height,
            objectCaching: false, // Importante para vídeo
          });

          fabricCanvasRef.current?.clear();
          fabricCanvasRef.current?.add(video);
          fabricCanvasRef.current?.renderAll();

          requestAnimationFrame(renderVideoOnCanvas);
        };
        requestAnimationFrame(renderVideoOnCanvas);

        // Gravação
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };
      } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        alert('Erro ao acessar a câmera. Por favor, verifique as permissões do seu navegador.');
      }
    }

    getCameraStream();

    return () => {
        //Limpar os objetos criados
        fabricCanvasRef.current?.dispose();
        if (videoRef.current?.srcObject){
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
    }
  }, []);

  // Iniciar gravação
  const handleStartRecording = () => {
    mediaRecorderRef.current?.start();
    setRecording(true);
    
    //Adicionar um quadrado vermelho como marca
    const rect = new fabric.Rect({
        left: fabricCanvasRef.current?.width ? fabricCanvasRef.current.width - 40 : 800 - 40,
        top: 10,
        fill: 'red',
        width: 30,
        height: 30,
        objectCaching: false
      });
  
      fabricCanvasRef.current?.add(rect);
  };

  // Parar gravação
  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);

    // Remover o quadrado vermelho
    const objects = fabricCanvasRef.current?.getObjects() || [];
    const rect = objects.find(obj => obj.type === 'rect' && obj.get('fill') === 'red');
    if (rect) {
        fabricCanvasRef.current?.remove(rect);
    }
  };

  // Download do vídeo
  const handleDownload = () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = `gravacao-${new Date().toISOString()}.webm`;
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setRecordedChunks([]);
    }
  };

  // Adicionar texto
  const handleAddText = () => {
    const text = new fabric.Textbox('Seu Texto Aqui', {
      left: 50,
      top: 50,
      fontSize: 20,
      fill: 'white',
      editable: true,
    });
    fabricCanvasRef.current?.add(text);
    fabricCanvasRef.current?.setActiveObject(text);
  };

   // Adicionar formas
   const handleAddCircle = () => {
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'green',
        stroke: 'blue',
        strokeWidth: 3
    });
    fabricCanvasRef.current?.add(circle);
};

const handleAddRectangle = () => {
    const rect = new fabric.Rect({
        left: 200,
        top: 200,
        fill: 'red',
        width: 60,
        height: 40
    });
    fabricCanvasRef.current?.add(rect);
};

  return (
    <CanvasContainer>
      <canvas ref={canvasRef} />
      <video ref={videoRef} style={{ display: 'none' }} playsInline />
      <ControlsContainer>
      <ControlButton onClick={handleAddText}>
          Adicionar Texto
        </ControlButton>
        <ControlButton onClick={handleAddCircle}>
          Círculo
        </ControlButton>
        <ControlButton onClick={handleAddRectangle}>
          Retângulo
        </ControlButton>
        <ControlButton onClick={handleStartRecording} disabled={recording}>
          {recording ? 'Gravando...' : 'Iniciar Gravação'}
        </ControlButton>
        <ControlButton onClick={handleStopRecording} disabled={!recording}>
          Parar Gravação
        </ControlButton>
        <ControlButton onClick={handleDownload} disabled={recordedChunks.length === 0}>
          Download
        </ControlButton>
      </ControlsContainer>
    </CanvasContainer>
  );
};

export default FabricCameraComponent;