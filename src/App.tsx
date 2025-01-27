import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

interface VideoContainerProps {
  recording: boolean;
}

const VideoContainer = styled.div<VideoContainerProps>`
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  border: 5px solid ${(props) => (props.recording ? 'red' : 'green')};
  border-radius: 10px;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  overflow: hidden;
`;

const VideoElement = styled.video`
  width: 100%;
  height: auto;
  background: #000; /* Cor de fundo enquanto a câmera carrega */
`;

const ControlsContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${VideoContainer}:hover & {
    opacity: 1;
  }
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
  margin: 0 5px;
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

const CameraComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState<boolean>(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  // Capturar o stream da câmera
  useEffect(() => {
    async function getCameraStream() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 }, // Resolução desejada
            height: { ideal: 1080 },
            facingMode: 'user', // Câmera frontal
          },
          audio: true, // Capturar áudio também
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Erro ao acessar a câmera:', error);
        alert('Erro ao acessar a câmera. Por favor, verifique as permissões do seu navegador.');
      }
    }

    getCameraStream();

    return () => {
      // Limpar o stream quando o componente for desmontado
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Iniciar a gravação
  const handleStartRecording = () => {
    if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9', // Codec de vídeo eficiente
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                setRecordedChunks((prev) => [...prev, event.data]);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            // Lógica para lidar com o fim da gravação (pode ser movida para um handler separado)
        };

        mediaRecorderRef.current.start();
        setRecording(true);
    }
  };

  // Parar a gravação
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Download do vídeo gravado (simulação de salvamento no filesystem)
  const handleDownload = () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = `gravacao-${new Date().toISOString()}.webm`; // Nome do arquivo com timestamp
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Limpar os chunks após o download
      setRecordedChunks([]);
    }
  };

  return (
    <VideoContainer recording={recording}>
      <VideoElement ref={videoRef} autoPlay playsInline muted />
      <ControlsContainer>
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
    </VideoContainer>
  );
};

export default CameraComponent;