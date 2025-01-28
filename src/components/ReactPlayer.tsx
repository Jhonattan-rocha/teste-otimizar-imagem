import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';
import styled from 'styled-components';

// Styled Components
const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 20px auto;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  // Responsividade para manter a proporção 16:9
  padding-top: 56.25%; // 16:9 Aspect Ratio (9 / 16 = 0.5625)

  .react-player {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const ControlsContainer = styled.div`
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${PlayerContainer}:hover & {
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

const ReactPlayerCameraComponent: React.FC = () => {
  const playerRef = useRef<ReactPlayer>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Capturar stream da câmera
  React.useEffect(() => {
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
        //Limpar os objetos criados
        if (stream){
          const tracks = stream.getTracks();
          tracks.forEach(track => track.stop());
        }
    }
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
    <PlayerContainer>
      <ReactPlayer
        ref={playerRef}
        className="react-player"
        url={stream}
        width="100%"
        height="100%"
        playing={true}
        muted={true} // Evitar feedback de áudio durante o desenvolvimento
        controls={false} // Usaremos nossos próprios controles
        config={{
            file: {
              attributes: {
                playsInline: true, // Importante para iOS Safari
              },
            },
          }}
      />
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
    </PlayerContainer>
  );
};

export default ReactPlayerCameraComponent;