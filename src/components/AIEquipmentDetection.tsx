import React, { useEffect, useRef, useState } from 'react';
// register both CPU and WebGL backends
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';

export function AIEquipmentDetection() {
  const webcamRef = useRef<Webcam>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<cocoSsd.DetectedObject[]>([]);

  // 1️⃣ Load the model once
  useEffect(() => {
    async function load() {
      try {
        await tf.ready();
        await tf.setBackend('webgl');
        const m = await cocoSsd.load();
        setModel(m);
      } catch (err: any) {
        console.error('Error loading model:', err);
        setError('Failed to load detection model. Please check your browser.');
      }
    }
    load();
  }, []);

  // 2️⃣ Once model is ready, run detection on the video every second
  useEffect(() => {
    if (!model) return;
    const interval = setInterval(async () => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        try {
          const video = webcamRef.current.video as HTMLVideoElement;
          const preds = await model.detect(video);
          setPredictions(preds);
        } catch (err: any) {
          console.error('Error analyzing frame:', err);
          setError('Analysis failed. Try again later.');
        }
      }
    }, 1000); // adjust interval as needed

    return () => clearInterval(interval);
  }, [model]);

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded">
        {error}
      </div>
    );
  }

  if (!model) {
    return (
      <div className="p-4 text-gray-700">
        Loading detection model…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: 'environment'
        }}
        className="w-full h-auto rounded-lg border"
      />

      {predictions.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-semibold mb-2">Detected Items:</h4>
          <ul className="list-disc list-inside space-y-1">
            {predictions.map((p, i) => (
              <li key={i}>
                {p.class} — {(p.score * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}