/**
 * Service for recording voice notes and audio clips in browser
 */

export interface AudioRecorderState {
  isRecording: boolean;
  duration: number; // in seconds
  audioBlob: Blob | null;
  audioUrl: string | null;
  base64Data: string | null;
}

export class AudioRecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private timerInterval: NodeJS.Timeout | null = null;
  private stream: MediaStream | null = null;
  private startTime: number = 0;

  async startRecording(onDurationTick?: (seconds: number) => void): Promise<boolean> {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Gravação de áudio não suportada neste navegador.');
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);

      if (onDurationTick) {
        this.timerInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
          onDurationTick(elapsed);
        }, 500);
      }

      return true;
    } catch (err) {
      console.warn('Microphone access error or denied:', err);
      return false;
    }
  }

  async stopRecording(): Promise<{
    blob: Blob;
    url: string;
    base64: string;
    duration: number;
  }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Gravador não inicializado'));
        return;
      }

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      const duration = Math.max(1, Math.floor((Date.now() - this.startTime) / 1000));

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Convert to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Stop stream tracks
          if (this.stream) {
            this.stream.getTracks().forEach((track) => track.stop());
            this.stream = null;
          }
          resolve({ blob: audioBlob, url: audioUrl, base64, duration });
        };
        reader.onerror = () => {
          resolve({ blob: audioBlob, url: audioUrl, base64: audioUrl, duration });
        };
      };

      this.mediaRecorder.stop();
    });
  }

  cancel(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignore
      }
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.audioChunks = [];
  }
}
