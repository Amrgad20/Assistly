import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type SpeechState =
  | 'idle'
  | 'recording'
  | 'processing';

interface SpeechResponse {

  raw_text: string;

  corrected_text: string;

  detected_language: string;

  language_probability: number;

}

@Injectable({
  providedIn: 'root'
})
export class SpeechService {

  private readonly api =
    'http://127.0.0.1:8000';

  private mediaRecorder: MediaRecorder | null = null;

  private mediaStream: MediaStream | null = null;

  private audioChunks: Blob[] = [];

  constructor(
    private http: HttpClient
  ) {}

  async toggleRecording(
    onText: (text: string) => void,
    onStateChange: (state: SpeechState) => void,
    onError: (message: string) => void
  ): Promise<void> {

    if (
      this.mediaRecorder &&
      this.mediaRecorder.state === 'recording'
    ) {

      this.stop();

      return;

    }

    try {

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {

        onError(
          'Audio recording is not supported by this browser.'
        );

        return;

      }

      this.mediaStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });

      this.audioChunks = [];

      const preferredMimeType =
        'audio/webm;codecs=opus';

      const fallbackMimeType =
        'audio/webm';

      const mimeType =
        MediaRecorder.isTypeSupported(
          preferredMimeType
        )
          ? preferredMimeType
          : fallbackMimeType;

      this.mediaRecorder = new MediaRecorder(
        this.mediaStream,
        MediaRecorder.isTypeSupported(mimeType)
          ? { mimeType }
          : undefined
      );

      this.mediaRecorder.ondataavailable = (
        event: BlobEvent
      ) => {

        if (event.data.size > 0) {

          this.audioChunks.push(
            event.data
          );

        }

      };

      this.mediaRecorder.onerror = () => {

        this.releaseMicrophone();

        onStateChange('idle');

        onError(
          'An error occurred while recording audio.'
        );

      };

      this.mediaRecorder.onstop = async () => {

        const recordedMimeType =
          this.mediaRecorder?.mimeType ||
          'audio/webm';

        const audioBlob = new Blob(
          this.audioChunks,
          {
            type: recordedMimeType
          }
        );

        this.releaseMicrophone();

        if (!audioBlob.size) {

          onStateChange('idle');

          onError(
            'No audio was recorded. Please try again.'
          );

          return;

        }

        onStateChange('processing');

        try {

          const result =
            await this.transcribeAudio(
              audioBlob
            );

          const text =
            (
              result.corrected_text ||
              result.raw_text
            ).trim();

          if (!text) {

            onError(
              'No speech was detected. Please try again.'
            );

            return;

          }

          onText(text);

        } catch (error) {

          console.error(
            'Speech transcription error:',
            error
          );

          onError(
            'The recorded audio could not be transcribed.'
          );

        } finally {

          onStateChange('idle');

        }

      };

      this.mediaRecorder.start();

      onStateChange('recording');

    } catch (error) {

      console.error(
        'Microphone access error:',
        error
      );

      this.releaseMicrophone();

      onStateChange('idle');

      onError(
        'Microphone access was denied or unavailable.'
      );

    }

  }

  stop(): void {

    if (
      this.mediaRecorder &&
      this.mediaRecorder.state === 'recording'
    ) {

      this.mediaRecorder.stop();

    }

  }

  private async transcribeAudio(
    audioBlob: Blob
  ): Promise<SpeechResponse> {

    const formData = new FormData();

    const audioFile = new File(
      [audioBlob],
      'voice-message.webm',
      {
        type:
          audioBlob.type ||
          'audio/webm'
      }
    );

    formData.append(
      'file',
      audioFile
    );

    return firstValueFrom(
      this.http.post<SpeechResponse>(
        `${this.api}/speech/transcribe`,
        formData
      )
    );

  }

  private releaseMicrophone(): void {

    this.mediaStream
      ?.getTracks()
      .forEach(track => track.stop());

    this.mediaStream = null;

    this.mediaRecorder = null;

    this.audioChunks = [];

  }

}
