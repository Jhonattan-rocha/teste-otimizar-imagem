import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import styled from 'styled-components';

// Styled Components
const VideoJSContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 20px auto;

  .video-js {
    width: 100%;
    height: auto;
  }
`;

const ControlsContainer = styled.div`
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

const VideoJSComponent: React.FC = () => {
  const videoNode = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<videojs.Player | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    // Capturar stream da câmera
    async function getCameraStream() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: true,
        });
        
        setStream(mediaStream);

        // Instanciar o Video.js
        if (videoNode.current) {
          const player = (playerRef.current = videojs(videoNode.current, {
            liveui: true,
            controls: true,
            width: 800,
            height: 450,
            fluid: false, // Desabilitar redimensionamento automático
            userActions: {
              hotkeys: false, // Desabilitar atalhos de teclado
            },
            playbackRates: [0.5, 1, 1.5, 2],
            sources: [{ src: URL.createObjectURL(mediaStream), type: 'video/webm' }],
          },
          () => {
            // Callback quando o player estiver pronto
            videojs.log('Video.js player is ready!');
          }));
        }

        // Gravação
        mediaRecorderRef.current = new MediaRecorder(mediaStream, {
          mimeType: 'video/webm;codecs=vp9',
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };
      } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        alert(
          'Erro ao acessar a câmera. Por favor, verifique as permissões do seu navegador.'
        );
      }
    }

    getCameraStream();

    return () => {
      // Limpar o player quando o componente for desmontado
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      //Limpar os objetos criados
      if (stream){
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Iniciar gravação
  const handleStartRecording = () => {
    mediaRecorderRef.current?.start();
    setRecording(true);
  };

  // Parar gravação
  const handleStopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
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

  return (
    <VideoJSContainer>
      <video ref={videoNode} className="video-js vjs-default-skin" playsInline />

      <ControlsContainer>
        <ControlButton onClick={handleStartRecording} disabled={recording}>
          {recording ? 'Gravando...' : 'Iniciar Gravação'}
        </ControlButton>
        <ControlButton onClick={handleStopRecording} disabled={!recording}>
          Parar Gravação
        </ControlButton>
        <ControlButton
          onClick={handleDownload}
          disabled={recordedChunks.length === 0}
        >
          Download
        </ControlButton>
      </ControlsContainer>
    </VideoJSContainer>
  );
};

export default VideoJSComponent;